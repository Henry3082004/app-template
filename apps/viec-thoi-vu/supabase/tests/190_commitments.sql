\set ON_ERROR_STOP on
\set QUIET on
-- Commitments: "Tôi vẫn đến", the shop alert, backups, the no-show lock, cancelling a hire, "not paid" reports, trust_signals. Free mode.
\set W1 '11111111-1111-4111-8111-0000000000f1'
\set W2 '11111111-1111-4111-8111-0000000000f2'
\set W3 '11111111-1111-4111-8111-0000000000f3'
\set SH '11111111-1111-4111-8111-0000000000f9'
\set J1 '00000000-0000-4000-8000-0000000005a1'
\set J2 '00000000-0000-4000-8000-0000000005a2'
\set J3 '00000000-0000-4000-8000-0000000005a3'
\set B1 '00000000-0000-4000-8000-0000000005b1'
\set B2 '00000000-0000-4000-8000-0000000005b2'
\set B3 '00000000-0000-4000-8000-0000000005b3'
\set B4 '00000000-0000-4000-8000-0000000005b4'
reset role;
update public.app_settings set value = 'off' where key = 'payment_mode';
alter table profiles add column if not exists is_sample boolean not null default false;
select set_config('t.day', ((now() at time zone 'Asia/Ho_Chi_Minh')::date)::text, false);
create or replace function pg_temp.at_hour(h int) returns timestamptz language sql as $$
  select ((current_setting('t.day')::date + make_interval(hours => h)) at time zone 'Asia/Ho_Chi_Minh')
$$;

insert into auth.users (id, email) values (:'W1', 'w1@x.test'), (:'W2', 'w2@x.test'), (:'W3', 'w3@x.test'), (:'SH', 'sh@x.test');
insert into profiles (id, role, full_name, business_name) values
  (:'W1', 'seeker', 'Người làm F1', null), (:'W2', 'seeker', 'Người làm F2', null), (:'W3', 'seeker', 'Người làm F3', null), (:'SH', 'employer', 'Chủ quán F9', 'Quán F9');
insert into contacts (user_id, phone, verified) values (:'W1', '+84911000001', true), (:'SH', '+84911000009', false);
insert into jobs (id, employer_id, title, pay_amount, pay_unit, start_date, end_date, slots, city) values
  (:'J1', :'SH', 'Ca hôm nay F', 300000, 'day', current_setting('t.day')::date, current_setting('t.day')::date + 1, 1, 'HCM'),
  (:'J2', :'SH', 'Ca ngày mai F', 300000, 'day', current_setting('t.day')::date + 1, current_setting('t.day')::date + 1, 2, 'HCM'),
  (:'J3', :'SH', 'Ca xa F', 300000, 'day', current_setting('t.day')::date + 9, current_setting('t.day')::date + 9, 1, 'HCM');
insert into applications (id, job_id, seeker_id) values (:'B1', :'J1', :'W1'), (:'B2', :'J1', :'W2'), (:'B3', :'J2', :'W1'), (:'B4', :'J3', :'W3');

-- ── backups: a shop marks a pending applicant (no slot used), at most one per slot ───────────────
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'W1', false);
select t_err($$select set_backup('00000000-0000-4000-8000-0000000005b2', true)$$, 'FORBIDDEN');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'SH', false);
select t_check((select is_backup from set_backup(:'B2', true)), 'the shop marks W2 as backup');
select t_check((select filled = 0 from jobs where id = :'J1'), 'a backup uses no slot');
select t_err($$select set_backup('00000000-0000-4000-8000-0000000005b1', true)$$, 'TOO_MANY_BACKUPS');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'W2', false);
select t_check((select count(*) = 1 from my_notifications() where kind = 'backup'), 'the backup is told');

-- ── accepting W1 for J1 ─────────────────────────────────────────────────────────────────────────
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'SH', false);
select decide_application(:'B1', 'accepted') is not null;
select t_check((select is_backup from applications where id = :'B2'), 'still W2 is the backup');
select decide_application(:'B2', 'rejected') is not null;
select t_check((select not is_backup from applications where id = :'B2'), 'a decided application is no longer a backup');

