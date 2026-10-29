\set ON_ERROR_STOP on
\set QUIET on
-- Saved jobs: each person sees and changes only their own list; visitors have no access. Reuses SK, OT, EM of 100_collab.sql.
\set SK '11111111-1111-4111-8111-0000000000e1'
\set OT '11111111-1111-4111-8111-0000000000e3'
\set EM '11111111-1111-4111-8111-0000000000e2'
reset role;
insert into jobs (id, employer_id, title, pay_amount, pay_unit, start_date, end_date, slots) values
  ('00000000-0000-4000-8000-0000000005a1', :'EM', 'Lưu 1', 1, 'day', current_date, current_date + 1, 1),
  ('00000000-0000-4000-8000-0000000005a2', :'EM', 'Lưu 2', 1, 'day', current_date, current_date + 1, 1);
set role anon; select set_config('request.jwt.claim.sub', '', false);
select t_err($$select * from saved_jobs$$, 'permission denied');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'SK', false);
insert into saved_jobs (user_id, job_id) values (:'SK', '00000000-0000-4000-8000-0000000005a1'), (:'SK', '00000000-0000-4000-8000-0000000005a2');
insert into saved_jobs (user_id, job_id) values (:'SK', '00000000-0000-4000-8000-0000000005a1') on conflict do nothing; -- saving twice is harmless
select t_check((select count(*) = 2 from saved_jobs), 'a worker keeps two jobs');
select t_err($$insert into saved_jobs (user_id, job_id) values ('11111111-1111-4111-8111-0000000000e3', '00000000-0000-4000-8000-0000000005a1')$$, 'row-level security');
select t_err($$update saved_jobs set job_id = '00000000-0000-4000-8000-0000000005a2'$$, 'permission denied');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'OT', false);
select t_check((select count(*) = 0 from saved_jobs), 'another person sees none of them');
delete from saved_jobs where user_id = '11111111-1111-4111-8111-0000000000e1';
reset role;
select t_check((select count(*) = 2 from saved_jobs where user_id = :'SK'), 'and cannot delete them');
set role authenticated; select set_config('request.jwt.claim.sub', :'SK', false);
delete from saved_jobs where job_id = '00000000-0000-4000-8000-0000000005a2';
select t_check((select count(*) = 1 from saved_jobs), 'the owner removes one');
reset role;
select 'PASSED 160_saved_jobs';
