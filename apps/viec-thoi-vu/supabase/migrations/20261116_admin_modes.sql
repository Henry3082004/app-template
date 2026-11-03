-- Admin "view as" modes. Besides "a new visitor" and "admin", an admin can open the app as one of two SAMPLE accounts:
-- a shop and a worker that have been using the app for a while. Only sample accounts (profiles.is_sample) can be opened this way,
-- never a real customer's account (their messages and phone numbers stay private). The edge function `admin-switch` checks it.
--   · app_settings.demo_employer / demo_seeker: which sample accounts are used
--   · sample accounts see the other sample shops, workers and posts (real people never do), so the demo world is complete
--   · a history between the two: four finished shifts with reviews, an upcoming accepted shift, and two other sample workers
--     waiting on the shop's open post

create or replace function private.is_sample(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_sample from public.profiles where id = uid), false) $$;
grant execute on function private.is_sample(uuid) to anon, authenticated;

alter policy jobs_read on public.jobs using (
  (status = 'open'::job_status and (not is_sample or private.is_admin((select auth.uid())) or private.is_sample((select auth.uid()))))
  or employer_id = (select auth.uid())
  or private.has_applied(id, (select auth.uid()))
  or (is_sample and private.is_admin((select auth.uid()))));

alter policy profiles_read on public.profiles using (
  (('employer'::user_role = any (roles)) and (not is_sample or private.is_admin((select auth.uid())) or private.is_sample((select auth.uid()))))
  or id = (select auth.uid())
  or private.is_my_applicant(id, (select auth.uid()))
  or (is_sample and private.is_admin((select auth.uid())))
  or (is_sample and private.is_sample((select auth.uid()))));

insert into public.app_settings (key, value) values
  ('demo_employer', '11111111-1111-4111-8111-000000000011'), ('demo_seeker', '44444444-4444-4444-8444-000000000001')
on conflict (key) do nothing;

-- the history (fixed ids, so running it again changes nothing)
create or replace function private.seed_demo_history() returns void
language plpgsql security definer set search_path = public as $$
declare
  shop uuid := (select value::uuid from public.app_settings where key = 'demo_employer');
  me uuid := (select value::uuid from public.app_settings where key = 'demo_seeker');
  w2 uuid := '44444444-4444-4444-8444-000000000002';
  w3 uuid := '44444444-4444-4444-8444-000000000003';
  past record;
