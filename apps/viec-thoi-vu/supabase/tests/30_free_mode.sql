\set ON_ERROR_STOP on
\set QUIET on
\set E '11111111-1111-4111-8111-00000000000e'
\set S2 '11111111-1111-4111-8111-0000000000a2'
reset role;
insert into jobs (id, employer_id, title, pay_amount, pay_unit, start_date, end_date, slots) values
  ('00000000-0000-4000-8000-000000000301', :'E', 'free job', 300000, 'day', current_date, current_date, 1);
insert into jobs (id, employer_id, title, pay_amount, pay_unit, start_date, end_date, slots, status) values
  ('00000000-0000-4000-8000-000000000302', :'E', 'free job 2', 300000, 'day', current_date, current_date, 1, 'open'),
  ('00000000-0000-4000-8000-000000000303', :'E', 'free job 3', 300000, 'day', current_date, current_date, 1, 'open');
select t_check(private.is_pro(:'E'), 'billing off ⇒ everyone is pro (3 open jobs allowed)');
insert into applications (id, job_id, seeker_id) values ('00000000-0000-4000-8000-0000000003a1', '00000000-0000-4000-8000-000000000301', :'S2');
set role authenticated; select set_config('request.jwt.claim.sub', :'E', false);
select t_check((app_config()->>'payment_mode') = 'off', 'app_config reports payment off');
select decide_application('00000000-0000-4000-8000-0000000003a1', 'accepted') is not null;
select t_err($$select fund_application('00000000-0000-4000-8000-0000000003a1')$$, 'PAYMENT_NOT_AVAILABLE');
reset role; select set_config('request.jwt.claim.sub', :'S2', false); set role authenticated;
select t_check((select count(*) from contacts where user_id = :'E') = 1, 'payments off ⇒ worker sees employer phone right after accept');
reset role; select set_config('request.jwt.claim.sub', :'E', false); set role authenticated;
select complete_shift('00000000-0000-4000-8000-0000000003a1', 'ok') is not null;
reset role;
select t_check((select pay_status || '/' || funding_mode || '/' || escrow_amount from applications where id = '00000000-0000-4000-8000-0000000003a1') = 'released/off/300000', 'shift confirmed without deposit, agreed pay recorded');
select t_check((select count(*) from payouts where application_id = '00000000-0000-4000-8000-0000000003a1') = 0, 'no payout row in free mode');
set role authenticated; select set_config('request.jwt.claim.sub', :'S2', false);
select submit_review('00000000-0000-4000-8000-0000000003a1', 5, array['friendly'], '') is not null;
select t_check((select shifts_done from reputations(array[:'S2']::uuid[])) >= 1, 'free-mode shift counts for reputation');
\echo ALL FREE-MODE SCENARIOS PASSED
