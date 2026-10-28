\set ON_ERROR_STOP on
\set QUIET on
-- Collaboration part 2: chat, reports, deletion requests, invites. Reuses the people and shifts of 100_collab.sql
-- (SK worker, EM shop, OT stranger; A1 = a finished shift, A2 = an accepted future shift).
\set SK '11111111-1111-4111-8111-0000000000e1'
\set EM '11111111-1111-4111-8111-0000000000e2'
\set OT '11111111-1111-4111-8111-0000000000e3'
\set AD '11111111-1111-4111-8111-0000000000e4'
\set J1 '00000000-0000-4000-8000-0000000004b1'
\set J3 '00000000-0000-4000-8000-0000000004b3'
\set J4 '00000000-0000-4000-8000-0000000004b4'
\set A1 '00000000-0000-4000-8000-0000000004c1'
reset role;
insert into auth.users (id, email) values (:'AD', 'ad@x.test');
insert into profiles (id, role, full_name, is_admin) values (:'AD', 'seeker', 'Admin E4', true);

-- ── chat ──
set role anon; select set_config('request.jwt.claim.sub', '', false);
select t_err($$select * from messages$$, 'permission denied');
select t_err($$select send_message('00000000-0000-4000-8000-0000000004c1', 'hi')$$, 'permission denied');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'OT', false);
select t_err($$select * from app_messages('00000000-0000-4000-8000-0000000004c1')$$, 'FORBIDDEN');
select t_err($$select send_message('00000000-0000-4000-8000-0000000004c1', 'hi')$$, 'FORBIDDEN');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'SK', false);
select send_message(:'A1', '  Chào quán, mai em đến sớm 15 phút ạ  ');
select t_err($$select send_message('00000000-0000-4000-8000-0000000004c1', '   ')$$, 'BAD_MESSAGE');
select t_err($$select send_message('00000000-0000-4000-8000-0000000004c1', repeat('x', 1001))$$, 'BAD_MESSAGE');
select send_message(:'A1', 'Em có mang CCCD luôn');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'EM', false);
select t_check((select count(*) = 2 from app_messages(:'A1')), 'the shop reads the conversation');
select t_check((select body = 'Em có mang CCCD luôn' from app_messages(:'A1') order by created_at desc limit 1), 'newest first, text trimmed elsewhere');
select t_check((select count(*) = 1 from my_notifications() where kind = 'message' and link = '/app/ca-lam'), 'two messages fold into one unread notification for the shop');
select send_message(:'A1', 'Ok em, quán mở cửa lúc 7h');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'SK', false);
select t_check((select count(*) = 1 from my_notifications() where kind = 'message' and link = '/app/cham-cong'), 'the worker is told about the reply');
-- flood limit: 30 per hour per conversation
reset role;
insert into messages (application_id, sender_id, body) select :'A1', :'SK', 'spam ' || g from generate_series(1, 30) g;
set role authenticated; select set_config('request.jwt.claim.sub', :'SK', false);
select t_err($$select send_message('00000000-0000-4000-8000-0000000004c1', 'one more')$$, 'TOO_MANY');
-- a pending (not accepted) application has no chat
reset role;
insert into jobs (id, employer_id, title, pay_amount, pay_unit, start_date, end_date, slots) values
  (:'J3', :'EM', 'Việc mời lại', 300000, 'day', current_date + 3, current_date + 4, 2),
  (:'J4', :'EM', 'Việc đã đóng', 300000, 'day', current_date + 3, current_date + 4, 2);

-- ── reports ──
set role authenticated; select set_config('request.jwt.claim.sub', :'SK', false);
select report_user(:'EM', 'scam', 'Quán đòi đặt cọc trước khi làm', null);
select t_err($$select report_user('11111111-1111-4111-8111-0000000000e1', 'scam')$$, 'FORBIDDEN');
select t_err($$select report_user('11111111-1111-4111-8111-0000000000e2', 'hack')$$, 'BAD_REASON');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'OT', false);
select t_err($$select report_user('11111111-1111-4111-8111-0000000000e2', 'scam')$$, 'FORBIDDEN');
select report_user(:'EM', 'fake_info', 'xem tin này', :'J3'); -- the shop behind a post you are looking at
select t_err($$select * from admin_reports()$$, 'FORBIDDEN');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'AD', false);
select t_check((select count(*) = 2 from admin_reports() where status = 'open' and target_name = 'Quán E2'), 'the admin sees the open reports');
select resolve_report((select id from admin_reports() where reason = 'scam'), 'Đã nhắc quán');
select t_check((select count(*) = 1 from admin_reports() where status = 'resolved' and note = 'Đã nhắc quán'), 'a report can be resolved with a note');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'SK', false);
select t_err($$select resolve_report(gen_random_uuid())$$, 'FORBIDDEN');
-- at most 5 reports a day
reset role;
insert into reports (reporter_id, target_id, reason) select :'SK', :'EM', 'other' from generate_series(1, 5);
set role authenticated; select set_config('request.jwt.claim.sub', :'SK', false);
select t_err($$select report_user('11111111-1111-4111-8111-0000000000e2', 'other')$$, 'TOO_MANY');

-- ── deletion requests ──
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'SK', false);
select request_account_deletion('Không dùng nữa');
select request_account_deletion('bấm hai lần');
select t_check((select count(*) = 1 from my_deletion_request() where status = 'open'), 'one open request per person');
reset role;
select t_check((select count(*) = 1 from deletion_requests where user_id = :'SK'), 'pressing twice made one row');
set role authenticated; select set_config('request.jwt.claim.sub', :'OT', false);
select t_err($$select * from admin_deletions()$$, 'FORBIDDEN');
select t_check((select count(*) = 0 from my_deletion_request()), 'another person has no request');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'AD', false);
select t_check((select count(*) = 1 from admin_deletions() where name = 'Người làm E1' and status = 'open'), 'the admin sees the request');
select resolve_deletion((select id from admin_deletions() limit 1), 'đã xóa');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'SK', false);
select t_check((select count(*) = 0 from my_deletion_request()), 'resolved request no longer shows as open');
select request_account_deletion(null);
select cancel_account_deletion();
select t_check((select count(*) = 0 from my_deletion_request()), 'a request can be cancelled');

-- ── invites ──
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'EM', false);
select t_err($$select invite_worker('00000000-0000-4000-8000-0000000004b1', '11111111-1111-4111-8111-0000000000e1')$$, 'ALREADY_APPLIED');
select t_err($$select invite_worker('00000000-0000-4000-8000-0000000004b3', '11111111-1111-4111-8111-0000000000e3')$$, 'NOT_A_REGULAR');
reset role; update jobs set status = 'closed' where id = :'J4'; set role authenticated; select set_config('request.jwt.claim.sub', :'EM', false);
select t_err($$select invite_worker('00000000-0000-4000-8000-0000000004b4', '11111111-1111-4111-8111-0000000000e1')$$, 'JOB_NOT_OPEN');
select invite_worker(:'J3', :'SK');
select invite_worker(:'J3', :'SK');
select t_check((select count(*) = 1 from my_sent_invites() where job_id = :'J3' and worker_id = :'SK'), 'the invite is recorded once');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'OT', false);
select t_err($$select invite_worker('00000000-0000-4000-8000-0000000004b3', '11111111-1111-4111-8111-0000000000e1')$$, 'FORBIDDEN');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'SK', false);
select t_check((select count(*) = 1 from my_notifications() where kind = 'invite' and link = '/app/viec/' || :'J3'), 'the worker gets one invitation, linking to the job');
reset role;
select 'PASSED 110_collab2';