begin
  if not exists (select 1 from public.profiles where id = shop and is_sample) or not exists (select 1 from public.profiles where id = me and is_sample) then
    return; -- no sample accounts here (a fresh test database): nothing to add
  end if;
  for past in select * from (values
      ('d0000000-0000-4000-8000-0000000000a1'::uuid, 'd0000000-0000-4000-8000-0000000000b1'::uuid, 'Phục vụ tiệc cưới cuối tuần', 35, 5::smallint, 'Nhanh nhẹn, lễ phép với khách. Sẽ gọi lại.', 5::smallint, 'Quán trả đủ tiền, anh chị chủ dễ thương.'),
      ('d0000000-0000-4000-8000-0000000000a2'::uuid, 'd0000000-0000-4000-8000-0000000000b2'::uuid, 'Phụ bếp ca tối', 24, 5::smallint, 'Đúng giờ, làm sạch sẽ.', 4::smallint, 'Bếp hơi nóng nhưng mọi người hỗ trợ nhiệt tình.'),
      ('d0000000-0000-4000-8000-0000000000a3'::uuid, 'd0000000-0000-4000-8000-0000000000b3'::uuid, 'Rửa chén ca trưa', 14, 4::smallint, 'Làm tốt, lần sau đến sớm hơn chút.', 5::smallint, 'Công việc đúng như tin đăng.'),
      ('d0000000-0000-4000-8000-0000000000a4'::uuid, 'd0000000-0000-4000-8000-0000000000b4'::uuid, 'Phục vụ ca trưa', 6, 5::smallint, 'Rất được việc, khách khen.', 5::smallint, 'Làm ở đây vui, trả tiền ngay sau ca.')
    ) as t(job_id, app_id, title, days_ago, shop_stars, shop_comment, worker_stars, worker_comment)
  loop
    insert into public.jobs (id, employer_id, title, description, category, pay_amount, pay_unit, start_date, end_date, shift_note, address, city, slots, filled, status, is_sample, vetted, created_at)
    values (past.job_id, shop, past.title, 'Ca mẫu đã hoàn thành (dữ liệu mẫu).', 'service', 30000, 'hour', current_date - past.days_ago, current_date - past.days_ago,
            '11:00-15:00', '12 Nguyễn Huệ, Quận 1', 'TP.HCM', 2, 0, 'open', true, true, now() - make_interval(days => past.days_ago + 3))
    on conflict (id) do nothing;
    insert into public.applications (id, job_id, seeker_id, status, message, seen_by_employer, created_at, decided_at, pay_status, escrow_amount, funding_mode, attendance,
                                     confirmed_at, checked_in_at, checked_out_at, completed_at, released_at, paid_cash_at, cash_received_at, agreed_seeker_at, agreed_employer_at, as_posted)
    values (past.app_id, past.job_id, me, 'accepted', 'Em làm được ca này ạ', true, now() - make_interval(days => past.days_ago + 2), now() - make_interval(days => past.days_ago + 2),
            'released', 120000, 'off', 'ok',
            now() - make_interval(days => past.days_ago + 1), now() - make_interval(days => past.days_ago, hours => -4), now() - make_interval(days => past.days_ago, hours => -8),
            now() - make_interval(days => past.days_ago, hours => -9), now() - make_interval(days => past.days_ago, hours => -9),
            now() - make_interval(days => past.days_ago, hours => -9), now() - make_interval(days => past.days_ago, hours => -10),
            now() - make_interval(days => past.days_ago + 1), now() - make_interval(days => past.days_ago + 1), true)
    on conflict (id) do nothing;
    insert into public.reviews (application_id, reviewer_id, reviewee_id, reviewer_role, stars, comment, created_at)
    select past.app_id, shop, me, 'employer', past.shop_stars, past.shop_comment, now() - make_interval(days => past.days_ago - 1)
    where not exists (select 1 from public.reviews where application_id = past.app_id and reviewer_id = shop);
    insert into public.reviews (application_id, reviewer_id, reviewee_id, reviewer_role, stars, comment, created_at)
    select past.app_id, me, shop, 'seeker', past.worker_stars, past.worker_comment, now() - make_interval(days => past.days_ago - 1)
    where not exists (select 1 from public.reviews where application_id = past.app_id and reviewer_id = me);
  end loop;

  update public.jobs set status = 'closed' where id in ('d0000000-0000-4000-8000-0000000000a1','d0000000-0000-4000-8000-0000000000a2','d0000000-0000-4000-8000-0000000000a3','d0000000-0000-4000-8000-0000000000a4');

  -- coming up: an open post with one accepted shift (the demo worker) and two others waiting for an answer
  insert into public.jobs (id, employer_id, title, description, category, pay_amount, pay_unit, start_date, end_date, shift_note, address, city, slots, filled, status, is_sample, vetted, tasks)
  values ('d0000000-0000-4000-8000-0000000000a5', shop, 'Phục vụ ca tối cuối tuần', 'Bưng bê, dọn bàn, đón khách. Có cơm tối. (dữ liệu mẫu)', 'service', 32000, 'hour',
          current_date + 2, current_date + 3, '17:00-22:00', '12 Nguyễn Huệ, Quận 1', 'TP.HCM', 3, 1, 'open', true, true, array['Bưng bê', 'Dọn bàn', 'Đón khách'])
  on conflict (id) do nothing;
  insert into public.applications (id, job_id, seeker_id, status, message, seen_by_employer, created_at, decided_at, pay_status, escrow_amount, funding_mode)
  values ('d0000000-0000-4000-8000-0000000000b5', 'd0000000-0000-4000-8000-0000000000a5', me, 'accepted', 'Em rảnh cả hai tối ạ', true, now() - interval '1 day', now() - interval '20 hours', 'none', 160000, 'off')
  on conflict (id) do nothing;
  insert into public.applications (id, job_id, seeker_id, status, message, seen_by_employer, created_at)
  values ('d0000000-0000-4000-8000-0000000000b6', 'd0000000-0000-4000-8000-0000000000a5', w2, 'pending', 'Em có kinh nghiệm phục vụ 1 năm', false, now() - interval '5 hours'),
         ('d0000000-0000-4000-8000-0000000000b7', 'd0000000-0000-4000-8000-0000000000a5', w3, 'pending', 'Em làm được tối thứ Bảy', false, now() - interval '2 hours')
  on conflict (id) do nothing;
  delete from public.service_fees where application_id::text like 'd0000000-%'; -- sample shifts never count as real fees
end $$;
revoke all on function private.seed_demo_history() from public, anon, authenticated;
select private.seed_demo_history();

-- the edge function reads this (service role); nobody else needs it
create or replace function public.demo_account(p_kind text) returns uuid
language sql stable security definer set search_path = public as $$
  select p.id from public.profiles p
  where p.is_sample and p.id = (select value::uuid from public.app_settings where key = case p_kind when 'employer' then 'demo_employer' when 'seeker' then 'demo_seeker' end)
$$;
revoke all on function public.demo_account(text) from public, anon, authenticated;
do $$ begin if exists (select 1 from pg_roles where rolname = 'service_role') then grant execute on function public.demo_account(text) to service_role; end if; end $$;
