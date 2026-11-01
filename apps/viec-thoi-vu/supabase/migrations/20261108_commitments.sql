-- Commitments and trust signals (both sides worry "will the other keep their word?").
--   · the worker's "Tôi vẫn đến" (confirm_attendance) and the shop's alert when nobody confirmed on the work day
--   · backups: a shop marks a PENDING applicant as backup (no slot used); accepting later is the normal decide_application
--   · no-show lock: 2 confirmed no-shows in 30 days → the worker cannot apply for 7 days after the latest one
--   · the shop cancelling an accepted worker (cancel_hire): counted as a (late) cancel, the worker is pointed to other jobs
--   · the worker reporting "I have not been paid" (report_unpaid), counted on the shop
--   · trust_signals(): one read-only summary per user for the cards (no-shows, unpaid, cancels, reply time, verified phone)
-- The job has dates but no time of day, so "on the day" is Vietnam time and the shop alert goes out from 09:00.

alter table public.applications
  add column if not exists confirmed_at timestamptz,
  add column if not exists is_backup boolean not null default false,
  add column if not exists unpaid_reported_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancel_late boolean,
  add column if not exists as_posted boolean; -- the worker's answer to "was it as posted?" after a shift (filled by mark_as_posted)

-- a backup is a pending applicant: once decided it is no longer one
create or replace function private.backup_reset() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.status <> 'pending' then new.is_backup := false; end if;
  return new;
end $$;
revoke all on function private.backup_reset() from public, anon, authenticated;
create or replace trigger applications_backup_reset before update of status on public.applications
  for each row execute function private.backup_reset();

-- ── the lock after repeated no-shows ────────────────────────────────────────────────────────────
create or replace function private.apply_lock_until(uid uuid) returns timestamptz
language sql stable security definer set search_path = public as $$
  select case when count(*) >= 2 then max(coalesce(completed_at, created_at)) + interval '7 days' end
  from public.applications
  where seeker_id = uid and attendance = 'noshow' and pay_status = 'refunded'
    and coalesce(completed_at, created_at) > now() - interval '30 days'
$$;
revoke all on function private.apply_lock_until(uuid) from public, anon, authenticated;

create or replace function private.applications_lock() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if private.apply_lock_until(new.seeker_id) > now() then raise exception 'APPLY_LOCKED'; end if;
  return new;
end $$;
revoke all on function private.applications_lock() from public, anon, authenticated;
create or replace trigger applications_lock before insert on public.applications
  for each row execute function private.applications_lock();

create or replace function public.my_apply_lock() returns timestamptz
language sql stable security definer set search_path = public as $$
  select case when private.apply_lock_until(auth.uid()) > now() then private.apply_lock_until(auth.uid()) end
$$;

-- ── notifications: a cancelled hire is announced by cancel_hire itself, not as "not chosen" ──────
create or replace function private.applications_notify() returns trigger
language plpgsql security definer set search_path = public as $$
declare j public.jobs; biz text; who text;
begin
  select * into j from public.jobs where id = new.job_id;
  select coalesce(business_name, full_name) into biz from public.profiles where id = j.employer_id;
  select full_name into who from public.profiles where id = new.seeker_id;
  who := coalesce(who, 'Ứng viên'); biz := coalesce(biz, 'Quán');
  if tg_op = 'INSERT' then
    perform private.notify(j.employer_id, 'new_applicant', 'Có người ứng tuyển mới', who || ' ứng tuyển "' || j.title || '"', '/app/ung-vien');
    return new;
  end if;
  if new.status is distinct from old.status then
    if new.status = 'accepted' then
      perform private.notify(new.seeker_id, 'accepted', biz || ' đã nhận bạn', 'Việc "' || j.title || '" — xem ca và liên hệ quán', '/app/cham-cong');
    elsif new.status = 'rejected' and new.cancelled_at is null then
      perform private.notify(new.seeker_id, 'rejected', 'Đơn chưa được chọn', 'Việc "' || j.title || '" của ' || biz, '/app/da-ung-tuyen');
    end if;
  end if;
  if new.pay_status is distinct from old.pay_status then
    if new.pay_status = 'released' then
      perform private.notify(new.seeker_id, 'shift_done', 'Ca làm đã được xác nhận', biz || ' xác nhận bạn đã làm "' || j.title || '"', '/app/thu-nhap');
    elsif new.pay_status = 'noshow_reported' then
      perform private.notify(new.seeker_id, 'noshow', 'Quán báo bạn vắng ca', 'Việc "' || j.title || '" — xem và phản hồi nếu không đúng', '/app/cham-cong');
    end if;
  end if;
  if new.paid_cash_at is not null and old.paid_cash_at is null then
    perform private.notify(new.seeker_id, 'cash_paid', biz || ' đã ghi trả tiền mặt', 'Ca "' || j.title || '" — bấm xác nhận nếu bạn đã nhận', '/app/thu-nhap');
  end if;
  if new.cash_received_at is not null and old.cash_received_at is null then
    perform private.notify(j.employer_id, 'cash_received', 'Người làm xác nhận đã nhận tiền', who || ' · "' || j.title || '"', '/app/chi-phi');
  end if;
  if new.checked_in_at is not null and new.checked_in_at is distinct from old.checked_in_at then
    perform private.notify(j.employer_id, 'checked_in', who || ' đã đến', '"' || j.title || '"', '/app/ca-lam');
  end if;
  return new;
