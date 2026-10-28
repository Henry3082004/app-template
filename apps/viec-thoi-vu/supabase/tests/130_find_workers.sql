\set ON_ERROR_STOP on
\set QUIET on
-- Shops searching for workers: only people who switched it on, shortened name, no phone, invites allowed. Reuses SK, EM, OT of 100_collab.sql.
\set SK '11111111-1111-4111-8111-0000000000e1'
\set EM '11111111-1111-4111-8111-0000000000e2'
\set OT '11111111-1111-4111-8111-0000000000e6'
\set NW '11111111-1111-4111-8111-0000000000e6'
\set J8 '00000000-0000-4000-8000-0000000004d8'
reset role;
-- a brand-new worker who never worked for this shop (OT became one of its regulars in 120_reminders)
insert into auth.users (id, email) values (:'NW', 'nw@x.test');
insert into profiles (id, role, full_name, city) values (:'NW', 'seeker', 'Nguyễn Văn Bình', 'TP.HCM');
insert into worker_profiles (user_id, experience, availability) values (:'NW', '{service}', '{evening}');
insert into jobs (id, employer_id, title, pay_amount, pay_unit, start_date, end_date, slots) values
  (:'J8', :'EM', 'Việc cho người mới', 300000, 'day', current_date + 3, current_date + 4, 2);

-- nobody is listed by default
set role authenticated; select set_config('request.jwt.claim.sub', :'EM', false);
select t_check((select count(*) = 0 from search_workers()), 'nobody is listed until they switch it on');
select t_err($$select invite_worker('00000000-0000-4000-8000-0000000004d8', '11111111-1111-4111-8111-0000000000e6')$$, 'NOT_A_REGULAR');
-- only shops search; only workers switch it on
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'NW', false);
select t_err($$select * from search_workers()$$, 'FORBIDDEN');
select t_check(not my_discoverable(), 'off by default');
select set_discoverable(true);
select t_check(my_discoverable(), 'the worker can switch it on');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'EM', false);
select t_err($$select set_discoverable(true)$$, 'FORBIDDEN');
set role anon; select set_config('request.jwt.claim.sub', '', false);
select t_err($$select * from search_workers()$$, 'permission denied');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'EM', false);
select t_check((select count(*) = 1 from search_workers()), 'a listed worker shows up');
select t_check((select name = 'Bình N.' from search_workers() limit 1), 'only a shortened name is shown');
select t_check((select count(*) = 1 from search_workers('TP.HCM', 'service', 'evening')), 'filters: area, experience, free time');
select t_check((select count(*) = 0 from search_workers('Hà Nội')) and (select count(*) = 0 from search_workers(null, 'kitchen')), 'filters exclude others');
-- invite a listed stranger
select invite_worker(:'J8', :'NW');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'NW', false);
select t_check((select count(*) = 1 from my_notifications() where kind = 'invite' and link = '/app/viec/' || :'J8'), 'the listed worker gets the invitation');
-- switching it off hides again and blocks new invites
select set_discoverable(false);
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'EM', false);
select t_check((select count(*) = 0 from search_workers()), 'switching off removes the listing');
reset role;
select 'PASSED 130_find_workers';
