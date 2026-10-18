\set ON_ERROR_STOP on
\set QUIET on
\set G '11111111-1111-4111-8111-0000000000b1'
\set G2 '11111111-1111-4111-8111-0000000000b2'
\set Z '11111111-1111-4111-8111-0000000000b3'
reset role;
insert into auth.users (id, email, raw_app_meta_data) values
  (:'G', 'g@example.com', '{"provider":"google"}'), (:'G2', 'g2@example.com', '{"provider":"google"}'), (:'Z', 'z@phone.viecthoivu.app', '{"provider":"email"}');
-- a Zalo-verified user owns +84911000111
insert into profiles (id, role, full_name, auth_provider) select '11111111-1111-4111-8111-0000000000b4', 'seeker', 'Zalo user', 'zalo' where false;
set role authenticated; select set_config('request.jwt.claim.sub', :'G', false);
select t_err($$select complete_profile('seeker','',  '+14155550100', null, null, null, null, 'en')$$, 'NAME_REQUIRED');
select t_err($$select complete_profile('boss','Ann', '+14155550100', null, null, null, null, 'en')$$, 'INVALID_ROLE');
select t_err($$select complete_profile('seeker','Ann', '14155550100', null, null, null, null, 'en')$$, 'BAD_PHONE');
select t_err($$select complete_profile('seeker','Ann', '+12', null, null, null, null, 'en')$$, 'BAD_PHONE');
select complete_profile('seeker', 'Ann Lee', '+1 (415) 555-0100', 'hello', 'ignored', 'ignored', 'NYC', 'en') is not null;
select t_check((select auth_provider from profiles where id = :'G') = 'google', 'profile marked as google');
select t_check((select phone from contacts where user_id = :'G') = '+14155550100', 'international phone normalised');
select t_check((select not verified from contacts where user_id = :'G'), 'typed phone is NOT verified');
select t_check((select business_name from profiles where id = :'G') is null, 'seeker ignores business fields');
select t_err($$select complete_profile('seeker','Again', '+14155550101', null, null, null, null, 'en')$$, 'PROFILE_EXISTS');
reset role; select set_config('request.jwt.claim.sub', :'G2', false); set role authenticated;
select complete_profile('employer', 'Bob', '0911000222', null, 'Bob Cafe', '1 Main', 'TP.HCM', 'vi') is not null;
select t_check((select phone from contacts where user_id = :'G2') = '+84911000222', 'local 0… number becomes +84…');
select t_check((select business_name from profiles where id = :'G2') = 'Bob Cafe', 'employer keeps business name');
-- only google users may use it
reset role; select set_config('request.jwt.claim.sub', :'Z', false); set role authenticated;
select t_err($$select complete_profile('seeker','Zed', '+84911000333', null, null, null, null, 'vi')$$, 'FORBIDDEN');
-- verified phones are unique, unverified ones may coexist (nobody can squat a Zalo-verified number)
reset role;
insert into auth.users (id) values ('11111111-1111-4111-8111-0000000000b5'), ('11111111-1111-4111-8111-0000000000b6') on conflict do nothing;
insert into profiles (id, role, full_name) values ('11111111-1111-4111-8111-0000000000b5', 'seeker', 'V1'), ('11111111-1111-4111-8111-0000000000b6', 'seeker', 'V2');
select t_err($$insert into contacts (user_id, phone, verified) values ('11111111-1111-4111-8111-0000000000b5', '+84911000222', true), ('11111111-1111-4111-8111-0000000000b6', '+84911000222', true)$$, 'duplicate key');
select t_check((app_config()->>'google_login') = 'off', 'google login is off until configured');

-- ── admin by Google email ──
\set G3 '11111111-1111-4111-8111-0000000000b7'
reset role;
insert into auth.users (id, email, raw_app_meta_data) values (:'G3', 'Boss@Example.com', '{"provider":"google"}');
update public.app_settings set value = 'boss@example.com, other@x.com' where key = 'admin_emails';
set role authenticated; select set_config('request.jwt.claim.sub', :'G3', false);
select complete_profile('seeker', 'Boss', '+14155550111', null, null, null, null, 'en') is not null;
select t_check((select is_admin from profiles where id = :'G3'), 'email in admin_emails (case-insensitive) becomes admin');
reset role;
select t_check((select not is_admin from profiles where id = :'G'), 'other google users are NOT admin');
set role authenticated;
select t_check((app_config()->>'zalo_published') = 'off', 'zalo_published is off by default');
\echo ALL ADMIN-EMAIL SCENARIOS PASSED
