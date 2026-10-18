\set ON_ERROR_STOP on
\set QUIET on
create or replace function public.t_check(c boolean, msg text) returns void language plpgsql as $$ begin if c is not true then raise exception 'ASSERT FAILED: %', msg; end if; raise notice 'ok  %', msg; end $$;
create or replace function public.t_err(q text, needle text) returns void language plpgsql as $$
begin
  begin execute q; exception when others then
    if sqlerrm like '%' || needle || '%' then raise notice 'ok  rejected (%): %', needle, left(q, 60); return; end if;
    raise exception 'ASSERT FAILED: expected % but got % for %', needle, sqlerrm, q;
  end;
  raise exception 'ASSERT FAILED: should have failed with % : %', needle, q;
end $$;
grant execute on function public.t_check(boolean, text), public.t_err(text, text) to anon, authenticated;
-- this file tests the deposit flow, so payments are in test mode here
update public.app_settings set value = 'test' where key = 'payment_mode';

\set E '11111111-1111-4111-8111-00000000000e'
\set S '11111111-1111-4111-8111-0000000000a1'
\set S2 '11111111-1111-4111-8111-0000000000a2'
\set A '11111111-1111-4111-8111-0000000000ad'
insert into auth.users select unnest(array[:'E', :'S', :'S2', :'A']::uuid[]);
insert into profiles (id, role, full_name, business_name) values (:'E','employer','Chủ quán','Quán E'), (:'S','seeker','Người A1',null), (:'S2','seeker','Người A2',null), (:'A','employer','Quản trị','Quản trị');
update profiles set is_admin = true where id = :'A';
insert into contacts values (:'E','+84900000002'), (:'S','+84900000001'), (:'S2','+84900000003'), (:'A','+84900000009');
insert into jobs (id, employer_id, title, pay_amount, pay_unit, start_date, end_date, slots) values
  ('00000000-0000-4000-8000-000000000001', :'E', 'Việc hôm nay', 30000, 'hour', current_date, current_date + 1, 2),
  ('00000000-0000-4000-8000-000000000002', :'E', 'Việc tương lai', 300000, 'day', current_date + 5, current_date + 5, 1);
insert into applications (id, job_id, seeker_id) values
  ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-000000000001', :'S'),
  ('00000000-0000-4000-8000-0000000000a2', '00000000-0000-4000-8000-000000000001', :'S2'),
  ('00000000-0000-4000-8000-0000000000a3', '00000000-0000-4000-8000-000000000002', :'S');

-- ── as employer: accept S, worker cannot see phone until funded ──
set role authenticated; select set_config('request.jwt.claim.sub', :'E', false);
select decide_application('00000000-0000-4000-8000-0000000000a1', 'accepted') is not null;
select decide_application('00000000-0000-4000-8000-0000000000a2', 'accepted') is not null;
select decide_application('00000000-0000-4000-8000-0000000000a3', 'accepted') is not null;
select t_check((select count(*) from contacts where user_id = :'S') = 1, 'employer sees accepted worker phone');
select t_check((quote_application('00000000-0000-4000-8000-0000000000a1')->>'amount')::int = 480000, 'default quote = 8h x 2 days x 30000 = 480000');
select t_check((quote_application('00000000-0000-4000-8000-0000000000a1', 10)->>'fee')::int = 24000, 'fee 8% of 300000 = 24000');
select t_err($$select quote_application('00000000-0000-4000-8000-0000000000a1', 99)$$, 'BAD_HOURS');
reset role; select set_config('request.jwt.claim.sub', :'S', false); set role authenticated;
select t_check((select count(*) from contacts where user_id = :'E') = 0, 'worker CANNOT see employer phone before funding');
select t_err($$select fund_application('00000000-0000-4000-8000-0000000000a1')$$, 'FORBIDDEN');
reset role; select set_config('request.jwt.claim.sub', :'E', false); set role authenticated;
select t_err($$select complete_shift('00000000-0000-4000-8000-0000000000a1','ok')$$, 'NOT_FUNDED');
select fund_application('00000000-0000-4000-8000-0000000000a1', 10) is not null;
select t_err($$select fund_application('00000000-0000-4000-8000-0000000000a1')$$, 'ALREADY_FUNDED');
select fund_application('00000000-0000-4000-8000-0000000000a2', 10) is not null;
select fund_application('00000000-0000-4000-8000-0000000000a3') is not null;
select t_err($$select complete_shift('00000000-0000-4000-8000-0000000000a3','ok')$$, 'TOO_EARLY');
reset role; select set_config('request.jwt.claim.sub', :'S', false); set role authenticated;
select t_check((select count(*) from contacts where user_id = :'E') = 1, 'worker sees employer phone AFTER funding');
select t_err($$select complete_shift('00000000-0000-4000-8000-0000000000a1','ok')$$, 'FORBIDDEN');

