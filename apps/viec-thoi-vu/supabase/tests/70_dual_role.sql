\set ON_ERROR_STOP on
\set QUIET on
-- One account, two roles. Runs after 60_seeker_profile.sql (reuses its people) and 20261023_dual_role.sql.
\set W '11111111-1111-4111-8111-0000000000c1'
\set B '11111111-1111-4111-8111-0000000000c3'
\set B2 '11111111-1111-4111-8111-0000000000c4'
reset role;

-- data moved: worker details now live in worker_profiles, the old copies on profiles are empty
select t_check((select roles = '{seeker}' from profiles where id = :'W'), 'existing accounts own exactly their old role');
select t_check((select birth_year = 2004 and experience = '{service,kitchen}' and avatar_path like '11111111-1111-4111-8111-0000000000c1/%' from worker_profiles where user_id = :'W'), 'worker details moved to worker_profiles');
select t_check((select birth_year is null and bio is null and avatar_path is null and experience = '{}' from profiles where id = :'W'), 'old copies on profiles emptied');

-- the real database lets signed-in users insert jobs/applications (RLS decides); the local base does not
grant insert on jobs, applications to authenticated;
set role authenticated; select set_config('request.jwt.claim.sub', :'W', false);
update worker_profiles set availability = '{morning}' where user_id = :'W';
select t_check((select availability = '{morning}' from worker_profiles where user_id = :'W'), 'worker edits own details');
select t_err($$update profiles set bio = 'x' where id = '11111111-1111-4111-8111-0000000000c1'$$, 'permission denied');
select t_err($$update profiles set roles = '{seeker,employer}' where id = '11111111-1111-4111-8111-0000000000c1'$$, 'permission denied');
select t_err($$insert into jobs (employer_id, title, pay_amount, pay_unit, start_date, end_date) values ('11111111-1111-4111-8111-0000000000c1', 'x', 1, 'hour', current_date, current_date)$$, 'row-level security');

-- add the business role → can post, cannot apply to own job, worker role still there
select t_err($$select add_role('employer', '', '1 Lê Lợi', null)$$, 'BUSINESS_REQUIRED');
select add_role('employer', 'Quán của W', '12 Lê Lợi', 'TP.HCM') is not null;
select t_check((select role = 'employer' and roles = '{seeker,employer}' and business_name = 'Quán của W' from profiles where id = :'W'), 'business role added and in use');
select t_err($$select add_role('employer', 'Again', '12 Lê Lợi', null)$$, 'ROLE_EXISTS');
insert into jobs (id, employer_id, title, pay_amount, pay_unit, start_date, end_date)
  values ('00000000-0000-4000-8000-0000000000d1', :'W', 'Tin của W', 30000, 'hour', current_date, current_date);
select t_check(true, 'business role can post');
select t_err($$insert into applications (job_id, seeker_id) values ('00000000-0000-4000-8000-0000000000d1', '11111111-1111-4111-8111-0000000000c1')$$, 'row-level security');
select switch_role('seeker') is not null;
select t_check((select role = 'seeker' from profiles where id = :'W'), 'switched back to the worker role');
reset role;

-- privacy: the business row is public now, the worker details are not
set role anon; select set_config('request.jwt.claim.sub', '', false);
select t_check((select count(*) from profiles where id = :'W') = 1, 'business profile is public (shown on job posts)');
select t_err($$select * from worker_profiles$$, 'permission denied');
reset role; select set_config('request.jwt.claim.sub', :'B2', false); set role authenticated;
select t_check((select count(*) from worker_profiles where user_id = :'W') = 0, 'other businesses cannot read the worker details');
select t_err($$select switch_role('seeker')$$, 'ROLE_NOT_OWNED');
reset role; select set_config('request.jwt.claim.sub', :'B', false); set role authenticated;
select t_check((select count(*) from worker_profiles where user_id = :'W') = 1, 'the business the worker applied to still sees them');
reset role; revoke insert on jobs, applications from authenticated;

-- reputation split by side adds up to the old combined number for everyone
select t_check(not exists (
  select 1 from profiles p
  where (select shifts_done from reputations(array[p.id])) <>
        (select shifts_done from role_reputations(array[p.id], 'seeker')) + (select shifts_done from role_reputations(array[p.id], 'employer'))
), 'worker side + business side = combined shifts');
select t_check((select sum(shifts_done) from role_reputations((select array_agg(id) from profiles), 'seeker')) > 0, 'there are worker-side shifts to compare');
\echo ALL DUAL-ROLE SCENARIOS PASSED
