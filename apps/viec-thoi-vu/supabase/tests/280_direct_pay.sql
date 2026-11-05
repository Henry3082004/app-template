\set ON_ERROR_STOP on
-- Isolated test fixtures; run after base schema + escrow/free-mode migrations and 10_scenarios.
reset role;
update public.app_settings set value='test' where key='payment_mode';
insert into jobs(id,employer_id,title,pay_amount,pay_unit,start_date,end_date,slots)
values ('00000000-0000-4000-8000-000000002801','11111111-1111-4111-8111-00000000000e','Direct pay',300000,'day',current_date,current_date,2);
insert into applications(id,job_id,seeker_id,status) values
('00000000-0000-4000-8000-0000000028a1','00000000-0000-4000-8000-000000002801','11111111-1111-4111-8111-0000000000a1','accepted'),
('00000000-0000-4000-8000-0000000028a2','00000000-0000-4000-8000-000000002801','11111111-1111-4111-8111-0000000000a2','pending');
set role anon;
select t_err($$select choose_direct_pay('00000000-0000-4000-8000-0000000028a1')$$,'permission denied');
reset role; set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-0000000000a1',false);
select t_err($$select choose_direct_pay('00000000-0000-4000-8000-0000000028a1')$$,'FORBIDDEN');
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-00000000000e',false);
select t_err($$select choose_direct_pay('00000000-0000-4000-8000-0000000028a2')$$,'NOT_ACCEPTED');
select t_err($$select complete_shift('00000000-0000-4000-8000-0000000028a1','ok')$$,'NOT_FUNDED');
select choose_direct_pay('00000000-0000-4000-8000-0000000028a1');
select choose_direct_pay('00000000-0000-4000-8000-0000000028a1');
select t_err($$select fund_application('00000000-0000-4000-8000-0000000028a1')$$,'ALREADY_FUNDED');
reset role;
select t_check(private.is_funded_pair('11111111-1111-4111-8111-00000000000e','11111111-1111-4111-8111-0000000000a1'),'direct settlement reveals contact');
set role authenticated;
select complete_shift('00000000-0000-4000-8000-0000000028a1','ok');
reset role;
select t_check((select pay_status='released' and funding_mode='off' and escrow_amount=300000 and platform_fee=0 from applications where id='00000000-0000-4000-8000-0000000028a1'),'complete without deposit');
select t_check(not exists(select 1 from payouts where application_id='00000000-0000-4000-8000-0000000028a1'),'no Capi payout created');
set role authenticated;
select t_err($$select choose_direct_pay('00000000-0000-4000-8000-0000000028a1')$$,'ALREADY_FUNDED');
reset role;
update public.app_settings set value='off' where key='payment_mode';
select 'PASSED 280_direct_pay';
