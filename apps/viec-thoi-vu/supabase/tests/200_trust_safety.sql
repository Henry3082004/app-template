\set ON_ERROR_STOP on
\set QUIET on
-- Trust and safety: held posts, "not as posted", lost-property holds, notes about a worker. Free mode.
\set W1 '11111111-1111-4111-8111-0000000000d1'
\set W2 '11111111-1111-4111-8111-0000000000d2'
\set SH '11111111-1111-4111-8111-0000000000d9'
\set AD '11111111-1111-4111-8111-0000000000da'
\set J1 '00000000-0000-4000-8000-0000000006a1'
\set J2 '00000000-0000-4000-8000-0000000006a2'
\set J3 '00000000-0000-4000-8000-0000000006a3'
\set J4 '00000000-0000-4000-8000-0000000006a4'
\set A1 '00000000-0000-4000-8000-0000000006b1'
\set A2 '00000000-0000-4000-8000-0000000006b2'
\set A3 '00000000-0000-4000-8000-0000000006b3'
reset role;
update public.app_settings set value = 'off' where key = 'payment_mode';
insert into auth.users (id, email) values (:'W1', 'd1@x.test'), (:'W2', 'd2@x.test'), (:'SH', 'd9@x.test'), (:'AD', 'da@x.test');
insert into profiles (id, role, full_name, business_name) values
  (:'W1', 'seeker', 'Người làm D1', null), (:'W2', 'seeker', 'Người làm D2', null), (:'SH', 'employer', 'Chủ quán D9', 'Quán D9'), (:'AD', 'employer', 'Quản trị D', 'Quản trị');
update profiles set is_admin = true where id = :'AD';

-- ── a post asking for a deposit is held, a clean one is not ────────────────────────────────────
insert into jobs (id, employer_id, title, description, pay_amount, pay_unit, start_date, end_date, slots) values
  (:'J1', :'SH', 'Phụ bếp', 'Cần nhân viên, ĐẶT CỌC 200k giữ chỗ', 300000, 'day', current_date + 2, current_date + 2, 2),
  (:'J2', :'SH', 'Phục vụ bàn', 'Làm ca tối, lương trả cuối ca', 300000, 'day', current_date + 2, current_date + 2, 2);
select t_check((select status = 'closed' and not vetted and held_reason like '%đặt cọc%' from jobs where id = :'J1'), 'a post asking for a deposit is held');
select t_check((select status = 'open' and vetted and held_reason is null from jobs where id = :'J2'), 'a clean post goes public');
select t_check((select count(*) = 1 from notifications where user_id = :'SH' and kind = 'job_held'), 'the shop is told the post is held');
update jobs set status = 'open' where id = :'J1';
select t_check((select status = 'closed' from jobs where id = :'J1'), 'the shop cannot just reopen a held post');
-- the admin sees it and approves
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'SH', false);
select t_err($$select * from admin_held_jobs()$$, 'FORBIDDEN');
select t_err($$select admin_review_job('00000000-0000-4000-8000-0000000006a1', true)$$, 'FORBIDDEN');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'AD', false);
select t_check((select count(*) = 1 from admin_held_jobs() where id = :'J1'), 'the admin sees the held post');
select admin_review_job(:'J1', true);
select t_check((select status = 'open' and vetted and held_reason is null from jobs where id = :'J1'), 'approved → public');
reset role;
select t_check((select count(*) = 1 from notifications where user_id = :'SH' and kind = 'job_approved'), 'the shop is told');
-- taking the words out of a held post frees it by itself; a rejected one stays closed
insert into jobs (id, employer_id, title, description, pay_amount, pay_unit, start_date, end_date, slots) values
  (:'J3', :'SH', 'Phụ kho', 'Nộp phí hồ sơ trước', 300000, 'day', current_date + 2, current_date + 2, 1);
update jobs set description = 'Phụ kho, trả lương cuối ca' where id = :'J3';
select t_check((select held_reason is null and vetted from jobs where id = :'J3'), 'a held post without the words is released');
update jobs set description = 'Nộp phí hồ sơ trước' where id = :'J3';
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'AD', false);
select admin_review_job(:'J3', false, 'Thu phí người làm');
reset role;
select t_check((select status = 'closed' and held_reason like 'REJECTED%' from jobs where id = :'J3'), 'rejected → closed for good');
update jobs set description = 'Phụ kho, trả lương cuối ca' where id = :'J3';
select t_check((select status = 'closed' and held_reason like 'REJECTED%' from jobs where id = :'J3'), 'editing does not undo a rejection');

-- ── "not as posted": two workers saying no hold the post ───────────────────────────────────────
insert into jobs (id, employer_id, title, pay_amount, pay_unit, start_date, end_date, slots) values (:'J4', :'SH', 'Ca đã xong', 300000, 'day', current_date - 3, current_date - 3, 2);
insert into applications (id, job_id, seeker_id, status, pay_status, attendance, released_at, completed_at, escrow_amount, funding_mode) values
  (:'A1', :'J4', :'W1', 'accepted', 'released', 'ok', now() - interval '10 days', now() - interval '10 days', 300000, 'off'),
  (:'A2', :'J4', :'W2', 'accepted', 'released', 'ok', now() - interval '10 days', now() - interval '10 days', 300000, 'off');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'W2', false);
