-- Phase 4a/5: admin dispute resolution + MANUAL payout ledger + worker bank account.
-- Nothing here moves money automatically. Live payments stay disabled (app_settings.payment_mode = 'test').
-- Requires 20261016_escrow_reputation.sql first.
-- Make yourself admin once, in the SQL editor:  update public.profiles set is_admin = true where id = '<your user id>';

alter table public.profiles add column if not exists is_admin boolean not null default false;
-- profiles only grants UPDATE on an explicit column list, so clients can never set is_admin themselves.

alter table public.applications
  add column if not exists resolution_note text check (char_length(resolution_note) <= 500),
  add column if not exists resolved_at timestamptz,
  add column if not exists resolved_by uuid references public.profiles (id);

create or replace function private.is_admin(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = uid), false) $$;

-- ── worker bank account (owner-only read; written through save_bank_account) ───────────────────
create table if not exists public.bank_accounts (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  bank_name text not null check (char_length(bank_name) between 2 and 60),
  account_no text not null check (account_no ~ '^[0-9]{6,20}$'),
  holder_name text not null check (char_length(holder_name) between 2 and 80),
  updated_at timestamptz not null default now()
);
alter table public.bank_accounts enable row level security;
revoke all on public.bank_accounts from anon, authenticated;
grant select on public.bank_accounts to authenticated;
drop policy if exists bank_read on public.bank_accounts;
create policy bank_read on public.bank_accounts for select to authenticated using (user_id = auth.uid());

create or replace function public.save_bank_account(p_bank text, p_account text, p_holder text) returns void
language plpgsql security definer set search_path = public as $$
declare acct text := regexp_replace(coalesce(p_account, ''), '\s', '', 'g');
begin
  if auth.uid() is null then raise exception 'NOT_SIGNED_IN'; end if;
  if char_length(trim(coalesce(p_bank, ''))) < 2 or char_length(trim(coalesce(p_holder, ''))) < 2 or acct !~ '^[0-9]{6,20}$' then
    raise exception 'BAD_BANK';
  end if;
  insert into public.bank_accounts (user_id, bank_name, account_no, holder_name)
  values (auth.uid(), left(trim(p_bank), 60), acct, upper(left(trim(p_holder), 80)))
  on conflict (user_id) do update set bank_name = excluded.bank_name, account_no = excluded.account_no,
    holder_name = excluded.holder_name, updated_at = now();
end $$;

-- ── payout ledger: one row per released shift, created automatically ────────────────────────────
create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications (id) on delete cascade,
  seeker_id uuid not null references public.profiles (id),
  amount numeric(12, 0) not null check (amount >= 0),
  mode text not null default 'test' check (mode in ('test', 'live')),
  status text not null default 'pending' check (status in ('pending', 'paid')),
  reference text check (char_length(reference) <= 100),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  paid_by uuid references public.profiles (id)
);
alter table public.payouts enable row level security;
revoke all on public.payouts from anon, authenticated;
grant select on public.payouts to authenticated;
drop policy if exists payouts_read on public.payouts;
create policy payouts_read on public.payouts for select to authenticated
  using (seeker_id = auth.uid() or private.is_admin(auth.uid()));

create or replace function private.create_payout() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.payouts (application_id, seeker_id, amount, mode)
  values (new.id, new.seeker_id, coalesce(new.escrow_amount, 0) - coalesce(new.platform_fee, 0),
          case when new.funding_mode = 'live' then 'live' else 'test' end)
  on conflict (application_id) do nothing;
  return new;
end $$;

drop trigger if exists applications_payout on public.applications;
create trigger applications_payout after update of pay_status on public.applications
  for each row when (new.pay_status = 'released' and old.pay_status is distinct from 'released')
  execute function private.create_payout();

