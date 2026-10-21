\set ON_ERROR_STOP on
\set QUIET on
-- "Capy hỏi nhanh": answers saved per device, folded into the account on sign-in, never readable directly.
\set W '11111111-1111-4111-8111-0000000000c1'
\set B '11111111-1111-4111-8111-0000000000c3'
\set D1 'aaaaaaaa-0000-4000-8000-000000000001'
\set D2 'aaaaaaaa-0000-4000-8000-000000000002'
reset role;

-- signed out: answers kept per device, junk dropped
set role anon; select set_config('request.jwt.claim.sub', '', false);
select save_quiz(:'D1', '{"goal":"seeker","city":"TP.HCM","cats":["service","hack"],"time":["evening"],"evil":1,"exp":null}');
select save_quiz(:'D1', '{"cats":["service","event"]}');
select t_err($$select * from quiz_answers$$, 'permission denied');
select t_err($$select save_quiz(null, '{"goal":"seeker"}')$$, 'BAD_QUIZ');
reset role;
select t_check((select answers = '{"goal":"seeker","city":"TP.HCM","time":["evening"],"exp":null,"cats":["service","event"]}'::jsonb and user_id is null from quiz_answers where device_id = :'D1'),
  'anonymous answers stored per device; unknown questions/values dropped (a list with an unknown value is dropped whole); later answers merge');

-- signing in on that device folds the answers into the account
set role authenticated; select set_config('request.jwt.claim.sub', :'W', false);
select save_quiz(:'D1', '{"exp":["service"]}');
select t_check((select my_quiz() = '{"goal":"seeker","city":"TP.HCM","time":["evening"],"exp":["service"],"cats":["service","event"]}'::jsonb), 'account sees its answers (device answers + new one)');
-- a second device for the same account merges into the same row, the anonymous row from that device disappears
reset role; set role anon; select set_config('request.jwt.claim.sub', '', false);
select save_quiz(:'D2', '{"city":"Hà Nội"}');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'W', false);
select save_quiz(:'D2', '{"time":["weekend"]}');
reset role;
select t_check((select count(*) = 1 from quiz_answers where user_id = :'W'), 'one row per account');
select t_check((select answers ->> 'city' = 'Hà Nội' and answers -> 'time' = '["weekend"]' from quiz_answers where user_id = :'W'), 'answers from the second device merged in');
select t_check((select count(*) = 0 from quiz_answers where device_id = :'D2' and user_id is null), 'anonymous row of the second device folded away');

-- someone else signs in on the first phone: they get their own row, W keeps theirs
set role authenticated; select set_config('request.jwt.claim.sub', :'B', false);
select t_check((select my_quiz() = '{}'::jsonb), 'nothing shown to another account');
select save_quiz(:'D1', '{"goal":"employer"}');
select t_check((select my_quiz() = '{"goal":"employer"}'::jsonb), 'shared phone: second account gets its own answers');
reset role;
select t_check((select answers ->> 'goal' = 'seeker' from quiz_answers where user_id = :'W'), 'first account untouched');
select 'PASSED 80_quiz' as result;
