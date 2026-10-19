\set ON_ERROR_STOP on
\set QUIET on
-- Worker profile fields: owner-only writes, strict values, visible only to businesses the worker applied to.
\set W '11111111-1111-4111-8111-0000000000c1'
\set W2 '11111111-1111-4111-8111-0000000000c2'
\set B '11111111-1111-4111-8111-0000000000c3'
\set B2 '11111111-1111-4111-8111-0000000000c4'
reset role;
insert into auth.users (id, email) values (:'W', 'w@x'), (:'W2', 'w2@x'), (:'B', 'b@x'), (:'B2', 'b2@x');
insert into profiles (id, role, full_name) values (:'W', 'seeker', 'Worker'), (:'W2', 'seeker', 'Other worker'), (:'B', 'employer', 'Biz'), (:'B2', 'employer', 'Other biz');
insert into jobs (id, employer_id, title, pay_amount, pay_unit, start_date, end_date)
  values ('00000000-0000-4000-8000-0000000000c1', :'B', 'Phục vụ', 30000, 'hour', current_date, current_date);
insert into applications (job_id, seeker_id) values ('00000000-0000-4000-8000-0000000000c1', :'W');

set role authenticated; select set_config('request.jwt.claim.sub', :'W', false);
update profiles set birth_year = 2004, experience = '{service,kitchen}', availability = '{evening,weekend}',
  avatar_path = '11111111-1111-4111-8111-0000000000c1/a1b2.jpg' where id = :'W';
select t_check((select birth_year = 2004 and experience = '{service,kitchen}' and availability = '{evening,weekend}' from profiles where id = :'W'), 'worker saves own profile fields');
update profiles set availability = '{}' where id = :'W';
select t_check((select availability = '{}' from profiles where id = :'W'), 'free time may be left empty');
select t_err($$update profiles set birth_year = 1890 where id = '11111111-1111-4111-8111-0000000000c1'$$, 'profiles_birth_year_chk');
select t_err($$update profiles set experience = '{astronaut}' where id = '11111111-1111-4111-8111-0000000000c1'$$, 'profiles_experience_chk');
select t_err($$update profiles set experience = '{none,service}' where id = '11111111-1111-4111-8111-0000000000c1'$$, 'profiles_experience_chk');
select t_err($$update profiles set availability = '{night}' where id = '11111111-1111-4111-8111-0000000000c1'$$, 'profiles_availability_chk');
-- a photo path outside the owner's folder (someone else's photo, or a link to another site) is refused
select t_err($$update profiles set avatar_path = '11111111-1111-4111-8111-0000000000c2/x.jpg' where id = '11111111-1111-4111-8111-0000000000c1'$$, 'profiles_avatar_path_chk');
select t_err($$update profiles set avatar_path = 'https://evil.example/x.jpg' where id = '11111111-1111-4111-8111-0000000000c1'$$, 'profiles_avatar_path_chk');
-- nobody can edit another person's profile (RLS: the row is not visible for update)
update profiles set birth_year = 1990 where id = :'W2';
reset role;
select t_check((select birth_year is null from profiles where id = :'W2'), 'cannot change someone else''s profile');

-- visibility: the business the worker applied to sees the fields; another business does not see the worker at all
select set_config('request.jwt.claim.sub', :'B', false); set role authenticated;
select t_check((select birth_year = 2004 and experience = '{service,kitchen}' from profiles where id = :'W'), 'business sees its applicant''s profile');
reset role; select set_config('request.jwt.claim.sub', :'B2', false); set role authenticated;
select t_check((select count(*) from profiles where id = :'W') = 0, 'other businesses cannot read the worker profile');
reset role; set role anon; select set_config('request.jwt.claim.sub', '', false);
select t_check((select count(*) from profiles where id = :'W') = 0, 'anonymous visitors cannot read worker profiles');
reset role;
\echo ALL SEEKER-PROFILE SCENARIOS PASSED