-- ── admin RPCs ──────────────────────────────────────────────────────────────────────────────────
create or replace function public.admin_disputes()
returns table (application_id uuid, job_title text, employer_name text, seeker_name text, employer_phone text, seeker_phone text,
               amount numeric, fee numeric, reason text, attendance text, funding_mode text, start_date date, end_date date, completed_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not private.is_admin(auth.uid()) then raise exception 'FORBIDDEN'; end if;
  return query
    select a.id, j.title, coalesce(nullif(e.business_name, ''), e.full_name), s.full_name, ce.phone, cs.phone,
           a.escrow_amount, a.platform_fee, a.dispute_reason, a.attendance, a.funding_mode, j.start_date, j.end_date, a.completed_at
    from public.applications a
      join public.jobs j on j.id = a.job_id
      join public.profiles e on e.id = j.employer_id
      join public.profiles s on s.id = a.seeker_id
      left join public.contacts ce on ce.user_id = e.id
      left join public.contacts cs on cs.user_id = s.id
    where a.pay_status = 'disputed'
    order by a.funded_at;
end $$;

create or replace function public.resolve_dispute(p_application uuid, p_outcome text, p_note text) returns public.applications
language plpgsql security definer set search_path = public as $$
declare a public.applications;
begin
  if not private.is_admin(auth.uid()) then raise exception 'FORBIDDEN'; end if;
  if p_outcome not in ('release', 'refund') then raise exception 'BAD_OUTCOME'; end if;
  select * into a from public.applications where id = p_application for update;
  if a.id is null then raise exception 'NOT_FOUND'; end if;
  if a.pay_status <> 'disputed' then raise exception 'NOT_DISPUTED'; end if;
  if p_outcome = 'release' then
    update public.applications set pay_status = 'released', released_at = now(), completed_at = coalesce(completed_at, now()),
      attendance = case when attendance = 'noshow' then null else attendance end,
      resolution_note = nullif(left(trim(coalesce(p_note, '')), 500), ''), resolved_at = now(), resolved_by = auth.uid()
      where id = a.id returning * into a;
  else
    update public.applications set pay_status = 'refunded',
      resolution_note = nullif(left(trim(coalesce(p_note, '')), 500), ''), resolved_at = now(), resolved_by = auth.uid()
      where id = a.id returning * into a;
    perform private.free_slots(a.job_id, 1);
  end if;
  return a;
end $$;

create or replace function public.admin_payouts()
returns table (id uuid, application_id uuid, seeker_name text, amount numeric, mode text, status text, reference text,
               created_at timestamptz, paid_at timestamptz, bank_name text, account_no text, holder_name text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not private.is_admin(auth.uid()) then raise exception 'FORBIDDEN'; end if;
  return query
    select p.id, p.application_id, s.full_name, p.amount, p.mode, p.status, p.reference, p.created_at, p.paid_at,
           b.bank_name, b.account_no, b.holder_name
    from public.payouts p
      join public.profiles s on s.id = p.seeker_id
      left join public.bank_accounts b on b.user_id = p.seeker_id
    order by (p.status = 'paid'), p.created_at desc;
end $$;

create or replace function public.mark_payout_paid(p_payout uuid, p_reference text) returns void
language plpgsql security definer set search_path = public as $$
declare p public.payouts;
begin
  if not private.is_admin(auth.uid()) then raise exception 'FORBIDDEN'; end if;
  select * into p from public.payouts where id = p_payout for update;
  if p.id is null then raise exception 'NOT_FOUND'; end if;
  if p.status <> 'pending' then raise exception 'PAYOUT_DONE'; end if;
  if p.mode = 'live' and char_length(trim(coalesce(p_reference, ''))) < 3 then raise exception 'REFERENCE_REQUIRED'; end if;
  update public.payouts set status = 'paid', paid_at = now(), paid_by = auth.uid(), reference = nullif(left(trim(coalesce(p_reference, '')), 100), '')
    where id = p.id;
end $$;

revoke all on function public.save_bank_account(text, text, text), public.admin_disputes(), public.resolve_dispute(uuid, text, text),
  public.admin_payouts(), public.mark_payout_paid(uuid, text) from public, anon;
grant execute on function public.save_bank_account(text, text, text), public.admin_disputes(), public.resolve_dispute(uuid, text, text),
  public.admin_payouts(), public.mark_payout_paid(uuid, text) to authenticated;
