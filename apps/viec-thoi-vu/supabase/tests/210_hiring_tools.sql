\set ON_ERROR_STOP on
\set QUIET on
-- Hiring tools: job guide, shift agreement, referral codes and the boost they give. Free mode.
\set W1 '11111111-1111-4111-8111-0000000007c1'
\set W2 '11111111-1111-4111-8111-0000000007c2'
\set SH '11111111-1111-4111-8111-0000000007c9'
\set S2 '11111111-1111-4111-8111-0000000007c8'
\set J1 '00000000-0000-4000-8000-0000000007a1'
\set J2 '00000000-0000-4000-8000-0000000007a2'
\set A1 '00000000-0000-4000-8000-0000000007b1'
\set A2 '00000000-0000-4000-8000-0000000007b2'
reset role;
update public.app_settings set value = 'off' where key = 'payment_mode';
insert into auth.users (id, email) values (:'W1', 'c1@x.test'), (:'W2', 'c2@x.test'), (:'SH', 'c9@x.test'), (:'S2', 'c8@x.test');
insert into profiles (id, role, full_name, business_name) values
  (:'W1', 'seeker', 'Người làm C1', null), (:'W2', 'seeker', 'Người làm C2', null), (:'SH', 'employer', 'Chủ quán C9', 'Quán C9'), (:'S2', 'employer', 'Chủ quán C8', 'Quán C8');
insert into jobs (id, employer_id, title, pay_amount, pay_unit, start_date, end_date, slots) values
  (:'J1', :'SH', 'Phục vụ có hướng dẫn', 300000, 'day', current_date + 2, current_date + 2, 2);
insert into applications (id, job_id, seeker_id) values (:'A1', :'J1', :'W1'), (:'A2', :'J1', :'W2');

-- ── job guide: only the shop writes it; only the shop and accepted workers read it ──────────────
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'W1', false);
select t_err($$select set_job_guide('00000000-0000-4000-8000-0000000007a1', 'x')$$, 'FORBIDDEN');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'SH', false);
select set_job_guide(:'J1', 'Mặc áo đen, đến sớm 15 phút, gặp chị Lan ở quầy.');
select t_check(job_guide(:'J1') like 'Mặc áo đen%', 'the shop reads its own guide');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'W1', false);
select t_check(job_guide(:'J1') is null, 'a worker who only applied cannot read it');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'SH', false);
select decide_application(:'A1', 'accepted') is not null;
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'W1', false);
select t_check(job_guide(:'J1') like 'Mặc áo đen%', 'once accepted the worker reads it');
select t_check((select count(*) = 1 from my_notifications() where kind = 'job_guide' and body like '%Mặc áo đen%'), 'and gets it as a notification');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'W2', false);
select t_check(job_guide(:'J1') is null, 'the other applicant still cannot');
select t_check((select count(*) = 0 from my_notifications() where kind = 'job_guide'), 'and got no guide notification');
reset role; set role anon; select set_config('request.jwt.claim.sub', '', false);
select t_err($$select job_guide('00000000-0000-4000-8000-0000000007a1')$$, 'permission denied');
select t_err($$select * from job_guides$$, 'permission denied');

-- ── shift agreement ─────────────────────────────────────────────────────────────────────────────
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'W2', false);
select t_err($$select agree_shift('00000000-0000-4000-8000-0000000007b1')$$, 'FORBIDDEN');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'W1', false);
select agree_shift(:'A1');
select agree_shift(:'A1');
reset role;
select t_check((select agreed_seeker_at is not null and agreed_employer_at is null from applications where id = :'A1'), 'the worker agreed, the shop not yet');
select t_check((select count(*) = 1 from notifications where user_id = :'SH' and kind = 'agreed'), 'the shop is told once');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'SH', false);
select agree_shift(:'A1');
reset role;
select t_check((select agreed_employer_at is not null from applications where id = :'A1'), 'then the shop agrees');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'SH', false);
select t_err($$select agree_shift('00000000-0000-4000-8000-0000000007b2')$$, 'NOT_ACCEPTED');

-- ── referral codes ──────────────────────────────────────────────────────────────────────────────
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'S2', false);
select code as c2 from my_referral() \gset
select t_check(length(:'c2') = 6, 'a code has 6 characters');
select t_check((select code = :'c2' and n = 0 from my_referral()), 'asking again gives the same code');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'SH', false);
select t_err($$select redeem_referral('ZZZZZZ')$$, 'BAD_CODE');
select t_err($$select redeem_referral(my.code) from my_referral() my$$, 'OWN_CODE');
-- SH is a new account (made just now) → can use S2's code; S2 has an open post that gets boosted
reset role;
insert into jobs (id, employer_id, title, pay_amount, pay_unit, start_date, end_date, slots) values (:'J2', :'S2', 'Tin của quán giới thiệu', 300000, 'day', current_date + 3, current_date + 3, 1);
select t_check((select boosted_until is null from jobs where id = :'J2'), 'no boost before a referral');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'SH', false);
select redeem_referral(lower(:'c2'));
select t_err(format('select redeem_referral(%L)', :'c2'), 'ALREADY_REFERRED');
reset role;
select t_check((select boosted_until > now() + interval '6 days' from jobs where id = :'J2'), 'the referrer''s open post is boosted for 7 days');
select t_check((select boosted_until > now() + interval '6 days' from jobs where id = :'J1'), 'and so is the new user''s');
select t_check((select count(*) = 1 from notifications where user_id = :'S2' and kind = 'referral'), 'the referrer is thanked');
insert into jobs (id, employer_id, title, pay_amount, pay_unit, start_date, end_date, slots) values ('00000000-0000-4000-8000-0000000007a3', :'S2', 'Tin mới sau giới thiệu', 300000, 'day', current_date + 3, current_date + 3, 1);
select t_check((select boosted_until > now() from jobs where id = '00000000-0000-4000-8000-0000000007a3'), 'a post made during the boost starts boosted');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'S2', false);
select t_check((select n = 1 from my_referral()), 'the referrer sees 1 referral');
-- an old account cannot use a code
reset role;
update profiles set created_at = now() - interval '30 days' where id = :'W1';
reset role;
select code as c3 from referral_codes where user_id = :'S2' \gset
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'W1', false);
select t_err(format('select redeem_referral(%L)', :'c3'), 'TOO_LATE');
-- boosts end
reset role;
update boosts set until = now() - interval '1 hour';
update jobs set boosted_until = now() - interval '1 hour' where id = :'J2';
select t_check(private.expire_boosts() >= 1, 'expired boosts are cleared');
select t_check((select boosted_until is null from jobs where id = :'J2'), 'and the post goes back to the normal order');
\echo PASSED 210_hiring_tools
