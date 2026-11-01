-- The numbers that say whether the marketplace works (admin only): do posts get applicants within a day, do shops come back,
-- how many shifts finish per week, how many workers do not show up, how fast shops answer. Sample accounts are left out.
create or replace function public.admin_kpis() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not private.is_admin(auth.uid()) then raise exception 'FORBIDDEN'; end if;
  with real_jobs as (
    select j.* from public.jobs j
    where not exists (select 1 from public.profiles sp where sp.id = j.employer_id and coalesce(sp.is_sample, false))
  ),
  recent as (select * from real_jobs where created_at > now() - interval '30 days' and vetted),
  got24 as (
    select r2.id from recent r2
    where exists (select 1 from public.applications a where a.job_id = r2.id and a.created_at <= r2.created_at + interval '24 hours')
  ),
  shops60 as (
    select employer_id, count(*) n from real_jobs where created_at > now() - interval '60 days' group by employer_id
  ),
  weeks as (
    select w, (select count(*) from public.applications a join real_jobs j on j.id = a.job_id
               where a.pay_status = 'released' and coalesce(a.released_at, a.completed_at) >= w and coalesce(a.released_at, a.completed_at) < w + interval '7 days') shifts
    from generate_series(date_trunc('week', now()) - interval '7 weeks', date_trunc('week', now()), interval '1 week') w
  ),
  ns as (
    select count(*) filter (where a.attendance = 'noshow' and a.pay_status = 'refunded') bad,
           count(*) filter (where a.pay_status = 'released' or (a.attendance = 'noshow' and a.pay_status = 'refunded')) total
    from public.applications a join real_jobs j on j.id = a.job_id
    where coalesce(a.completed_at, a.released_at) > now() - interval '30 days'
  ),
  rep as (
    select round(avg(extract(epoch from (a.decided_at - a.created_at)) / 3600)::numeric, 1) h
    from public.applications a join real_jobs j on j.id = a.job_id
    where a.decided_at is not null and a.created_at > now() - interval '30 days'
  )
  select jsonb_build_object(
    'jobs_30d', (select count(*) from recent),
    'jobs_with_applicant_24h', (select count(*) from got24),
    'shops_60d', (select count(*) from shops60),
    'shops_repeat_60d', (select count(*) from shops60 where n >= 2),
    'weekly_shifts', (select coalesce(jsonb_agg(jsonb_build_object('week', to_char(w, 'YYYY-MM-DD'), 'shifts', shifts) order by w), '[]'::jsonb) from weeks),
    'noshow_30d', (select bad from ns),
    'finished_30d', (select total from ns),
    'avg_reply_hours_30d', (select h from rep),
    'held_jobs', (select count(*) from real_jobs where held_reason is not null and not vetted and held_reason not like 'REJECTED%'),
    'referrals_30d', (select count(*) from public.referrals where created_at > now() - interval '30 days'),
    'open_reports', (select count(*) from public.reports where status = 'open')
  ) into r;
  return r;
end $$;
revoke all on function public.admin_kpis() from public, anon;
grant execute on function public.admin_kpis() to authenticated;
