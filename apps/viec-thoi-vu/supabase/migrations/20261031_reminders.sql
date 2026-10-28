-- Automatic reminders (in-app notifications), run every hour by pg_cron. Times are Vietnam time. Each reminder is sent at most once
-- (per day for "today"), so running the function again never repeats it.
--   · the evening before (from 17:00): "tomorrow you have a shift"
--   · the work-day morning (from 06:00): "today you have a shift" (tap "I'm here" when you arrive)
--   · the shop (from 08:00): a shift has ended but nobody confirmed it yet
--   · both sides (from 09:00): 1 to 7 days after a confirmed shift, "please review" if they have not yet
-- Sample accounts (is_sample) are skipped. p_now exists so tests can pretend to be a different time of day.

create or replace function private.send_reminders(p_now timestamptz default now()) returns int
language plpgsql security definer set search_path = public as $$
declare
  vn timestamp := p_now at time zone 'Asia/Ho_Chi_Minh';
  today date := vn::date;
  hr int := extract(hour from vn)::int;
  n int := 0; c int; r record;
begin
  if hr >= 17 then
    for r in select a.id app, a.seeker_id, j.title, coalesce(p.business_name, p.full_name) biz, nullif(j.shift_note, '') note
             from public.applications a join public.jobs j on j.id = a.job_id join public.profiles p on p.id = j.employer_id
             where a.status = 'accepted' and a.pay_status in ('none', 'held') and j.start_date = today + 1
               and not exists (select 1 from public.profiles sp where sp.id in (a.seeker_id, j.employer_id) and sp.is_sample)
               and not exists (select 1 from public.notifications x where x.user_id = a.seeker_id and x.kind = 'remind_tomorrow' and x.ref = a.id)
    loop
      insert into public.notifications (user_id, kind, title, body, link, ref)
      values (r.seeker_id, 'remind_tomorrow', 'Ngày mai bạn có ca làm', left('Việc "' || r.title || '" tại ' || r.biz || coalesce(' · ' || r.note, ''), 300), '/app/cham-cong', r.app);
      n := n + 1;
    end loop;
  end if;

  if hr >= 6 then
    for r in select a.id app, a.seeker_id, j.title, coalesce(p.business_name, p.full_name) biz, nullif(j.shift_note, '') note
             from public.applications a join public.jobs j on j.id = a.job_id join public.profiles p on p.id = j.employer_id
             where a.status = 'accepted' and a.pay_status in ('none', 'held') and j.start_date <= today and j.end_date >= today
               and not exists (select 1 from public.profiles sp where sp.id in (a.seeker_id, j.employer_id) and sp.is_sample)
               and not exists (select 1 from public.notifications x where x.user_id = a.seeker_id and x.kind = 'remind_today' and x.ref = a.id
                               and (x.created_at at time zone 'Asia/Ho_Chi_Minh')::date = today)
    loop
      insert into public.notifications (user_id, kind, title, body, link, ref)
      values (r.seeker_id, 'remind_today', 'Hôm nay bạn có ca làm', left('Việc "' || r.title || '" tại ' || r.biz || coalesce(' · ' || r.note, '') || ' — đến nơi nhớ bấm "Tôi đã đến"', 300), '/app/cham-cong', r.app);
      n := n + 1;
    end loop;
  end if;

  if hr >= 8 then
    for r in select a.id app, j.employer_id, j.title, wp.full_name who
             from public.applications a join public.jobs j on j.id = a.job_id join public.profiles wp on wp.id = a.seeker_id
             where a.status = 'accepted' and a.pay_status in ('none', 'held') and j.end_date < today
               and not exists (select 1 from public.profiles sp where sp.id in (a.seeker_id, j.employer_id) and sp.is_sample)
               and not exists (select 1 from public.notifications x where x.user_id = j.employer_id and x.kind = 'remind_confirm' and x.ref = a.id)
    loop
      insert into public.notifications (user_id, kind, title, body, link, ref)
      values (r.employer_id, 'remind_confirm', 'Có ca chưa xác nhận', left(r.who || ' · "' || r.title || '" — xác nhận để tính uy tín và chi phí', 300), '/app/ca-lam', r.app);
      n := n + 1;
    end loop;
  end if;

  if hr >= 9 then
    for r in select a.id app, a.seeker_id, j.employer_id, j.title
             from public.applications a join public.jobs j on j.id = a.job_id
             where a.pay_status = 'released' and a.released_at < p_now - interval '1 day' and a.released_at > p_now - interval '7 days'
               and not exists (select 1 from public.profiles sp where sp.id in (a.seeker_id, j.employer_id) and sp.is_sample)
    loop
      if not exists (select 1 from public.reviews v where v.application_id = r.app and v.reviewer_id = r.seeker_id)
         and not exists (select 1 from public.notifications x where x.user_id = r.seeker_id and x.kind = 'remind_review' and x.ref = r.app) then
        insert into public.notifications (user_id, kind, title, body, link, ref)
        values (r.seeker_id, 'remind_review', 'Hãy đánh giá quán', left('Ca "' || r.title || '" đã xong. Đánh giá giúp người khác chọn đúng quán.', 300), '/app/cham-cong', r.app);
        n := n + 1;
      end if;
      if not exists (select 1 from public.reviews v where v.application_id = r.app and v.reviewer_id = r.employer_id)
         and not exists (select 1 from public.notifications x where x.user_id = r.employer_id and x.kind = 'remind_review' and x.ref = r.app) then
        insert into public.notifications (user_id, kind, title, body, link, ref)
        values (r.employer_id, 'remind_review', 'Hãy đánh giá người làm', left('Ca "' || r.title || '" đã xong. Đánh giá giúp quán khác chọn đúng người.', 300), '/app/ca-lam', r.app);
        n := n + 1;
      end if;
    end loop;
  end if;
  return n;
end $$;
revoke all on function private.send_reminders(timestamptz) from public, anon, authenticated;

-- every hour at minute 5 (only where pg_cron exists; the local test database has none)
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if not exists (select 1 from cron.job where jobname = 'vtv-reminders') then
      perform cron.schedule('vtv-reminders', '5 * * * *', 'select private.send_reminders()');
    end if;
  end if;
end $$;