-- ── direct client writes are blocked ──
select t_err($$update applications set pay_status = 'released' where id = '00000000-0000-4000-8000-0000000000a1'$$, 'permission denied');
select t_err($$insert into reviews (application_id, reviewer_id, reviewee_id, reviewer_role, stars) values ('00000000-0000-4000-8000-0000000000a1', '11111111-1111-4111-8111-0000000000a1', '11111111-1111-4111-8111-00000000000e', 'seeker', 5)$$, 'permission denied');
select t_err($$update profiles set is_admin = true where id = '11111111-1111-4111-8111-0000000000a1'$$, 'permission denied');
select t_err($$insert into payouts (application_id, seeker_id, amount) values ('00000000-0000-4000-8000-0000000000a1', '11111111-1111-4111-8111-0000000000a1', 1)$$, 'permission denied');
select t_err($$select * from app_settings$$, 'permission denied');

-- ── employer completes shift 1: paid, payout row created, review flow ──
reset role; select set_config('request.jwt.claim.sub', :'E', false); set role authenticated;
select complete_shift('00000000-0000-4000-8000-0000000000a1', 'late') is not null;
select t_err($$select complete_shift('00000000-0000-4000-8000-0000000000a1','ok')$$, 'ALREADY_SETTLED');
select t_err($$select submit_review('00000000-0000-4000-8000-0000000000a1', 5, array['friendly'], '')$$, 'BAD_TAGS');
select t_err($$select submit_review('00000000-0000-4000-8000-0000000000a1', 6, array['punctual'], '')$$, 'BAD_STARS');
select submit_review('00000000-0000-4000-8000-0000000000a1', 5, array['hardworking','punctual'], 'Tốt') is not null;
select t_err($$select submit_review('00000000-0000-4000-8000-0000000000a1', 5, array[]::text[], '')$$, 'ALREADY_REVIEWED');
select t_check((select count(*) from reviews) = 1, 'reviewer sees own review');
select t_check((select ratings from reputations(array['11111111-1111-4111-8111-0000000000a1']::uuid[])) = 0, 'review hidden from reputation until both reviewed');
reset role; select set_config('request.jwt.claim.sub', :'S', false); set role authenticated;
select t_check((select count(*) from reviews where reviewee_id = :'S') = 0, 'worker cannot read review about them before reveal');
select submit_review('00000000-0000-4000-8000-0000000000a1', 4, array['accurate_description'], 'Ok') is not null;
select t_check((select count(*) from reviews where reviewee_id = :'S') = 1, 'worker reads review about them after both reviewed');
select t_check((select ratings from reputations(array['11111111-1111-4111-8111-0000000000a1']::uuid[])) = 1, 'reputation counts revealed review');
select t_check((select late from reputations(array['11111111-1111-4111-8111-0000000000a1']::uuid[])) = 1, 'late attendance recorded');
select t_check((select count(*) from payouts) = 1, 'worker sees own payout only');
select t_check((select amount from payouts) = 276000, 'payout = 300000 - 24000 fee');
reset role; select set_config('request.jwt.claim.sub', :'S2', false); set role authenticated;
select t_check((select count(*) from payouts) = 0, 'other worker cannot see payouts');

