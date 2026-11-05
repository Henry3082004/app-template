-- Direct settlement is a per-shift choice; never moves money or enables payment mode.
create or replace function public.choose_direct_pay(p_application uuid) returns void
language plpgsql security definer set search_path = public as $$
declare a public.applications; j public.jobs;
begin
  if auth.uid() is null then raise exception 'FORBIDDEN'; end if;
  select * into a from public.applications where id=p_application for update;
  if a.id is null then raise exception 'NOT_FOUND'; end if;
  select * into j from public.jobs where id=a.job_id;
  if j.employer_id is distinct from auth.uid() then raise exception 'FORBIDDEN'; end if;
  if a.status <> 'accepted' then raise exception 'NOT_ACCEPTED'; end if;
  if a.pay_status <> 'none' then raise exception 'ALREADY_FUNDED'; end if;
  update public.applications set funding_mode='off', platform_fee=0 where id=a.id;
end $$;
revoke all on function public.choose_direct_pay(uuid) from public, anon;
grant execute on function public.choose_direct_pay(uuid) to authenticated;

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
    if public.payment_mode() <> 'off' and a.funding_mode is distinct from 'off' then raise exception 'NOT_FUNDED'; end if;
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

create or replace function private.is_funded_pair(employer uuid, seeker uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.applications a join public.jobs j on j.id = a.job_id
    where a.status = 'accepted'
      and (a.pay_status in ('held', 'released', 'noshow_reported', 'disputed') or public.payment_mode() = 'off' or a.funding_mode = 'off')
      and j.employer_id = employer and a.seeker_id = seeker)
$$;


create or replace function public.fund_application(p_application uuid, p_hours int default null) returns public.applications
language plpgsql security definer set search_path = public as $$
declare a public.applications; j public.jobs; q jsonb;
begin
  if public.payment_mode() <> 'test' then raise exception 'PAYMENT_NOT_AVAILABLE'; end if;
  select * into a from public.applications where id = p_application for update;
  if a.id is null then raise exception 'NOT_FOUND'; end if;
  select * into j from public.jobs where id = a.job_id;
  if j.employer_id <> auth.uid() then raise exception 'FORBIDDEN'; end if;
  if a.status <> 'accepted' then raise exception 'NOT_ACCEPTED'; end if;
  if a.pay_status <> 'none' or a.funding_mode = 'off' then raise exception 'ALREADY_FUNDED'; end if;
  if j.end_date < current_date then raise exception 'JOB_ENDED'; end if;
  q := public.quote_application(p_application, p_hours);
  update public.applications
    set pay_status = 'held', escrow_amount = (q->>'amount')::numeric, platform_fee = (q->>'fee')::numeric,
        funding_mode = 'test', funded_at = now()
    where id = a.id returning * into a;
  return a;
end $$;

