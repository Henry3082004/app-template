-- 20261021: RLS performance (auth.uid() evaluated once per query, not per row),
-- covering indexes for foreign keys flagged by the Supabase advisor, and admin_stats().
-- Policies keep exactly the same meaning; only auth.uid() is wrapped in (select ...).

alter policy applications_insert_own on public.applications
  with check (seeker_id = (select auth.uid()) and private.current_role_of((select auth.uid())) = 'seeker'::user_role);
alter policy applications_read on public.applications
  using (seeker_id = (select auth.uid()) or private.is_job_employer(job_id, (select auth.uid())));

alter policy bank_read on public.bank_accounts
  using (user_id = (select auth.uid()));

alter policy contacts_insert_own on public.contacts
  with check (user_id = (select auth.uid()));
alter policy contacts_read on public.contacts
  using (user_id = (select auth.uid()) or private.is_accepted_pair((select auth.uid()), user_id)
         or private.is_funded_pair(user_id, (select auth.uid())));
alter policy contacts_update_own on public.contacts
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

alter policy jobs_delete_own on public.jobs
  using (employer_id = (select auth.uid()));
alter policy jobs_insert_own on public.jobs
  with check (employer_id = (select auth.uid()) and private.current_role_of((select auth.uid())) = 'employer'::user_role);
alter policy jobs_read on public.jobs
  using (status = 'open'::job_status or employer_id = (select auth.uid()) or private.has_applied(id, (select auth.uid())));
alter policy jobs_update_own on public.jobs
  using (employer_id = (select auth.uid())) with check (employer_id = (select auth.uid()));

alter policy payouts_read on public.payouts
  using (seeker_id = (select auth.uid()) or private.is_admin((select auth.uid())));

alter policy profiles_insert_own on public.profiles
  with check (id = (select auth.uid()));
alter policy profiles_read on public.profiles
  using (role = 'employer'::user_role or id = (select auth.uid()) or private.is_my_applicant(id, (select auth.uid())));
alter policy profiles_update_own on public.profiles
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

alter policy reviews_read on public.reviews
  using (reviewer_id = (select auth.uid())
         or (reviewee_id = (select auth.uid()) and private.review_revealed(application_id)));

create index if not exists applications_resolved_by_idx on public.applications (resolved_by);
create index if not exists payouts_paid_by_idx on public.payouts (paid_by);
create index if not exists payouts_seeker_idx on public.payouts (seeker_id);
create index if not exists reviews_reviewer_idx on public.reviews (reviewer_id);

-- Headline numbers for the admin page. "Today" is the Vietnam calendar day.
create or replace function public.admin_stats()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  today timestamptz := date_trunc('day', now() at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh';
begin
  if not private.is_admin(auth.uid()) then raise exception 'FORBIDDEN'; end if;
  return jsonb_build_object(
    'employers',        (select count(*) from profiles where role = 'employer'),
    'seekers',          (select count(*) from profiles where role = 'seeker'),
    'new_users_today',  (select count(*) from profiles where created_at >= today),
    'new_users_7d',     (select count(*) from profiles where created_at >= now() - interval '7 days'),
    'open_jobs',        (select count(*) from jobs where status = 'open'),
    'jobs_7d',          (select count(*) from jobs where created_at >= now() - interval '7 days'),
    'applications_today', (select count(*) from applications where created_at >= today),
    'applications_7d',  (select count(*) from applications where created_at >= now() - interval '7 days'),
    'accepted_total',   (select count(*) from applications where status = 'accepted'),
    'shifts_done',      (select count(*) from applications where completed_at is not null),
    'reviews_total',    (select count(*) from reviews),
    'open_disputes',    (select count(*) from applications where pay_status in ('disputed', 'noshow_reported'))
  );
end $$;

revoke all on function public.admin_stats() from public, anon;
grant execute on function public.admin_stats() to authenticated;