-- ── bank account ──
reset role; select set_config('request.jwt.claim.sub', :'S', false); set role authenticated;
select t_err($$select save_bank_account('VCB', '12ab', 'NGUYEN VAN A')$$, 'BAD_BANK');
select save_bank_account('Vietcombank', '0123 4567 89', 'nguyen van a');
select t_check((select account_no from bank_accounts) = '0123456789', 'bank account saved + normalised');
reset role; select set_config('request.jwt.claim.sub', :'S2', false); set role authenticated;
select t_check((select count(*) from bank_accounts) = 0, 'other users cannot read bank accounts');

-- ── no-show → contest → dispute → admin ──
reset role; select set_config('request.jwt.claim.sub', :'E', false); set role authenticated;
select complete_shift('00000000-0000-4000-8000-0000000000a2', 'noshow') is not null;
reset role; select set_config('request.jwt.claim.sub', :'S2', false); set role authenticated;
select respond_noshow('00000000-0000-4000-8000-0000000000a2', false) is not null;
select t_err($$select admin_disputes()$$, 'FORBIDDEN');
select t_err($$select resolve_dispute('00000000-0000-4000-8000-0000000000a2','refund','x')$$, 'FORBIDDEN');
reset role; select set_config('request.jwt.claim.sub', :'A', false); set role authenticated;
select t_check((select count(*) from admin_disputes()) = 1, 'admin sees the dispute');
select t_check((select seeker_phone from admin_disputes()) = '+84900000003', 'admin sees both phones');
select t_err($$select resolve_dispute('00000000-0000-4000-8000-0000000000a2','banana','x')$$, 'BAD_OUTCOME');
reset role;
select t_check((select filled from jobs where id = '00000000-0000-4000-8000-000000000001') = 2 and (select status from jobs where id = '00000000-0000-4000-8000-000000000001') = 'closed', 'job full+closed before refund');
set role authenticated;
select resolve_dispute('00000000-0000-4000-8000-0000000000a2', 'refund', 'Người làm không có mặt') is not null;
select t_err($$select resolve_dispute('00000000-0000-4000-8000-0000000000a2','release','x')$$, 'NOT_DISPUTED');
reset role;
select t_check((select filled from jobs where id = '00000000-0000-4000-8000-000000000001') = 1 and (select status from jobs where id = '00000000-0000-4000-8000-000000000001') = 'open', 'refund frees the slot and reopens job');
set role authenticated;

-- ── admin payout queue ──
select t_check((select count(*) from admin_payouts()) = 1, 'admin sees payout queue');
select t_check((select account_no from admin_payouts()) = '0123456789', 'admin sees worker bank account');
select mark_payout_paid((select id from admin_payouts() limit 1), 'FT123456');
select t_err($$select mark_payout_paid((select id from admin_payouts() limit 1), 'x')$$, 'PAYOUT_DONE');
select t_check((select status from admin_payouts()) = 'paid', 'payout marked paid');
reset role; select set_config('request.jwt.claim.sub', :'S', false); set role authenticated;
select t_err($$select mark_payout_paid(gen_random_uuid(), 'x')$$, 'FORBIDDEN');

-- ── sweep: unconfirmed shift auto-pays after end_date + 2 ──
reset role;
update jobs set end_date = current_date - 3, start_date = current_date - 4 where id = '00000000-0000-4000-8000-000000000002';
select set_config('request.jwt.claim.sub', :'S', false); set role authenticated;
select sweep_overdue();
select t_check((select pay_status from applications where id = '00000000-0000-4000-8000-0000000000a3') = 'released', 'sweep auto-releases unconfirmed shift');
select t_check((select count(*) from payouts) = 2, 'auto-release also creates a payout');
\echo ALL SCENARIOS PASSED