select t_err($$select mark_as_posted('00000000-0000-4000-8000-0000000006b1', false)$$, 'FORBIDDEN');
select mark_as_posted(:'A2', true);
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'W1', false);
select mark_as_posted(:'A1', false);
reset role;
select t_check((select vetted from jobs where id = :'J4'), 'one "no" does not hold the post');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'W2', false);
select mark_as_posted(:'A2', false);
reset role;
select t_check((select not vetted and status = 'closed' and held_reason like 'Nhiều người%' from jobs where id = :'J4'), 'two "no" hold the post');
reset role; set role anon; select set_config('request.jwt.claim.sub', '', false);
select t_check((select mismatch = 2 from trust_signals(array[:'SH']::uuid[])), 'the shop card counts the mismatches');
reset role;

-- ── what other shops wrote about a worker ──────────────────────────────────────────────────────
insert into reviews (application_id, reviewer_id, reviewee_id, reviewer_role, stars, comment) values (:'A1', :'SH', :'W1', 'employer', 5, 'Chăm chỉ, đến sớm');
insert into reviews (application_id, reviewer_id, reviewee_id, reviewer_role, stars, comment) values (:'A2', :'SH', :'W2', 'employer', 3, '   ');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'SH', false);
select t_check((select count(*) = 1 from worker_notes(array[:'W1', :'W2']::uuid[]) where user_id = :'W1' and comment = 'Chăm chỉ, đến sớm' and shop_name = 'Quán D9'), 'a shop reads a worker''s comment, blank ones are left out');
select t_check((select count(*) = 0 from worker_notes(array[:'W2']::uuid[])), 'no comment, no note');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'W2', false);
select t_check((select count(*) = 0 from worker_notes(array[:'W1']::uuid[])), 'a worker cannot read other workers'' notes');
reset role; set role anon; select set_config('request.jwt.claim.sub', '', false);
select t_err($$select * from worker_notes(array['11111111-1111-4111-8111-0000000000d1']::uuid[])$$, 'permission denied');
reset role;

-- ── lost property: the person reported is put on hold until the admin resolves ─────────────────
insert into jobs (id, employer_id, title, pay_amount, pay_unit, start_date, end_date, slots) values ('00000000-0000-4000-8000-0000000006a5', :'SH', 'Ca còn mở', 300000, 'day', current_date + 4, current_date + 4, 2);
insert into applications (id, job_id, seeker_id, status) values (:'A3', '00000000-0000-4000-8000-0000000006a5', :'W1', 'accepted');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'W1', false);
select report_user(:'SH', 'other', '[lost_property] mất ví', null);
reset role;
select t_check((select status = 'closed' from jobs where id = '00000000-0000-4000-8000-0000000006a5'), 'the shop reported for lost property has its open posts closed');
select t_check(private.hold_until(:'SH') > now(), 'and is on hold');
select t_check((select count(*) = 1 from notifications where user_id = :'SH' and kind = 'account_hold'), 'and told');
insert into jobs (id, employer_id, title, pay_amount, pay_unit, start_date, end_date, slots) values ('00000000-0000-4000-8000-0000000006a6', :'SH', 'Đăng trong lúc bị khóa', 300000, 'day', current_date + 4, current_date + 4, 1);
select t_check((select status = 'closed' and held_reason like 'Tài khoản%' from jobs where id = '00000000-0000-4000-8000-0000000006a6'), 'a post made while on hold is held');
-- a worker reported by the shop cannot apply meanwhile
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'SH', false);
select report_user(:'W2', 'other', '[lost_property] mất tiền quầy', '00000000-0000-4000-8000-0000000006a5');
reset role;
select t_check(private.apply_lock_until(:'W2') > now(), 'the worker reported is locked from applying');
select t_err($$insert into applications (job_id, seeker_id) values ('00000000-0000-4000-8000-0000000006a5', '11111111-1111-4111-8111-0000000000d2')$$, 'APPLY_LOCKED');
-- the admin resolves both reports → holds end
reset role;
select id as rid1 from reports where target_id = :'SH' and left(detail, 15) = '[lost_property]' limit 1 \gset
select id as rid2 from reports where target_id = :'W2' and left(detail, 15) = '[lost_property]' limit 1 \gset
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'AD', false);
select resolve_report(:'rid1', 'đã xác minh');
select resolve_report(:'rid2', 'đã xác minh');
reset role;
select t_check(private.hold_until(:'SH') is null and private.apply_lock_until(:'W2') is null, 'resolving the reports ends the holds');
\echo PASSED 200_trust_safety
