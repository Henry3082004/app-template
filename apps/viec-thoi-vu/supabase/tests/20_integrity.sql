\set ON_ERROR_STOP on
\set QUIET on
-- continues from 10_scenarios.sql state
\set E '11111111-1111-4111-8111-00000000000e'
\set S '11111111-1111-4111-8111-0000000000a1'
\set A '11111111-1111-4111-8111-0000000000ad'
reset role;
-- 4 extra small shifts between E and S, each reviewed 5★ by E (farming attempt): 3 tiny (10.000đ), 1 normal
insert into jobs (id, employer_id, title, pay_amount, pay_unit, start_date, end_date, slots)
  select ('00000000-0000-4000-8000-0000000001' || lpad(i::text, 2, '0'))::uuid, :'E', 'farm ' || i, case when i < 4 then 10000 else 100000 end, 'job', current_date, current_date, 1
  from generate_series(1, 4) i;
insert into applications (id, job_id, seeker_id, status, pay_status, escrow_amount, platform_fee, funding_mode, completed_at, released_at)
  select ('00000000-0000-4000-8000-0000000002' || lpad(i::text, 2, '0'))::uuid, ('00000000-0000-4000-8000-0000000001' || lpad(i::text, 2, '0'))::uuid,
         :'S', 'accepted', 'released', case when i < 4 then 10000 else 100000 end, 0, 'test', now(), now()
  from generate_series(1, 4) i;
insert into reviews (application_id, reviewer_id, reviewee_id, reviewer_role, stars, created_at)
  select ('00000000-0000-4000-8000-0000000002' || lpad(i::text, 2, '0'))::uuid, :'E', :'S', 'employer', 1, now() + make_interval(secs => i) from generate_series(1, 4) i;
insert into reviews (application_id, reviewer_id, reviewee_id, reviewer_role, stars, created_at)
  select ('00000000-0000-4000-8000-0000000002' || lpad(i::text, 2, '0'))::uuid, :'S', :'E', 'seeker', 5, now() from generate_series(1, 4) i;

set role authenticated; select set_config('request.jwt.claim.sub', :'S', false);
select t_check((select shifts_done from reputations(array[:'S']::uuid[])) = 3, 'tiny 10.000đ shifts do not count (3 qualifying: 300k shift, sweep shift, 100k farm)');
select t_check((select ratings from reputations(array[:'S']::uuid[])) = 1, 'many reviews from the same employer count once');
select t_check((select avg_stars from reputations(array[:'S']::uuid[])) = 1.0, 'only the latest review from that employer counts');
select t_check((select partners from reputations(array[:'S']::uuid[])) = 1, 'distinct partners = 1');
select t_check((select on_time from reputations(array[:'S']::uuid[])) = 2, 'on-time excludes the late shift');
select t_check((select count(*) from review_flags(array['00000000-0000-4000-8000-000000000201']::uuid[]) where other_reviewed) = 1, 'review_flags tells me the other side reviewed');
select t_check((select count(*) from review_flags(array['00000000-0000-4000-8000-0000000000a2']::uuid[])) = 0, 'review_flags hides shifts I am not part of');
select t_check(my_pending_reviews() = 1, 'pending: the auto-released sweep shift is still unreviewed by me');
select t_err($$select admin_flags()$$, 'FORBIDDEN');
reset role; select set_config('request.jwt.claim.sub', :'A', false); set role authenticated;
select t_check((select count(*) from admin_flags() where kind = 'repeat_pair') = 1, 'admin sees repeat-pair farming flag');
select t_check((select count(*) from admin_flags() where kind = 'new_accounts') >= 1, 'admin sees brand-new-accounts flag');
reset role; update reviews set created_at = now() - interval '400 days' where reviewer_id = :'E';
update applications set completed_at = now() - interval '400 days', released_at = now() - interval '400 days' where seeker_id = :'S' and id <> '00000000-0000-4000-8000-0000000000a3';
set role authenticated; select set_config('request.jwt.claim.sub', :'S', false);
select t_check((select shifts_done from reputations(array[:'S']::uuid[])) = 1, 'shifts older than 12 months drop out');
select t_check((select ratings from reputations(array[:'S']::uuid[])) = 0, 'reviews older than 12 months drop out');
\echo ALL INTEGRITY SCENARIOS PASSED
