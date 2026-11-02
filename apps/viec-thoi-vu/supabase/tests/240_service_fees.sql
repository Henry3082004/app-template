\set ON_ERROR_STOP on
\set QUIET on
-- Service fees: one row per finished shift with the plan of that moment; the voucher takes some or all off; workers never pay;
-- the plan is changed by an admin only; nobody reads the ledger directly.
\set AD '11111111-1111-4111-8111-0000000fee1a'
\set SH '11111111-1111-4111-8111-0000000fee1b'
\set W1 '11111111-1111-4111-8111-0000000fee1c'
\set W2 '11111111-1111-4111-8111-0000000fee1d'
reset role;
insert into auth.users (id, email) values (:'AD', 'f1@x.test'), (:'SH', 'f2@x.test'), (:'W1', 'f3@x.test'), (:'W2', 'f4@x.test');
insert into profiles (id, role, full_name, business_name) values (:'AD', 'employer', 'Quản trị F', 'F'), (:'SH', 'employer', 'Chủ F', 'Quán F'), (:'W1', 'seeker', 'Làm F1', null), (:'W2', 'seeker', 'Làm F2', null);
update profiles set is_admin = true where id = :'AD';
select t_check((fee_plan()->>'fee')::int = 12000 and (fee_plan()->>'voucher_pct')::int = 100, 'default plan: 12.000đ per shift, 100% voucher');
insert into jobs (id, employer_id, title, pay_amount, pay_unit, start_date, end_date, slots) values
  ('00000000-0000-4000-8000-00000000fea1', :'SH', 'Ca phí', 200000, 'day', current_date, current_date, 3);
insert into applications (id, job_id, seeker_id, status, pay_status, escrow_amount, funding_mode) values
  ('00000000-0000-4000-8000-00000000feb1', '00000000-0000-4000-8000-00000000fea1', :'W1', 'accepted', 'none', 200000, 'off'),
  ('00000000-0000-4000-8000-00000000feb2', '00000000-0000-4000-8000-00000000fea1', :'W2', 'accepted', 'none', 200000, 'off');
update applications set pay_status = 'released', released_at = now(), completed_at = now() where id = '00000000-0000-4000-8000-00000000feb1';
select t_check((select fee = 12000 and discount = 12000 and due = 0 and voucher = 'Ưu đãi ra mắt' from service_fees where application_id = '00000000-0000-4000-8000-00000000feb1'), 'a finished shift is recorded and the voucher makes it free');
-- workers and other shops cannot change the plan
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'SH', false);
select t_err($$select admin_set_fee(0, 0, 'x')$$, 'FORBIDDEN');
select t_err($$select admin_fees()$$, 'FORBIDDEN');
select t_err($$select * from service_fees$$, 'permission denied');
reset role; set role anon; select set_config('request.jwt.claim.sub', '', false);
select t_check((fee_plan()->>'fee')::int = 12000, 'visitors can read the price list');
select t_err($$select my_fees()$$, 'permission denied');
select t_err($$select admin_set_fee(0, 0, 'x')$$, 'permission denied');
-- the admin lowers the voucher to 50%
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'AD', false);
select t_err($$select admin_set_fee(12000, 120, 'x')$$, 'BAD_PCT');
select t_err($$select admin_set_fee(-1, 50, 'x')$$, 'BAD_FEE');
select admin_set_fee(12000, 50, 'Giảm 50%');
select t_check((admin_fees()->>'voucher_pct')::int = 50, 'the admin sees the new plan');
reset role;
update applications set pay_status = 'released', released_at = now(), completed_at = now() where id = '00000000-0000-4000-8000-00000000feb2';
update applications set pay_status = 'released' where id = '00000000-0000-4000-8000-00000000feb1'; -- no second row
select t_check((select discount = 6000 and due = 6000 from service_fees where application_id = '00000000-0000-4000-8000-00000000feb2'), 'the next shift gets the new voucher');
select t_check((select due = 0 from service_fees where application_id = '00000000-0000-4000-8000-00000000feb1'), 'the old shift keeps its old price');
select t_check((select count(*) = 2 from service_fees where employer_id = :'SH'), 'one row per shift');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'SH', false);
select t_check((my_fees()->>'month_fee')::int = 24000 and (my_fees()->>'month_due')::int = 6000 and jsonb_array_length(my_fees()->'rows') = 2, 'the shop sees its own fees and totals');
select t_check((my_fees()->'rows'->0->>'worker') <> '', 'rows say who worked');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'W1', false);
select t_check(jsonb_array_length(my_fees()->'rows') = 0 and (my_fees()->>'total_due')::int = 0, 'workers owe nothing');
reset role;
update app_settings set value = '100' where key = 'fee_voucher_pct';
update app_settings set value = 'Ưu đãi ra mắt' where key = 'fee_voucher_name';
select 'PASSED 240_service_fees';
