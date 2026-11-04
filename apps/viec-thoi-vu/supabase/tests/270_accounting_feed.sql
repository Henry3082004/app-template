\set ON_ERROR_STOP on
\set QUIET on
-- Accounting feed: daily totals only (no personal data), real accounts only, and nobody but the service role can read them.
\set SH '11111111-1111-4111-8111-0000000ac001'
\set W1 '11111111-1111-4111-8111-0000000ac002'
\set SM '11111111-1111-4111-8111-0000000ac003'
reset role;
select coalesce((select (e->>'shops')::int from jsonb_array_elements(acct_daily(3)) e where (e->>'day')::date = (now() at time zone 'Asia/Ho_Chi_Minh')::date), 0) as shops0,
       coalesce((select (e->>'workers')::int from jsonb_array_elements(acct_daily(3)) e where (e->>'day')::date = (now() at time zone 'Asia/Ho_Chi_Minh')::date), 0) as workers0,
       coalesce((select (e->>'shifts')::int from jsonb_array_elements(acct_daily(3)) e where (e->>'day')::date = (now() at time zone 'Asia/Ho_Chi_Minh')::date), 0) as shifts0 \gset
insert into auth.users (id, email) values (:'SH', 'ac1@x.test'), (:'W1', 'ac2@x.test'), (:'SM', 'ac3@x.test');
insert into profiles (id, role, full_name, business_name) values (:'SH', 'employer', 'Chủ AC', 'Quán AC'), (:'W1', 'seeker', 'Làm AC', null), (:'SM', 'employer', 'Mẫu AC', 'Quán mẫu');
update profiles set is_sample = true where id = :'SM';
insert into jobs (id, employer_id, title, pay_amount, pay_unit, start_date, end_date, slots) values
  ('00000000-0000-4000-8000-00000000aca1', :'SH', 'Ca AC', 200000, 'day', current_date, current_date, 2);
insert into applications (id, job_id, seeker_id, status, pay_status, escrow_amount, funding_mode) values
  ('00000000-0000-4000-8000-00000000acb1', '00000000-0000-4000-8000-00000000aca1', :'W1', 'accepted', 'none', 200000, 'off');
update applications set pay_status = 'released', released_at = now(), completed_at = now() where id = '00000000-0000-4000-8000-00000000acb1';
select t_check((select (e->>'shops')::int = :shops0 + 1 and (e->>'workers')::int = :workers0 + 1 from jsonb_array_elements(acct_daily(3)) e where (e->>'day')::date = (now() at time zone 'Asia/Ho_Chi_Minh')::date),
  'new shops and workers are counted per day, and the sample shop is left out');
select t_check((select (e->>'shifts')::int = :shifts0 + 1 and (e->>'fee')::int >= 12000 and (e->>'discount')::int >= 12000 from jsonb_array_elements(acct_daily(3)) e where (e->>'day')::date = (now() at time zone 'Asia/Ho_Chi_Minh')::date),
  'a finished shift adds its fee and its voucher discount');
select t_check(jsonb_array_length(acct_daily(3)) = 3 and jsonb_array_length(acct_daily(0)) = 1, 'the number of days is bounded (1 to 800)');
select t_check(not exists (select 1 from jsonb_array_elements(acct_daily(3)) e, jsonb_object_keys(e) k where k not in ('day','shops','workers','shifts','fee','discount','due')),
  'only totals leave the database: no names, phones or e-mails');
set role authenticated; select set_config('request.jwt.claim.sub', :'SH', false);
select t_err($$select acct_daily(3)$$, 'permission denied');
reset role; set role anon; select set_config('request.jwt.claim.sub', '', false);
select t_err($$select acct_daily(3)$$, 'permission denied');
reset role;
select 'PASSED 270_accounting_feed';
