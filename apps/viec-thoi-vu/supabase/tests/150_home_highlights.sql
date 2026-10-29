\set ON_ERROR_STOP on
\set QUIET on
-- The home banner numbers: counts only, sample jobs excluded, news filtered to https links, anyone can read. Reuses EM of 100_collab.sql.
\set EM '11111111-1111-4111-8111-0000000000e2'
reset role;
alter table jobs add column if not exists is_sample boolean not null default false;  -- lives in a migration this suite does not run
truncate jobs cascade;  -- last scenario: start from a clean list so the counts below are exact
insert into jobs (employer_id, title, pay_amount, pay_unit, start_date, end_date, slots, city, category, is_urgent, is_sample, status) values
  (:'EM', 'A1', 1, 'day', current_date, current_date + 1, 1, 'TP.HCM', 'service', true,  false, 'open'),
  (:'EM', 'A2', 1, 'day', current_date, current_date + 1, 1, 'TP.HCM', 'service', false, false, 'open'),
  (:'EM', 'A3', 1, 'day', current_date, current_date + 1, 1, 'Hà Nội', 'warehouse', false, false, 'open'),
  (:'EM', 'A4', 1, 'day', current_date, current_date + 1, 1, 'TP.HCM', 'service', false, true,  'open'),   -- sample: not counted
  (:'EM', 'A5', 1, 'day', current_date, current_date + 1, 1, 'TP.HCM', 'service', false, false, 'closed'); -- closed: not counted
delete from app_settings where key = 'home_news';
insert into app_settings (key, value) values ('home_news', '[{"title":"Hợp lệ","sub":"ok","url":"https://example.com/a","source":"Báo A"},{"title":"Không https","url":"http://example.com/b"},{"title":"Nguy hiểm","url":"javascript:alert(1)"},{"title":"","url":"https://example.com/c"}]');

set role anon; select set_config('request.jwt.claim.sub', '', false);
select t_check((home_highlights()->>'open_jobs')::int = 3, 'visitors see how many jobs are open (sample and closed ones are not counted)');
select t_check((home_highlights()->>'urgent_jobs')::int = 1 and (home_highlights()->>'new_jobs_7d')::int = 3, 'urgent and new-this-week counts');
select t_check(home_highlights()->'top_city'->>'name' = 'TP.HCM' and (home_highlights()->'top_city'->>'n')::int = 2, 'the area with most openings');
select t_check(home_highlights()->'top_category'->>'name' = 'service', 'the trade with most openings');
select t_check(jsonb_array_length(home_highlights()->'news') = 1 and home_highlights()->'news'->0->>'url' = 'https://example.com/a', 'only https links with a title are passed on');
select t_check(not (home_highlights()::text ~* 'phone|email|full_name'), 'nothing personal is in the answer');
reset role;
update app_settings set value = 'not json' where key = 'home_news';
set role authenticated; select set_config('request.jwt.claim.sub', :'EM', false);
select t_check(home_highlights()->'news' = '[]'::jsonb, 'broken news setting gives no news instead of an error');
reset role;
select 'PASSED 150_home_highlights';
