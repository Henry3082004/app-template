\set ON_ERROR_STOP on
\set QUIET on
-- The Zalo id ↔ account links and the revoke log are server-only (SK comes from 100_collab.sql).
\set SK '11111111-1111-4111-8111-0000000000e1'
reset role;
insert into zalo_links (user_id, zalo_id) values (:'SK', '4047671499938107249') on conflict (user_id) do update set zalo_id = excluded.zalo_id;
set role authenticated; select set_config('request.jwt.claim.sub', :'SK', false);
select t_err($$select * from zalo_links$$, 'permission denied');
select t_err($$insert into zalo_revokes (zalo_id, outcome) values ('1', 'no_account')$$, 'permission denied');
select t_check(not has_table_privilege('anon', 'public.zalo_links', 'select') and not has_table_privilege('authenticated', 'public.zalo_revokes', 'select'), 'nothing granted to the browser');
reset role;
select t_err($$insert into zalo_links (user_id, zalo_id) values ('11111111-1111-4111-8111-0000000000e3', '4047671499938107249')$$, 'duplicate key');
select 'PASSED 180_zalo_links';
