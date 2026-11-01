\set ON_ERROR_STOP on
\set QUIET on
-- Tasks inside a shift: cleaned on write, and read by the suspicious-phrase screening.
\set SH '11111111-1111-4111-8111-00000000081b'
reset role;
insert into auth.users (id, email) values (:'SH', 'tk@x.test');
insert into profiles (id, role, full_name, business_name) values (:'SH', 'employer', 'Chủ T', 'Quán T');
insert into jobs (id, employer_id, title, pay_amount, pay_unit, start_date, end_date, slots, tasks) values
  ('00000000-0000-4000-8000-0000000009a1', :'SH', 'Có đầu việc', 300000, 'day', current_date + 2, current_date + 2, 1,
   array['  Gọt hàng ', 'Bưng bê', 'bưng bê', '', '   ', repeat('x', 70), 'Lọc cá']);
select t_check((select tasks[1] = 'Gọt hàng' and tasks[2] = 'Bưng bê' and tasks[3] = repeat('x', 60) and tasks[4] = 'Lọc cá' and cardinality(tasks) = 4 from jobs where id = '00000000-0000-4000-8000-0000000009a1'),
  'trimmed, repeats and blanks dropped, long ones cut, order kept');
select t_check((select status = 'open' and vetted from jobs where id = '00000000-0000-4000-8000-0000000009a1'), 'clean tasks leave the post public');
insert into jobs (id, employer_id, title, pay_amount, pay_unit, start_date, end_date, slots, tasks) values
  ('00000000-0000-4000-8000-0000000009a2', :'SH', 'Nhiều đầu việc', 300000, 'day', current_date + 2, current_date + 2, 1,
   (select array_agg('Việc ' || g) from generate_series(1, 20) g));
select t_check((select cardinality(tasks) = 12 and tasks[12] = 'Việc 12' from jobs where id = '00000000-0000-4000-8000-0000000009a2'), 'at most 12 tasks');
insert into jobs (id, employer_id, title, pay_amount, pay_unit, start_date, end_date, slots) values
  ('00000000-0000-4000-8000-0000000009a3', :'SH', 'Không đầu việc', 300000, 'day', current_date + 2, current_date + 2, 1);
select t_check((select tasks = '{}' from jobs where id = '00000000-0000-4000-8000-0000000009a3'), 'no tasks is an empty list');
-- a deposit asked for inside a task is caught like in the description
update jobs set tasks = array['Bưng bê', 'Nộp phí hồ sơ 100k'] where id = '00000000-0000-4000-8000-0000000009a3';
select t_check((select status = 'closed' and not vetted and held_reason like '%phí%' from jobs where id = '00000000-0000-4000-8000-0000000009a3'), 'a fee in a task holds the post');
update jobs set tasks = array['Bưng bê'] where id = '00000000-0000-4000-8000-0000000009a3';
select t_check((select held_reason is null and vetted from jobs where id = '00000000-0000-4000-8000-0000000009a3'), 'taking it out releases the post');
\echo PASSED 230_job_tasks