-- ── "Tôi vẫn đến" ───────────────────────────────────────────────────────────────────────────────
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'W2', false);
select t_err($$select confirm_attendance('00000000-0000-4000-8000-0000000005b1')$$, 'FORBIDDEN');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'W1', false);
select t_err($$select confirm_attendance('00000000-0000-4000-8000-0000000005b3')$$, 'NOT_ACCEPTED');
-- the alert for a worker who never confirmed (J1 today, B1 accepted, not confirmed)
reset role;
select private.send_commit_alerts(pg_temp.at_hour(7));
select t_check((select count(*) = 0 from notifications where user_id = :'W1' and kind = 'remind_attend'), '07:00 → nobody is asked to confirm yet');
select private.send_commit_alerts(pg_temp.at_hour(8));
select t_check((select count(*) = 1 from notifications where user_id = :'W1' and kind = 'remind_attend' and ref = :'B1'), 'the worker hears it');
select private.send_commit_alerts(pg_temp.at_hour(9));
select t_check((select count(*) = 1 from notifications where user_id = :'SH' and kind = 'unconfirmed' and ref = :'B1'), 'the shop is told W1 did not confirm');
select private.send_commit_alerts(pg_temp.at_hour(10));
select t_check((select count(*) = 1 from notifications where ref = :'B1' and kind in ('remind_attend', 'unconfirmed') and user_id = :'W1') and (select count(*) = 1 from notifications where ref = :'B1' and kind = 'unconfirmed'), 'and only once');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'W1', false);
select t_check((select confirmed_at is not null from confirm_attendance(:'B1')), 'W1 confirms');
select t_check((select confirmed_at is not null from confirm_attendance(:'B1')), 'pressing twice is harmless');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'SH', false);
select t_check((select count(*) = 1 from my_notifications() where kind = 'attend_confirmed'), 'the shop hears the confirmation');

-- ── empty posts and unanswered applications ─────────────────────────────────────────────────────
reset role;
update jobs set created_at = pg_temp.at_hour(1) - interval '13 hours' where id = :'J3';
delete from applications where id = :'B4';
select private.send_commit_alerts(pg_temp.at_hour(12));
select t_check((select count(*) = 1 from notifications where user_id = :'SH' and kind = 'nudge_empty' and ref = :'J3'), 'the shop is told the post is empty');
select private.send_commit_alerts(pg_temp.at_hour(13));
select t_check((select count(*) = 1 from notifications where user_id = :'SH' and kind = 'nudge_empty' and ref = :'J3'), 'not twice');
insert into applications (id, job_id, seeker_id, created_at) values (:'B4', :'J3', :'W3', pg_temp.at_hour(12) - interval '30 hours');
select private.send_commit_alerts(pg_temp.at_hour(12));
select t_check((select count(*) = 1 from notifications where user_id = :'W3' and kind = 'pending_old' and ref = :'B4'), 'W3 hears it');
-- a post whose last day has passed stops being offered
update jobs set end_date = current_date - 3, start_date = current_date - 3 where id = :'J3';
select private.send_commit_alerts(pg_temp.at_hour(12));
select t_check((select status = 'closed' from jobs where id = :'J3'), 'an expired post is closed');
update jobs set status = 'open', end_date = current_date + 9, start_date = current_date + 9 where id = :'J3';

-- ── the shop cancels W1 on the work day: a late cancel, the slot reopens ────────────────────────
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'W1', false);
select t_err($$select cancel_hire('00000000-0000-4000-8000-0000000005b1')$$, 'FORBIDDEN');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'SH', false);
select t_check((select cancel_late and status = 'rejected' and cancelled_at is not null from cancel_hire(:'B1')), 'cancelling on the work day is a late cancel');
select t_check((select filled = 0 from jobs where id = :'J1'), 'the slot is free again');
select t_err($$select cancel_hire('00000000-0000-4000-8000-0000000005b1')$$, 'NOT_ACCEPTED');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'W1', false);
select t_check((select count(*) = 1 from my_notifications() where kind = 'hire_cancelled'), 'the worker is told');
select t_check((select count(*) = 0 from my_notifications() where kind = 'rejected'), 'and not also told "not chosen"');
-- accepting W1 for tomorrow's job and cancelling in advance is not late
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'SH', false);
select decide_application(:'B3', 'accepted') is not null;
select t_check((select not cancel_late from cancel_hire(:'B3')), 'cancelling the day before is not a late cancel');

-- ── trust_signals for the shop ──────────────────────────────────────────────────────────────────
reset role; set role anon; select set_config('request.jwt.claim.sub', '', false);
select t_check((select cancels = 2 and late_cancels = 1 and hires = 2 from trust_signals(array[:'SH']::uuid[])), 'the shop: 2 cancels (1 late) out of 2 hires');
select t_check((select not phone_verified from trust_signals(array[:'SH']::uuid[])), 'the shop phone is not verified');
select t_check((select phone_verified from trust_signals(array[:'W1']::uuid[])), 'W1 phone is verified');
select t_check((select reply_hours = 0 from trust_signals(array[:'SH']::uuid[])), 'reply time shows after 3 decisions (here all instant)');
select t_check((select reply_hours is null from trust_signals(array[:'W1']::uuid[])), 'and stays empty for someone who decided nothing');

