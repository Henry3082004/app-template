-- Sample shops / jobs / workers that only admins can see (for demos and screenshots).
-- Real users never see rows flagged is_sample, and the admin stats ignore them.
-- Clients cannot set the flag: profiles/jobs only grant INSERT/UPDATE on explicit column lists.

alter table public.profiles add column if not exists is_sample boolean not null default false;
alter table public.jobs add column if not exists is_sample boolean not null default false;

alter policy jobs_read on public.jobs using (
  (status = 'open'::job_status and (not is_sample or private.is_admin((select auth.uid()))))
  or employer_id = (select auth.uid())
  or private.has_applied(id, (select auth.uid()))
  or (is_sample and private.is_admin((select auth.uid()))));

alter policy profiles_read on public.profiles using (
  (('employer'::user_role = any (roles)) and (not is_sample or private.is_admin((select auth.uid()))))
  or id = (select auth.uid())
  or private.is_my_applicant(id, (select auth.uid()))
  or (is_sample and private.is_admin((select auth.uid()))));

-- admin_stats: same as before, but sample rows are not counted (see 20261023_dual_role.sql for the previous body)
create or replace function public.admin_stats() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  today timestamptz := date_trunc('day', now() at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh';
begin
  if not private.is_admin(auth.uid()) then raise exception 'FORBIDDEN'; end if;
  return jsonb_build_object(
    'employers',        (select count(*) from profiles where 'employer' = any(roles) and not is_sample),
    'seekers',          (select count(*) from profiles where 'seeker' = any(roles) and not is_sample),
    'new_users_today',  (select count(*) from profiles where created_at >= today and not is_sample),
    'new_users_7d',     (select count(*) from profiles where created_at >= now() - interval '7 days' and not is_sample),
    'open_jobs',        (select count(*) from jobs where status = 'open' and not is_sample),
    'jobs_7d',          (select count(*) from jobs where created_at >= now() - interval '7 days' and not is_sample),
    'applications_today', (select count(*) from applications a where a.created_at >= today and not exists (select 1 from profiles s where s.id = a.seeker_id and s.is_sample)),
    'applications_7d',  (select count(*) from applications a where a.created_at >= now() - interval '7 days' and not exists (select 1 from profiles s where s.id = a.seeker_id and s.is_sample)),
    'accepted_total',   (select count(*) from applications a where a.status = 'accepted' and not exists (select 1 from profiles s where s.id = a.seeker_id and s.is_sample)),
    'shifts_done',      (select count(*) from applications a where a.completed_at is not null and not exists (select 1 from profiles s where s.id = a.seeker_id and s.is_sample)),
    'reviews_total',    (select count(*) from reviews),
    'open_disputes',    (select count(*) from applications a where a.pay_status in ('disputed', 'noshow_reported') and not exists (select 1 from profiles s where s.id = a.seeker_id and s.is_sample))
  );
end $$;

-- admin_samples: the lists shown on Admin → Sample data
create or replace function public.admin_samples() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not private.is_admin(auth.uid()) then raise exception 'FORBIDDEN'; end if;
  return jsonb_build_object(
    'shops', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.business_name, 'owner', p.full_name, 'address', p.address, 'city', p.city,
        'jobs', (select count(*) from jobs j where j.employer_id = p.id)) order by p.business_name)
      from profiles p where p.is_sample and 'employer' = any(p.roles)), '[]'::jsonb),
    'workers', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.full_name, 'city', p.city, 'birth_year', w.birth_year,
        'experience', w.experience, 'availability', w.availability,
        'applications', (select count(*) from applications a where a.seeker_id = p.id)) order by p.full_name)
      from profiles p left join worker_profiles w on w.user_id = p.id
      where p.is_sample and 'seeker' = any(p.roles)), '[]'::jsonb));
end $$;
revoke all on function public.admin_samples() from public, anon;
grant execute on function public.admin_samples() to authenticated;