end $$;
revoke all on function private.applications_notify() from public, anon, authenticated;

-- ── "Tôi vẫn đến": the worker confirms the day before or on the work day ───────────────────────────
create or replace function public.confirm_attendance(p_application uuid) returns public.applications
language plpgsql security definer set search_path = public as $$
declare a public.applications; j public.jobs; who text;
  today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
begin
  select * into a from public.applications where id = p_application for update;
  if a.id is null or a.seeker_id <> auth.uid() then raise exception 'FORBIDDEN'; end if;
  if a.status <> 'accepted' then raise exception 'NOT_ACCEPTED'; end if;
  if a.pay_status not in ('none', 'held') then raise exception 'ALREADY_SETTLED'; end if;
  select * into j from public.jobs where id = a.job_id;
  if today < j.start_date - 1 then raise exception 'TOO_EARLY'; end if;
  if today > j.end_date then raise exception 'JOB_ENDED'; end if;
  if a.confirmed_at is not null then return a; end if; -- pressing twice is harmless
  update public.applications set confirmed_at = now() where id = a.id returning * into a;
  select full_name into who from public.profiles where id = a.seeker_id;
  perform private.notify(j.employer_id, 'attend_confirmed', coalesce(who, 'Người làm') || ' xác nhận vẫn đến', '"' || j.title || '"', '/app/ca-lam');
  return a;
end $$;

-- ── backups ────────────────────────────────────────────────────────────────────────────────────
create or replace function public.set_backup(p_application uuid, p_on boolean) returns public.applications
language plpgsql security definer set search_path = public as $$
declare a public.applications; j public.jobs; biz text;
begin
  select * into a from public.applications where id = p_application for update;
  if a.id is null then raise exception 'NOT_FOUND'; end if;
  select * into j from public.jobs where id = a.job_id;
  if j.employer_id <> auth.uid() then raise exception 'FORBIDDEN'; end if;
  if a.status <> 'pending' then raise exception 'ALREADY_DECIDED'; end if;
  if p_on and not a.is_backup then
    if (select count(*) from public.applications where job_id = a.job_id and is_backup and status = 'pending') >= j.slots then raise exception 'TOO_MANY_BACKUPS'; end if;
    select coalesce(business_name, full_name) into biz from public.profiles where id = j.employer_id;
    perform private.notify(a.seeker_id, 'backup', 'Bạn đang trong danh sách dự bị', coalesce(biz, 'Quán') || ' giữ bạn dự bị cho "' || j.title || '" — sẽ báo ngay nếu cần bạn', '/app/da-ung-tuyen');
  end if;
  update public.applications set is_backup = p_on where id = a.id returning * into a;
  return a;
end $$;

-- ── the shop cancels an accepted worker ──────────────────────────────────────────────────────────
-- Counted on the shop (late = on the work day or after). The slot reopens and the worker is pointed to other open jobs in the area.
create or replace function public.cancel_hire(p_application uuid) returns public.applications
language plpgsql security definer set search_path = public as $$
declare a public.applications; j public.jobs; biz text; n int;
  today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
begin
  select * into a from public.applications where id = p_application for update;
  if a.id is null then raise exception 'NOT_FOUND'; end if;
  select * into j from public.jobs where id = a.job_id;
  if j.employer_id <> auth.uid() then raise exception 'FORBIDDEN'; end if;
  if a.status <> 'accepted' then raise exception 'NOT_ACCEPTED'; end if;
  if a.pay_status <> 'none' then raise exception 'ALREADY_FUNDED'; end if;
  if a.checked_in_at is not null then raise exception 'ALREADY_STARTED'; end if;
  update public.applications set status = 'rejected', cancelled_at = now(), cancel_late = (today >= j.start_date), decided_at = now()
    where id = a.id returning * into a;
  perform private.free_slots(a.job_id, 1);
  select coalesce(business_name, full_name) into biz from public.profiles where id = j.employer_id;
  select count(*)::int into n from public.jobs x
    where x.status = 'open' and x.id <> j.id and x.end_date >= today and x.city is not distinct from j.city
      and not exists (select 1 from public.profiles sp where sp.id = x.employer_id and coalesce(sp.is_sample, false));
  perform private.notify(a.seeker_id, 'hire_cancelled', coalesce(biz, 'Quán') || ' đã hủy ca của bạn',
    'Việc "' || j.title || '"' || case when n > 0 then ' — còn ' || n || ' việc khác đang mở, xem ngay' else '' end, '/app');
  return a;
