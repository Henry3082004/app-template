\set ON_ERROR_STOP on
\set QUIET on
-- Nobody can write contacts (phone / verified) from the browser. SK and OT come from 100_collab.sql.
\set SK '11111111-1111-4111-8111-0000000000e1'
\set OT '11111111-1111-4111-8111-0000000000e3'
reset role;
insert into contacts (user_id, phone, verified) values (:'SK', '+84911000999', false) on conflict (user_id) do update set phone = excluded.phone, verified = false;
set role authenticated; select set_config('request.jwt.claim.sub', :'SK', false);
select t_err($$update contacts set verified = true where user_id = '11111111-1111-4111-8111-0000000000e1'$$, 'permission denied');
select t_err($$update contacts set phone = '+84911000888' where user_id = '11111111-1111-4111-8111-0000000000e1'$$, 'permission denied');
select t_err($$insert into contacts (user_id, phone, verified) values ('11111111-1111-4111-8111-0000000000e1', '+84911000777', true)$$, 'permission denied');
select t_err($$delete from contacts where user_id = '11111111-1111-4111-8111-0000000000e1'$$, 'permission denied');
select t_check((select count(*) = 1 from contacts where user_id = :'SK'), 'a person still reads their own contact');
select t_check(not has_table_privilege('authenticated', 'public.contacts', 'update') and not has_table_privilege('authenticated', 'public.contacts', 'insert')
  and not has_table_privilege('anon', 'public.contacts', 'truncate'), 'no write or truncate right is left');
reset role;
select t_check((select not verified from contacts where user_id = :'SK'), 'the verified flag was not changed');
select 'PASSED 140_contacts_lockdown';