-- ── the no-show lock: 2 confirmed no-shows in 30 days → 7 days without applying ─────────────────
reset role;
insert into jobs (id, employer_id, title, pay_amount, pay_unit, start_date, end_date, slots) values
  ('00000000-0000-4000-8000-0000000005c1', :'SH', 'Cũ 1', 300000, 'day', current_date - 5, current_date - 5, 1),
  ('00000000-0000-4000-8000-0000000005c2', :'SH', 'Cũ 2', 300000, 'day', current_date - 4, current_date - 4, 1),
  ('00000000-0000-4000-8000-0000000005c3', :'SH', 'Mới', 300000, 'day', current_date + 3, current_date + 3, 1);
insert into applications (id, job_id, seeker_id, status, attendance, pay_status, completed_at) values
  ('00000000-0000-4000-8000-0000000005d1', '00000000-0000-4000-8000-0000000005c1', :'W2', 'accepted', 'noshow', 'refunded', now() - interval '5 days'),
  ('00000000-0000-4000-8000-0000000005d2', '00000000-0000-4000-8000-0000000005c2', :'W3', 'accepted', 'noshow', 'refunded', now() - interval '4 days');
select t_check(private.apply_lock_until(:'W2') is null, 'one no-show is not enough to lock');
insert into applications (id, job_id, seeker_id, status, attendance, pay_status, completed_at) values
  ('00000000-0000-4000-8000-0000000005d3', '00000000-0000-4000-8000-0000000005c2', :'W2', 'accepted', 'noshow', 'refunded', now() - interval '1 day');
select t_check(private.apply_lock_until(:'W2') > now(), 'two no-shows lock for 7 days after the last');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'W2', false);
select t_check(my_apply_lock() > now(), 'the worker can read the lock');
reset role; -- (the local base schema grants no insert to the API roles, the trigger fires for any role)
select t_err($$insert into applications (job_id, seeker_id) values ('00000000-0000-4000-8000-0000000005c3', '11111111-1111-4111-8111-0000000000f2')$$, 'APPLY_LOCKED');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'W3', false);
select t_check(my_apply_lock() is null, 'another worker is not locked');
reset role;
update applications set completed_at = now() - interval '40 days' where id in ('00000000-0000-4000-8000-0000000005d1', '00000000-0000-4000-8000-0000000005d3');
select t_check(private.apply_lock_until(:'W2') is null, 'the lock ends once the no-shows are older than the window');
select t_check((select noshow_total = 2 and noshow_30d = 0 from trust_signals(array[:'W2']::uuid[])), 'signals: 2 in total, none in 30 days');

-- ── "not paid" ──────────────────────────────────────────────────────────────────────────────────
insert into applications (id, job_id, seeker_id, status, pay_status, attendance, released_at, completed_at, escrow_amount, funding_mode) values
  ('00000000-0000-4000-8000-0000000005e1', '00000000-0000-4000-8000-0000000005c1', :'W1', 'accepted', 'released', 'ok', now() - interval '3 hours', now() - interval '3 hours', 300000, 'off'),
  ('00000000-0000-4000-8000-0000000005e2', '00000000-0000-4000-8000-0000000005c3', :'W3', 'accepted', 'released', 'ok', now() - interval '3 days', now() - interval '3 days', 300000, 'off');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'W1', false);
select t_err($$select report_unpaid('00000000-0000-4000-8000-0000000005e1')$$, 'TOO_EARLY');
select t_err($$select report_unpaid('00000000-0000-4000-8000-0000000005e2')$$, 'FORBIDDEN');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'W3', false);
select t_check((select unpaid_reported_at is not null from report_unpaid('00000000-0000-4000-8000-0000000005e2')), 'the worker reports unpaid after a day');
select t_check((select unpaid_reported_at is not null from report_unpaid('00000000-0000-4000-8000-0000000005e2')), 'pressing twice is harmless');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'SH', false);
select t_check((select count(*) = 1 from my_notifications() where kind = 'unpaid_reported'), 'the shop is told');
reset role; set role anon; select set_config('request.jwt.claim.sub', '', false);
select t_check((select unpaid = 1 from trust_signals(array[:'SH']::uuid[])), 'one unpaid report counts on the shop');
reset role;
update applications set cash_received_at = now() where id = '00000000-0000-4000-8000-0000000005e2';
select t_check((select unpaid = 0 from trust_signals(array[:'SH']::uuid[])), 'once the worker confirms the cash, it no longer counts');

-- closed to anonymous callers
reset role; set role anon; select set_config('request.jwt.claim.sub', '', false);
select t_err($$select confirm_attendance('00000000-0000-4000-8000-0000000005b1')$$, 'permission denied');
select t_err($$select cancel_hire('00000000-0000-4000-8000-0000000005b1')$$, 'permission denied');
select t_err($$select set_backup('00000000-0000-4000-8000-0000000005b1', true)$$, 'permission denied');
reset role;
\echo PASSED 190_commitments