end $$;

-- ── "I have not been paid" (free mode, cash) ─────────────────────────────────────────────────────
create or replace function public.report_unpaid(p_application uuid) returns public.applications
language plpgsql security definer set search_path = public as $$
declare a public.applications; j public.jobs; who text;
begin
  select * into a from public.applications where id = p_application for update;
  if a.id is null or a.seeker_id <> auth.uid() then raise exception 'FORBIDDEN'; end if;
  if a.status <> 'accepted' or a.pay_status <> 'released' then raise exception 'NOT_COMPLETED'; end if;
  if coalesce(a.funding_mode, 'off') <> 'off' then raise exception 'NOT_CASH'; end if;
  if a.cash_received_at is not null then raise exception 'ALREADY_PAID'; end if;
  if a.released_at > now() - interval '1 day' then raise exception 'TOO_EARLY'; end if;
  if a.unpaid_reported_at is not null then return a; end if;
  update public.applications set unpaid_reported_at = now() where id = a.id returning * into a;
  select * into j from public.jobs where id = a.job_id;
  select full_name into who from public.profiles where id = a.seeker_id;
  perform private.notify(j.employer_id, 'unpaid_reported', coalesce(who, 'Người làm') || ' báo chưa nhận được tiền', '"' || j.title || '" — kiểm tra và trả cho người làm', '/app/chi-phi');
  return a;
end $$;

-- ── one summary per user, for the cards ────────────────────────────────────────────────────────
-- noshow_30d / noshow_total: confirmed no-shows of a worker · unpaid / cancels / late_cancels / hires / mismatch / reply_hours: a shop
-- · reply_hours is the typical time a shop takes to decide (null until it has decided 3 applications in 90 days).
create or replace function public.trust_signals(p_users uuid[])
returns table (user_id uuid, noshow_30d int, noshow_total int, apply_locked_until timestamptz, unpaid int, cancels int, late_cancels int,
               hires int, reply_hours numeric, phone_verified boolean, mismatch int)
language sql stable security definer set search_path = public as $$
  select u.id,
    (select count(*)::int from public.applications a where a.seeker_id = u.id and a.attendance = 'noshow' and a.pay_status = 'refunded'
       and coalesce(a.completed_at, a.created_at) > now() - interval '30 days'),
    (select count(*)::int from public.applications a where a.seeker_id = u.id and a.attendance = 'noshow' and a.pay_status = 'refunded'),
    case when private.apply_lock_until(u.id) > now() then private.apply_lock_until(u.id) end,
    (select count(*)::int from public.applications a join public.jobs j on j.id = a.job_id
       where j.employer_id = u.id and a.unpaid_reported_at is not null and a.cash_received_at is null),
    (select count(*)::int from public.applications a join public.jobs j on j.id = a.job_id where j.employer_id = u.id and a.cancelled_at is not null),
    (select count(*)::int from public.applications a join public.jobs j on j.id = a.job_id where j.employer_id = u.id and a.cancel_late),
    (select count(*)::int from public.applications a join public.jobs j on j.id = a.job_id
       where j.employer_id = u.id and (a.status = 'accepted' or a.cancelled_at is not null)),
    (select case when count(*) >= 3 then round(avg(extract(epoch from (a.decided_at - a.created_at)) / 3600)::numeric, 0) end
       from public.applications a join public.jobs j on j.id = a.job_id
       where j.employer_id = u.id and a.decided_at is not null and a.created_at > now() - interval '90 days'),
    coalesce((select bool_or(c.verified) from public.contacts c where c.user_id = u.id), false),
    (select count(*)::int from public.applications a join public.jobs j on j.id = a.job_id where j.employer_id = u.id and a.as_posted = false)
  from unnest(p_users) as u(id)
$$;

-- ── hourly alerts (pg_cron, minute 15): unconfirmed arrival, empty posts, unanswered applications, expired posts ─────────
create or replace function private.send_commit_alerts(p_now timestamptz default now()) returns int
language plpgsql security definer set search_path = public as $$
declare
  vn timestamp := p_now at time zone 'Asia/Ho_Chi_Minh';
  today date := vn::date;
  hr int := extract(hour from vn)::int;
  n int := 0; r record; bk int;
