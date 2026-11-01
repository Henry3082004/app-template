\set ON_ERROR_STOP on
\set QUIET on
-- admin_kpis: admin only; counts real posts, answers within 24 hours, repeat shops, weekly finished shifts.
\set AD '11111111-1111-4111-8111-00000000071a'
\set SH '11111111-1111-4111-8111-00000000071b'
\set W1 '11111111-1111-4111-8111-00000000071c'
\set W2 '11111111-1111-4111-8111-00000000071d'
reset role;
update public.app_settings set value = 'off' where key = 'payment_mode';
alter table profiles add column if not exists is_sample boolean not null default false;
insert into auth.users (id, email) values (:'AD', 'k1@x.test'), (:'SH', 'k2@x.test'), (:'W1', 'k3@x.test'), (:'W2', 'k4@x.test');
insert into profiles (id, role, full_name, business_name) values (:'AD', 'employer', 'Quản trị K', 'K'), (:'SH', 'employer', 'Chủ K', 'Quán K'), (:'W1', 'seeker', 'Làm K1', null), (:'W2', 'seeker', 'Làm K2', null);
update profiles set is_admin = true where id = :'AD';
-- the database already holds other test data: measure before and after
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'AD', false);
select (admin_kpis()->>'jobs_30d')::int b_jobs, (admin_kpis()->>'jobs_with_applicant_24h')::int b_got, (admin_kpis()->>'shops_60d')::int b_shops,
  (admin_kpis()->>'shops_repeat_60d')::int b_rep, (admin_kpis()->>'finished_30d')::int b_fin, (admin_kpis()->>'noshow_30d')::int b_bad,
  (select coalesce(sum((x->>'shifts')::int), 0) from jsonb_array_elements(admin_kpis()->'weekly_shifts') x)::int b_shifts \gset
reset role;
insert into jobs (id, employer_id, title, pay_amount, pay_unit, start_date, end_date, slots) values
  ('00000000-0000-4000-8000-0000000008a1', :'SH', 'Có người ngay', 300000, 'day', current_date - 1, current_date - 1, 1),
  ('00000000-0000-4000-8000-0000000008a2', :'SH', 'Không ai', 300000, 'day', current_date + 5, current_date + 5, 1);
insert into applications (id, job_id, seeker_id, status, pay_status, attendance, released_at, completed_at, decided_at, escrow_amount, funding_mode) values
  ('00000000-0000-4000-8000-0000000008b1', '00000000-0000-4000-8000-0000000008a1', :'W1', 'accepted', 'released', 'ok', now(), now(), now() + interval '2 hours', 300000, 'off');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'SH', false);
select t_err($$select admin_kpis()$$, 'FORBIDDEN');
reset role; set role anon; select set_config('request.jwt.claim.sub', '', false);
select t_err($$select admin_kpis()$$, 'permission denied');
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'AD', false);
select t_check((admin_kpis()->>'jobs_30d')::int = :b_jobs + 2, '2 more posts in 30 days');
select t_check((admin_kpis()->>'jobs_with_applicant_24h')::int = :b_got + 1, '1 of them got an applicant within a day');
select t_check((admin_kpis()->>'shops_60d')::int = :b_shops + 1 and (admin_kpis()->>'shops_repeat_60d')::int = :b_rep + 1, 'one more shop, which posted twice');
select t_check(jsonb_array_length(admin_kpis()->'weekly_shifts') = 8, '8 weeks listed');
select t_check((select sum((x->>'shifts')::int) from jsonb_array_elements(admin_kpis()->'weekly_shifts') x) = :b_shifts + 1, 'one more finished shift in the weekly numbers');
select t_check((admin_kpis()->>'avg_reply_hours_30d') is not null, 'reply time is measured');
select t_check((admin_kpis()->>'noshow_30d')::int = :b_bad and (admin_kpis()->>'finished_30d')::int = :b_fin + 1, 'no new no-shows, one more finished shift');
reset role;
update profiles set is_sample = true where id = :'SH';
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'AD', false);
select t_check((admin_kpis()->>'jobs_30d')::int = :b_jobs, 'sample shops are left out');
reset role;
\echo PASSED 220_admin_kpis
