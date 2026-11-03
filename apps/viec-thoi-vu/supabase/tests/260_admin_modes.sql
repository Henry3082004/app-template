\set ON_ERROR_STOP on
\set QUIET on
-- Admin modes: two sample accounts (a shop and a worker) get a history; sample accounts see the sample world, real people never do;
-- only the service role can look up which sample account the admin switches to.
\set SHOP '11111111-1111-4111-8111-000000000011'
\set ME '44444444-4444-4444-8444-000000000001'
\set W2 '44444444-4444-4444-8444-000000000002'
\set W3 '44444444-4444-4444-8444-000000000003'
\set REAL '11111111-1111-4111-8111-0000000fa111'
reset role;
insert into auth.users (id, email) values (:'SHOP', 'ds1@x.test'), (:'ME', 'ds2@x.test'), (:'W2', 'ds3@x.test'), (:'W3', 'ds4@x.test'), (:'REAL', 'ds5@x.test');
insert into profiles (id, role, full_name, business_name, is_sample) values
  (:'SHOP', 'employer', 'Chị Hạnh', 'Nhà hàng Mộc', true), (:'ME', 'seeker', 'Nguyễn Thị Lan', null, true),
  (:'W2', 'seeker', 'Trần Văn Minh', null, true), (:'W3', 'seeker', 'Lê Hoàng Anh', null, true), (:'REAL', 'seeker', 'Người thật', null, false);
select private.seed_demo_history();
select private.seed_demo_history(); -- again: nothing changes
select t_check((select count(*) = 5 from jobs where id::text like 'd0000000-%'), 'five sample posts (four finished, one coming up), not duplicated');
select t_check((select count(*) = 7 from applications where id::text like 'd0000000-%'), 'seven applications');
select t_check((select count(*) = 8 from reviews where application_id::text like 'd0000000-%'), 'both sides reviewed the four finished shifts');
select t_check((select count(*) = 4 from applications where seeker_id = :'ME' and pay_status = 'released'), 'the demo worker has four finished shifts');
select t_check((select count(*) = 0 from service_fees where application_id::text like 'd0000000-%'), 'sample shifts leave no fee rows');
select t_check((select count(*) = 1 from applications where seeker_id = :'ME' and status = 'accepted' and pay_status = 'none'), 'one accepted shift is coming up');
select t_check((select count(*) = 2 from applications where job_id = 'd0000000-0000-4000-8000-0000000000a5' and status = 'pending'), 'two workers wait on the open post');
-- a sample account sees the sample world; a real one does not
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'ME', false);
select t_check((select count(*) = 1 from jobs where id = 'd0000000-0000-4000-8000-0000000000a5'), 'a sample worker sees the sample open post');
select t_check((select count(*) = 1 from profiles where id = :'SHOP'), 'a sample worker sees the sample shop');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'REAL', false);
select t_check((select count(*) = 0 from jobs where id = 'd0000000-0000-4000-8000-0000000000a5'), 'a real person never sees the sample post');
select t_check((select count(*) = 0 from profiles where id = :'SHOP'), 'a real person never sees the sample shop');
-- the lookup is closed to the app
select t_err($$select demo_account('employer')$$, 'permission denied');
reset role; set role anon; select set_config('request.jwt.claim.sub', '', false);
select t_err($$select demo_account('seeker')$$, 'permission denied');
reset role;
select t_check(demo_account('employer') = :'SHOP'::uuid, 'the service role finds the demo shop');
select t_check(demo_account('seeker') = :'ME'::uuid, 'and the demo worker');
select t_check(demo_account('admin') is null, 'nothing for other kinds');
update profiles set is_sample = false where id = :'SHOP';
select t_check(demo_account('employer') is null, 'a real account is never returned, even if it were named in the settings');
update profiles set is_sample = true where id = :'SHOP';
select 'PASSED 260_admin_modes';
