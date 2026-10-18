\set ON_ERROR_STOP on
\set QUIET on
-- Runs after 20261021_perf_admin_stats.sql, on the data left by the earlier scenario files.
\set E '11111111-1111-4111-8111-00000000000e'
\set S '11111111-1111-4111-8111-0000000000a1'
reset role;

-- 1. every policy evaluates auth.uid() once per query
select t_check(not exists (
  select 1 from pg_policies where schemaname = 'public'
    and regexp_replace(coalesce(qual, '') || ' ' || coalesce(with_check, ''), '\(\s*SELECT auth\.uid\(\) AS uid\)', '', 'g') ~ 'auth\.uid\(\)'
), 'all policies use (select auth.uid())');
select t_check((select count(*) from pg_indexes where indexname in
  ('applications_resolved_by_idx', 'payouts_paid_by_idx', 'payouts_seeker_idx', 'reviews_reviewer_idx')) = 4, 'foreign-key indexes exist');

-- 2. what each user can see is unchanged (expected counts use the original rules, evaluated as superuser)
create temp table expect as select p.id as uid,
  (select count(*) from applications a where a.seeker_id = p.id or private.is_job_employer(a.job_id, p.id)) as apps,
  (select count(*) from jobs j where j.status = 'open' or j.employer_id = p.id or private.has_applied(j.id, p.id)) as jobs,
  (select count(*) from contacts c where c.user_id = p.id or private.is_accepted_pair(p.id, c.user_id) or private.is_funded_pair(c.user_id, p.id)) as contacts,
  (select count(*) from reviews r where r.reviewer_id = p.id or (r.reviewee_id = p.id and private.review_revealed(r.application_id))) as reviews
from profiles p;
do $$ declare r record; ga int; gj int; gc int; gr int; n int := 0; begin
  for r in select * from expect loop
    perform set_config('request.jwt.claim.sub', r.uid::text, false);
    execute 'set role authenticated';
    select count(*) into ga from applications; select count(*) into gj from jobs;
    select count(*) into gc from contacts; select count(*) into gr from reviews;
    execute 'reset role';
    if (ga, gj, gc, gr) is distinct from (r.apps::int, r.jobs::int, r.contacts::int, r.reviews::int) then
      raise exception 'ASSERT FAILED: visibility changed for %: got %/%/%/% expected %/%/%/%', r.uid, ga, gj, gc, gr, r.apps, r.jobs, r.contacts, r.reviews;
    end if;
    n := n + 1;
  end loop;
  if n < 5 then raise exception 'ASSERT FAILED: only % users to compare', n; end if;
  if (select sum(apps) from expect) = 0 then raise exception 'ASSERT FAILED: no applications to compare'; end if;
  raise notice 'ok  visibility unchanged for % users', n;
end $$;

-- 3. write policies still enforce ownership and role
grant insert on jobs to authenticated;
select set_config('request.jwt.claim.sub', :'E', false); set role authenticated;
insert into jobs (employer_id, title, pay_amount, pay_unit, start_date, end_date)
  values (:'E', 'Perf test job', 30000, 'hour', current_date, current_date);
select t_check(true, 'employer can still insert own job');
select t_err($$insert into jobs (employer_id, title, pay_amount, pay_unit, start_date, end_date)
  values ('11111111-1111-4111-8111-0000000000a1', 'x', 1, 'hour', current_date, current_date)$$, 'row-level security');
reset role; select set_config('request.jwt.claim.sub', :'S', false); set role authenticated;
select t_err($$insert into jobs (employer_id, title, pay_amount, pay_unit, start_date, end_date)
  values ('11111111-1111-4111-8111-0000000000a1', 'x', 1, 'hour', current_date, current_date)$$, 'row-level security');

-- 4. admin_stats: admins only, numbers match the tables
select t_err($$select admin_stats()$$, 'FORBIDDEN');
reset role; set role anon;
select t_err($$select admin_stats()$$, 'permission denied');
reset role; update profiles set is_admin = true where id = :'E';
select set_config('request.jwt.claim.sub', :'E', false); set role authenticated;
create temp table st as select admin_stats() as s;
reset role;
select t_check((select (s->>'employers')::int = (select count(*) from profiles where role = 'employer') from st), 'stats: employers');
select t_check((select (s->>'seekers')::int = (select count(*) from profiles where role = 'seeker') from st), 'stats: seekers');
select t_check((select (s->>'open_jobs')::int = (select count(*) from jobs where status = 'open') from st), 'stats: open jobs');
select t_check((select (s->>'applications_7d')::int = (select count(*) from applications where created_at >= now() - interval '7 days') from st), 'stats: applications 7d');
select t_check((select (s->>'shifts_done')::int = (select count(*) from applications where completed_at is not null) and (s->>'shifts_done')::int > 0 from st), 'stats: shifts done');
select t_check((select (s->>'open_disputes')::int = (select count(*) from applications where pay_status in ('disputed', 'noshow_reported')) from st), 'stats: open disputes');
select t_check((select (s->>'new_users_today')::int <= (s->>'new_users_7d')::int from st), 'stats: today <= 7 days');
update profiles set is_admin = false where id = :'E';
delete from jobs where title = 'Perf test job';
revoke insert on jobs from authenticated;

\echo ALL PERF/ADMIN-STATS SCENARIOS PASSED
