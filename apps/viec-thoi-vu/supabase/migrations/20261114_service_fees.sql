-- Service fee per finished shift, with a voucher that takes some or all of it off.
--   · The price is app_settings.fee_per_shift (đồng, per worker per finished shift). The voucher is fee_voucher_pct (0–100) with a name.
--     Both are changed by an admin (admin_set_fee); 100% = free. Lower the voucher step by step later (e.g. 100 → 50 → 0).
--   · When a shift finishes (pay_status becomes 'released') one row goes into service_fees with the price and the voucher of THAT moment,
--     so changing the price later never changes old shifts. No-shows and cancelled shifts are never charged. Workers never pay.
--   · NOTHING is charged here: payments stay off. This is a ledger the shop and the admin can read.
insert into public.app_settings (key, value) values
  ('fee_per_shift', '12000'), ('fee_voucher_pct', '100'), ('fee_voucher_name', 'Ưu đãi ra mắt')
on conflict (key) do nothing;

create table if not exists public.service_fees (
  application_id uuid primary key references public.applications (id) on delete cascade,
  employer_id uuid not null references public.profiles (id) on delete cascade,
  job_id uuid not null references public.jobs (id) on delete cascade,
  fee int not null check (fee >= 0),
  discount int not null check (discount >= 0 and discount <= fee),
  due int generated always as (fee - discount) stored,
  voucher text,
  created_at timestamptz not null default now()
);
create index if not exists service_fees_employer on public.service_fees (employer_id, created_at desc);
alter table public.service_fees enable row level security;
revoke all on public.service_fees from anon, authenticated;

create or replace function private.fee_plan() returns table (fee int, pct int, name text)
language sql stable security definer set search_path = public as $$
  select greatest(0, coalesce((select nullif(value, '')::int from public.app_settings where key = 'fee_per_shift'), 0)),
         least(100, greatest(0, coalesce((select nullif(value, '')::int from public.app_settings where key = 'fee_voucher_pct'), 0))),
         nullif((select value from public.app_settings where key = 'fee_voucher_name'), '')
$$;
revoke all on function private.fee_plan() from public, anon, authenticated;

create or replace function private.applications_fee() returns trigger
language plpgsql security definer set search_path = public as $$
declare p record; emp uuid;
begin
  if new.pay_status = 'released' and old.pay_status is distinct from 'released' then
    select * into p from private.fee_plan();
    select employer_id into emp from public.jobs where id = new.job_id;
    insert into public.service_fees (application_id, employer_id, job_id, fee, discount, voucher)
    values (new.id, emp, new.job_id, p.fee, (p.fee * p.pct) / 100, case when p.pct > 0 then p.name end)
    on conflict (application_id) do nothing;
  end if;
  return new;
end $$;
revoke all on function private.applications_fee() from public, anon, authenticated;
create or replace trigger applications_fee after update of pay_status on public.applications
  for each row execute function private.applications_fee();

-- the price list anyone can see (shown on the post form and the shop's cost page)
create or replace function public.fee_plan() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('fee', fee, 'voucher_pct', pct, 'voucher_name', name) from private.fee_plan()
$$;

-- the shop's own fees: the latest 100 and the totals for this month (Vietnam time) and overall
create or replace function public.my_fees() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid(); m timestamptz := date_trunc('month', now() at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh';
begin
  if uid is null then raise exception 'FORBIDDEN'; end if;
  return jsonb_build_object(
    'rows', coalesce((select jsonb_agg(r order by r.created_at desc) from (
        select f.application_id, f.fee, f.discount, f.due, f.voucher, f.created_at, j.title, coalesce(p.full_name, '') worker
        from public.service_fees f join public.jobs j on j.id = f.job_id
        join public.applications a on a.id = f.application_id left join public.profiles p on p.id = a.seeker_id
        where f.employer_id = uid order by f.created_at desc limit 100) r), '[]'::jsonb),
    'month_fee', (select coalesce(sum(fee), 0) from public.service_fees where employer_id = uid and created_at >= m),
    'month_discount', (select coalesce(sum(discount), 0) from public.service_fees where employer_id = uid and created_at >= m),
    'month_due', (select coalesce(sum(due), 0) from public.service_fees where employer_id = uid and created_at >= m),
    'total_due', (select coalesce(sum(due), 0) from public.service_fees where employer_id = uid));
end $$;

-- admin: the plan and this month's totals; and changing the plan
create or replace function public.admin_fees() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare m timestamptz := date_trunc('month', now() at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh';
begin
  if not private.is_admin(auth.uid()) then raise exception 'FORBIDDEN'; end if;
  return public.fee_plan() || jsonb_build_object(
    'month_shifts', (select count(*) from public.service_fees where created_at >= m),
    'month_fee', (select coalesce(sum(fee), 0) from public.service_fees where created_at >= m),
    'month_discount', (select coalesce(sum(discount), 0) from public.service_fees where created_at >= m),
    'month_due', (select coalesce(sum(due), 0) from public.service_fees where created_at >= m));
end $$;

create or replace function public.admin_set_fee(p_fee int, p_pct int, p_name text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not private.is_admin(auth.uid()) then raise exception 'FORBIDDEN'; end if;
  if p_fee is null or p_fee < 0 or p_fee > 1000000 then raise exception 'BAD_FEE'; end if;
  if p_pct is null or p_pct < 0 or p_pct > 100 then raise exception 'BAD_PCT'; end if;
  insert into public.app_settings (key, value) values
    ('fee_per_shift', p_fee::text), ('fee_voucher_pct', p_pct::text), ('fee_voucher_name', left(btrim(coalesce(p_name, '')), 60))
  on conflict (key) do update set value = excluded.value;
end $$;

revoke all on function public.fee_plan(), public.my_fees(), public.admin_fees(), public.admin_set_fee(int, int, text) from public, anon;
grant execute on function public.fee_plan() to anon, authenticated;
grant execute on function public.my_fees(), public.admin_fees(), public.admin_set_fee(int, int, text) to authenticated;
