\set ON_ERROR_STOP on
\set QUIET on
-- Collaboration part 1: notifications, check-in / check-out, "I got the cash". Free mode (payments off).
\set SK '11111111-1111-4111-8111-0000000000e1'
\set EM '11111111-1111-4111-8111-0000000000e2'
\set OT '11111111-1111-4111-8111-0000000000e3'
\set J1 '00000000-0000-4000-8000-0000000004b1'
\set J2 '00000000-0000-4000-8000-0000000004b2'
\set A1 '00000000-0000-4000-8000-0000000004c1'
\set A2 '00000000-0000-4000-8000-0000000004c2'
reset role;
update public.app_settings set value = 'off' where key = 'payment_mode';

insert into auth.users (id, email) values (:'SK', 'sk@x.test'), (:'EM', 'em@x.test'), (:'OT', 'ot@x.test');
insert into profiles (id, role, full_name, business_name) values
  (:'SK', 'seeker', 'Người làm E1', null), (:'EM', 'employer', 'Chủ quán E2', 'Quán E2'), (:'OT', 'seeker', 'Người lạ E3', null);
-- a job running yesterday..tomorrow (Vietnam time), the shop is at 10.7769, 106.7009
insert into jobs (id, employer_id, title, pay_amount, pay_unit, start_date, end_date, slots, lat, lng) values
  (:'J1', :'EM', 'Ca thử thông báo', 300000, 'day',
   (now() at time zone 'Asia/Ho_Chi_Minh')::date - 1, (now() at time zone 'Asia/Ho_Chi_Minh')::date + 1, 2, 10.7769, 106.7009),
  (:'J2', :'EM', 'Ca ở tương lai', 300000, 'day',
   (now() at time zone 'Asia/Ho_Chi_Minh')::date + 5, (now() at time zone 'Asia/Ho_Chi_Minh')::date + 6, 2, 10.7769, 106.7009);

-- applying tells the shop
insert into applications (id, job_id, seeker_id) values (:'A1', :'J1', :'SK'), (:'A2', :'J2', :'SK');
select t_check((select count(*) = 2 from notifications where user_id = :'EM' and kind = 'new_applicant'), 'each new application notifies the shop');

set role anon; select set_config('request.jwt.claim.sub', '', false);
select t_err($$select * from notifications$$, 'permission denied');
select t_err($$select my_notifications()$$, 'permission denied');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'EM', false);
select t_err($$select * from notifications$$, 'permission denied');
select t_check((select count(*) = 2 from my_notifications()), 'the shop reads its own notifications');
select t_check(unread_notifications() = 2, 'two unread');
select mark_notifications_read((select array_agg(id) from (select id from my_notifications() limit 1) x));
select t_check(unread_notifications() = 1, 'marking one read leaves one unread');
select mark_notifications_read();
select t_check(unread_notifications() = 0, 'mark all read');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'OT', false);
select t_check((select count(*) = 0 from my_notifications()), 'a stranger sees none of them');
select t_check(unread_notifications() = 0, 'and has nothing unread');

-- the shop accepts → the worker hears about it
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'EM', false);
select decide_application(:'A1', 'accepted') is not null;
select decide_application(:'A2', 'accepted') is not null;
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'SK', false);
select t_check((select count(*) = 2 from my_notifications() where kind = 'accepted'), 'the worker is told they were accepted');

-- check-in rules
select t_err($$select check_in('00000000-0000-4000-8000-0000000004c2')$$, 'TOO_EARLY');
select t_err($$select check_in('00000000-0000-4000-8000-0000000004c1', 10.7769, null)$$, 'BAD_LOCATION');
select t_err($$select check_in('00000000-0000-4000-8000-0000000004c1', 91, 106)$$, 'BAD_LOCATION');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'OT', false);
select t_err($$select check_in('00000000-0000-4000-8000-0000000004c1')$$, 'FORBIDDEN');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'SK', false);
select t_err($$select check_out('00000000-0000-4000-8000-0000000004c1')$$, 'NOT_CHECKED_IN');
select t_check((select checkin_distance_m between 0 and 120 from check_in('00000000-0000-4000-8000-0000000004c1', 10.7772, 106.7011)), 'check-in near the shop records a small distance');
select t_err($$select check_in('00000000-0000-4000-8000-0000000004c1')$$, 'ALREADY_CHECKED_IN');
select t_check((select checked_out_at is not null from check_out('00000000-0000-4000-8000-0000000004c1')), 'check-out');
select t_err($$select check_out('00000000-0000-4000-8000-0000000004c1')$$, 'ALREADY_CHECKED_OUT');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'EM', false);
select t_check((select count(*) = 1 from my_notifications() where kind = 'checked_in'), 'the shop is told the worker arrived');

-- the shop confirms the shift, records the cash; the worker confirms receiving it
select complete_shift(:'A1', 'ok') is not null;
select t_err($$select ack_cash_received('00000000-0000-4000-8000-0000000004c2')$$, 'FORBIDDEN');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'SK', false);
select t_check((select count(*) = 1 from my_notifications() where kind = 'shift_done'), 'the worker is told the shift was confirmed');
select t_err($$select ack_cash_received('00000000-0000-4000-8000-0000000004c2')$$, 'NOT_COMPLETED');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'OT', false);
select t_err($$select ack_cash_received('00000000-0000-4000-8000-0000000004c1')$$, 'FORBIDDEN');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'EM', false);
select mark_paid_cash(:'A1');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'SK', false);
select t_check((select count(*) = 1 from my_notifications() where kind = 'cash_paid'), 'the worker is told the shop recorded the cash payment');
select t_check((select cash_received_at is not null from ack_cash_received('00000000-0000-4000-8000-0000000004c1')), 'the worker confirms the cash');
select t_check((select cash_received_at is not null from ack_cash_received('00000000-0000-4000-8000-0000000004c1')), 'pressing it twice is harmless');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'EM', false);
select t_check((select count(*) = 1 from my_notifications() where kind = 'cash_received'), 'the shop is told the cash was received (once)');
reset role;
select 'PASSED 100_collab';
