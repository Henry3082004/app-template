\set ON_ERROR_STOP on
\set QUIET on
-- Capy AI: off by default, visible in app_config, usage counted per key with per-person and global daily caps, closed to the app.
reset role;
select t_check(app_config()->>'ai_assistant' = 'off', 'the AI helper is off by default and shown in app_config');
select t_check(ai_hit('d:abc', 2, 100) and ai_hit('d:abc', 2, 100), 'two requests are allowed');
select t_check(not ai_hit('d:abc', 2, 100), 'the third is refused (per-person cap)');
select t_check(ai_hit('u:other', 2, 100), 'another person still has theirs');
select t_check(not ai_hit('u:third', 2, 3), 'the global daily cap stops everyone');
set role anon; select set_config('request.jwt.claim.sub', '', false);
select t_err($$select ai_hit('d:x', 1, 1)$$, 'permission denied');
select t_err($$select * from ai_usage$$, 'permission denied');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-0000000000e1', false);
select t_err($$select ai_hit('u:x', 1, 1)$$, 'permission denied');
select t_err($$select * from ai_usage$$, 'permission denied');
reset role;
select 'PASSED 170_capy_ai';
