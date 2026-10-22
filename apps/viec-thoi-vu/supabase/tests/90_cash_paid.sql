\set ON_ERROR_STOP on
\set QUIET on
-- "Đã trả tiền mặt": only the shop of a finished, free-mode shift can record it.
reset role;
select t_check((select count(*) = 1 from information_schema.columns where table_name = 'applications' and column_name = 'paid_cash_at'), 'paid_cash_at column exists');
set role anon;
select t_err($$select mark_paid_cash(gen_random_uuid())$$, 'permission denied');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-0000000000c1', false);
select t_err($$select mark_paid_cash(gen_random_uuid())$$, 'NOT_FOUND');
reset role;
select 'PASSED 90_cash_paid';
