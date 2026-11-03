\set ON_ERROR_STOP on
\set QUIET on
-- consents: a person records their own agreement (once per version), reads it back, nobody reads or writes the table directly.
\set AD '11111111-1111-4111-8111-0000000c0a1a'
\set U1 '11111111-1111-4111-8111-0000000c0a1b'
\set U2 '11111111-1111-4111-8111-0000000c0a1c'
reset role;
insert into auth.users (id, email) values (:'AD', 'c1@x.test'), (:'U1', 'c2@x.test'), (:'U2', 'c3@x.test');
insert into profiles (id, role, full_name, business_name) values (:'AD', 'employer', 'Quản trị C', 'C'), (:'U1', 'seeker', 'Người C1', null), (:'U2', 'seeker', 'Người C2', null);
update profiles set is_admin = true where id = :'AD';
reset role; set role anon; select set_config('request.jwt.claim.sub', '', false);
select t_err($$select record_consent('terms', 'v1')$$, 'permission denied');
select t_err($$select * from consents$$, 'permission denied');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'U1', false);
select t_err($$select * from consents$$, 'permission denied');
select t_err($$select record_consent('marketing', 'v1')$$, 'BAD_KIND');
select t_err($$select record_consent('terms', '')$$, 'BAD_VERSION');
select record_consent('terms', '2026-11-03');
select record_consent('terms', '2026-11-03');
select record_consent('location', '2026-11-03');
select t_check((select count(*) = 2 from my_consents()), 'two kinds recorded, the repeated one was not duplicated');
select t_check((select version = '2026-11-03' from my_consents() where kind = 'terms'), 'the version is kept');
select record_consent('terms', '2027-01-01');
select t_check((select version = '2027-01-01' from my_consents() where kind = 'terms'), 'the latest version is the one returned');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'U2', false);
select t_check((select count(*) = 0 from my_consents()), 'nobody sees another person''s consents');
select t_err($$select admin_consent_stats('2026-11-03')$$, 'FORBIDDEN');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'AD', false);
select t_check((admin_consent_stats('2026-11-03')->>'terms_current')::int >= 1, 'the admin sees how many agreed to a version');
reset role;
select 'PASSED 250_consents';
