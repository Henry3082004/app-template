-- FREE MODE: no money moves and no paid plans, but shifts are still confirmed and reviewed,
-- so reputation data is collected from day one.
-- Turn money/plans back on later (one line each):
--   update public.app_settings set value = 'test' where key = 'payment_mode';   -- or 'live' once a gateway exists
--   update public.app_settings set value = 'on'   where key = 'billing';
-- Requires 20261016..20261018_reputation_integrity first.

insert into public.app_settings (key, value) values ('billing', 'off') on conflict (key) do nothing;
update public.app_settings set value = 'off' where key = 'payment_mode';

-- What the client needs to know (public, contains no secrets).
create or replace function public.app_config() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'payment_mode', coalesce((select value from public.app_settings where key = 'payment_mode'), 'test'),
    'billing', coalesce((select value from public.app_settings where key = 'billing'), 'on')) $$;
revoke all on function public.app_config() from public;
grant execute on function public.app_config() to anon, authenticated;

-- Billing off ⇒ everyone gets Pro features (no 2-post limit, "urgent" allowed).
create or replace function private.is_pro(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select value = 'off' from public.app_settings where key = 'billing'), false)
      or coalesce((select plan = 'pro' and (plan_until is null or plan_until > now()) from public.profiles where id = uid), false) $$;

-- Payments off ⇒ the worker sees the employer's phone as soon as they are accepted.
create or replace function private.is_funded_pair(employer uuid, seeker uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.applications a join public.jobs j on j.id = a.job_id
    where a.status = 'accepted'
      and (a.pay_status in ('held', 'released', 'noshow_reported', 'disputed') or public.payment_mode() = 'off')
      and j.employer_id = employer and a.seeker_id = seeker)
$$;

-- Payments off ⇒ the employer confirms the shift without a deposit. The agreed pay is RECORDED
-- (escrow_amount, funding_mode = 'off') only so reputation rules (min amount) work; no money is held.
create or replace function public.complete_shift(p_application uuid, p_attendance text) returns public.applications
language plpgsql security definer set search_path = public as $$
declare a public.applications; j public.jobs; q jsonb;
begin
  if p_attendance not in ('ok', 'late', 'noshow') then raise exception 'BAD_ATTENDANCE'; end if;
  select * into a from public.applications where id = p_application for update;
  if a.id is null then raise exception 'NOT_FOUND'; end if;
  select * into j from public.jobs where id = a.job_id;
  if j.employer_id <> auth.uid() then raise exception 'FORBIDDEN'; end if;
  if a.status <> 'accepted' then raise exception 'NOT_ACCEPTED'; end if;
  if a.pay_status = 'none' then
    if public.payment_mode() <> 'off' then raise exception 'NOT_FUNDED'; end if;
    q := public.quote_application(p_application, null);
    update public.applications set escrow_amount = (q->>'amount')::numeric, platform_fee = 0, funding_mode = 'off'
      where id = a.id returning * into a;
  elsif a.pay_status <> 'held' then
    raise exception 'ALREADY_SETTLED';
  end if;
  if current_date < j.start_date then raise exception 'TOO_EARLY'; end if;
  if p_attendance = 'noshow' then
    update public.applications set pay_status = 'noshow_reported', attendance = 'noshow', completed_at = now()
      where id = a.id returning * into a;
  else
    update public.applications set pay_status = 'released', attendance = p_attendance, completed_at = now(), released_at = now()
      where id = a.id returning * into a;
  end if;
  return a;
end $$;

-- No money ⇒ nothing to pay out.
create or replace function private.create_payout() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.funding_mode = 'off' then return new; end if;
  insert into public.payouts (application_id, seeker_id, amount, mode)
  values (new.id, new.seeker_id, coalesce(new.escrow_amount, 0) - coalesce(new.platform_fee, 0),
          case when new.funding_mode = 'live' then 'live' else 'test' end)
  on conflict (application_id) do nothing;
  return new;
end $$;
