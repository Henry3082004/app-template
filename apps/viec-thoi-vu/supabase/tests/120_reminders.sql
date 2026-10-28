\set ON_ERROR_STOP on
\set QUIET on
-- Reminders: sent at the right time of day, to the right person, never twice. Reuses SK (worker), EM (shop), OT (second worker) of 100_collab.sql.
\set SK '11111111-1111-4111-8111-0000000000e1'
\set EM '11111111-1111-4111-8111-0000000000e2'
\set OT '11111111-1111-4111-8111-0000000000e3'
\set SM '11111111-1111-4111-8111-0000000000e5'
\set J5 '00000000-0000-4000-8000-0000000004d5'
\set J6 '00000000-0000-4000-8000-0000000004d6'
\set J7 '00000000-0000-4000-8000-0000000004d7'
\set A5 '00000000-0000-4000-8000-0000000004e5'
\set A6 '00000000-0000-4000-8000-0000000004e6'
\set A7 '00000000-0000-4000-8000-0000000004e7'
\set A1 '00000000-0000-4000-8000-0000000004c1'
reset role;
-- the sample-data flag lives in a migration this suite does not run; add just the column
alter table profiles add column if not exists is_sample boolean not null default false;
select set_config('t.day', ((now() at time zone 'Asia/Ho_Chi_Minh')::date)::text, false);
-- "today at HH:00 Vietnam time" as a timestamptz
create or replace function pg_temp.at_hour(h int) returns timestamptz language sql as $$
  select ((current_setting('t.day')::date + make_interval(hours => h)) at time zone 'Asia/Ho_Chi_Minh')
$$;

insert into jobs (id, employer_id, title, pay_amount, pay_unit, start_date, end_date, slots, shift_note) values
  (:'J5', :'EM', 'Ca ngày mai', 300000, 'day', current_setting('t.day')::date + 1, current_setting('t.day')::date + 2, 3, '7:00-11:00'),
  (:'J6', :'EM', 'Ca hôm nay', 300000, 'day', current_setting('t.day')::date, current_setting('t.day')::date + 1, 3, null),
  (:'J7', :'EM', 'Ca đã qua', 300000, 'day', current_setting('t.day')::date - 3, current_setting('t.day')::date - 1, 3, null);
insert into applications (id, job_id, seeker_id) values (:'A5', :'J5', :'OT'), (:'A6', :'J6', :'OT'), (:'A7', :'J7', :'OT');
update applications set status = 'accepted' where id in (:'A5', :'A6', :'A7');
-- a sample worker with accepted shifts today / tomorrow / long ago must never be reminded
insert into auth.users (id, email) values (:'SM', 'sm@x.test');
insert into profiles (id, role, full_name, is_sample) values (:'SM', 'seeker', 'Mẫu E5', true);
insert into applications (id, job_id, seeker_id) values ('00000000-0000-4000-8000-0000000004e8', :'J5', :'SM'), ('00000000-0000-4000-8000-0000000004e9', :'J6', :'SM'), ('00000000-0000-4000-8000-0000000004ea', :'J7', :'SM');
update applications set status = 'accepted' where seeker_id = :'SM';

-- early morning: nothing yet
select t_check(private.send_reminders(pg_temp.at_hour(5)) = 0, '05:00 → no reminder is due yet');
-- 07:00: "today" only (the evening-before one waits for 17:00)
select t_check(private.send_reminders(pg_temp.at_hour(7)) = 1, '07:00 → one reminder: today''s shift');
select t_check((select count(*) = 1 from notifications where user_id = :'OT' and kind = 'remind_today' and ref = :'A6' and link = '/app/cham-cong'), 'the worker hears about today''s shift');
select t_check(private.send_reminders(pg_temp.at_hour(7)) = 0, 'running again at 07:00 sends nothing');
-- 08:00: the shop is told a finished shift was never confirmed
select t_check(private.send_reminders(pg_temp.at_hour(8)) = 1, '08:00 → one reminder: the unconfirmed shift');
select t_check((select count(*) = 1 from notifications where user_id = :'EM' and kind = 'remind_confirm' and ref = :'A7' and link = '/app/ca-lam'), 'the shop is told to confirm');
select t_check(private.send_reminders(pg_temp.at_hour(8)) = 0 and private.send_reminders(pg_temp.at_hour(12)) = 0, 'and only once');
-- 18:00: the evening-before reminder for tomorrow's shift
select t_check(private.send_reminders(pg_temp.at_hour(18)) = 1, '18:00 → one reminder: tomorrow''s shift');
select t_check((select count(*) = 1 from notifications where user_id = :'OT' and kind = 'remind_tomorrow' and ref = :'A5' and body like '%7:00-11:00%'), 'tomorrow''s reminder carries the shift note');
select t_check(private.send_reminders(pg_temp.at_hour(18)) = 0, 'not twice');
-- shifts that are already settled get no reminders
update applications set pay_status = 'released', released_at = now() where id = :'A6';
-- review reminder: a confirmed shift 2 days ago that nobody reviewed (A1: worker SK, shop EM)
update applications set released_at = pg_temp.at_hour(10) - interval '2 days' where id = :'A1';
select t_check(private.send_reminders(pg_temp.at_hour(10)) = 2, '10:00 → both sides are asked to review A1');
select t_check((select count(*) = 1 from notifications where user_id = :'SK' and kind = 'remind_review' and ref = :'A1'), 'the worker is asked to review the shop');
select t_check((select count(*) = 1 from notifications where user_id = :'EM' and kind = 'remind_review' and ref = :'A1'), 'the shop is asked to review the worker');
select t_check(private.send_reminders(pg_temp.at_hour(11)) = 0, 'review reminders are not repeated');
-- a side that already reviewed is left alone
update applications set released_at = pg_temp.at_hour(12) - interval '3 days' where id = :'A6';
insert into reviews (application_id, reviewer_id, reviewee_id, reviewer_role, stars) values (:'A6', :'OT', :'EM', 'seeker', 5);
select t_check(private.send_reminders(pg_temp.at_hour(12)) = 1, 'only the side that has not reviewed is asked');
select t_check((select count(*) = 0 from notifications where user_id = :'OT' and kind = 'remind_review'), 'the reviewer is not nagged');
select t_check((select count(*) = 0 from notifications where kind like 'remind%' and user_id = :'SM') and (select count(*) = 0 from notifications where kind like 'remind%' and user_id = :'EM' and ref in ('00000000-0000-4000-8000-0000000004ea')), 'sample accounts are never reminded');
-- nobody can call it from the app
set role authenticated; select set_config('request.jwt.claim.sub', :'SK', false);
select t_err($$select private.send_reminders()$$, 'permission denied');
reset role;
select 'PASSED 120_reminders';