begin
  if hr >= 8 then -- the worker is asked to confirm
    for r in select a.id app, a.seeker_id, j.title from public.applications a join public.jobs j on j.id = a.job_id
             where a.status = 'accepted' and a.pay_status in ('none', 'held') and j.start_date = today and a.confirmed_at is null and a.checked_in_at is null
               and not exists (select 1 from public.profiles sp where sp.id in (a.seeker_id, j.employer_id) and coalesce(sp.is_sample, false))
               and not exists (select 1 from public.notifications x where x.user_id = a.seeker_id and x.kind = 'remind_attend' and x.ref = a.id)
    loop
      insert into public.notifications (user_id, kind, title, body, link, ref)
      values (r.seeker_id, 'remind_attend', 'Bấm "Tôi vẫn đến" nhé', left('Việc "' || r.title || '" hôm nay — bấm xác nhận để quán yên tâm', 300), '/app/cham-cong', r.app);
      n := n + 1;
    end loop;
  end if;

  if hr >= 9 then -- the shop hears about someone who never confirmed
    for r in select a.id app, a.job_id, j.employer_id, j.title, wp.full_name who
             from public.applications a join public.jobs j on j.id = a.job_id join public.profiles wp on wp.id = a.seeker_id
             where a.status = 'accepted' and a.pay_status in ('none', 'held') and j.start_date = today and a.confirmed_at is null and a.checked_in_at is null
               and not exists (select 1 from public.profiles sp where sp.id in (a.seeker_id, j.employer_id) and coalesce(sp.is_sample, false))
               and not exists (select 1 from public.notifications x where x.user_id = j.employer_id and x.kind = 'unconfirmed' and x.ref = a.id)
    loop
      select count(*)::int into bk from public.applications where job_id = r.job_id and is_backup and status = 'pending';
      insert into public.notifications (user_id, kind, title, body, link, ref)
      values (r.employer_id, 'unconfirmed', r.who || ' chưa xác nhận sẽ đến',
              left('Việc "' || r.title || '" hôm nay.' || case when bk > 0 then ' Bạn có ' || bk || ' người dự bị — vào Ứng viên để nhận thay.' else ' Hãy nhắn hỏi hoặc chọn người khác.' end, 300),
              '/app/ung-vien', r.app);
      n := n + 1;
    end loop;
  end if;

  if hr between 7 and 21 then -- a post nobody has applied to after 12 hours
    for r in select j.id job, j.employer_id, j.title from public.jobs j
             where j.status = 'open' and j.end_date >= today and j.created_at < p_now - interval '12 hours'
               and not exists (select 1 from public.applications a where a.job_id = j.id)
               and not exists (select 1 from public.profiles sp where sp.id = j.employer_id and coalesce(sp.is_sample, false))
               and not exists (select 1 from public.notifications x where x.user_id = j.employer_id and x.kind = 'nudge_empty' and x.ref = j.id)
    loop
      insert into public.notifications (user_id, kind, title, body, link, ref)
      values (r.employer_id, 'nudge_empty', 'Tin chưa có ai ứng tuyển', left('"' || r.title || '" — thử tăng lương hoặc đổi giờ ca, rồi đăng lại', 300), '/app/viec-cua-toi', r.job);
      n := n + 1;
    end loop;

    -- an application the shop has not answered for 24 hours: the worker is pointed to other jobs
    for r in select a.id app, a.seeker_id, j.title from public.applications a join public.jobs j on j.id = a.job_id
             where a.status = 'pending' and a.created_at < p_now - interval '24 hours' and a.created_at > p_now - interval '10 days'
               and not exists (select 1 from public.profiles sp where sp.id in (a.seeker_id, j.employer_id) and coalesce(sp.is_sample, false))
               and not exists (select 1 from public.notifications x where x.user_id = a.seeker_id and x.kind = 'pending_old' and x.ref = a.id)
    loop
      insert into public.notifications (user_id, kind, title, body, link, ref)
      values (r.seeker_id, 'pending_old', 'Quán chưa trả lời', left('Đơn "' || r.title || '" đã hơn 24 giờ. Xem thêm việc khác gần bạn để chắc chắn có ca.', 300), '/app', r.app);
      n := n + 1;
    end loop;
  end if;

  -- a post whose last day has passed stops being offered
  update public.jobs set status = 'closed' where status = 'open' and end_date < today;
  return n;
end $$;
revoke all on function private.send_commit_alerts(timestamptz) from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if not exists (select 1 from cron.job where jobname = 'vtv-commit-alerts') then
      perform cron.schedule('vtv-commit-alerts', '15 * * * *', 'select private.send_commit_alerts()');
    end if;
  end if;
end $$;

revoke all on function public.my_apply_lock(), public.confirm_attendance(uuid), public.set_backup(uuid, boolean), public.cancel_hire(uuid), public.report_unpaid(uuid) from public, anon;
grant execute on function public.my_apply_lock(), public.confirm_attendance(uuid), public.set_backup(uuid, boolean), public.cancel_hire(uuid), public.report_unpaid(uuid) to authenticated;
revoke all on function public.trust_signals(uuid[]) from public;
grant execute on function public.trust_signals(uuid[]) to anon, authenticated;
