-- Collaboration, part 1: in-app notifications, real attendance (arrived / finished) and the worker's "I got the cash".
-- Notifications are written by a trigger on applications and read through three functions only (no direct table access).

alter table public.applications
  add column if not exists checked_in_at timestamptz,
  add column if not exists checkin_distance_m integer,
  add column if not exists checked_out_at timestamptz,
  add column if not exists cash_received_at timestamptz;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  title text not null check (char_length(title) <= 120),
  body text check (char_length(body) <= 300),
  link text check (link is null or link ~ '^/app'),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated; -- only through the functions below

create or replace function private.notify(p_user uuid, p_kind text, p_title text, p_body text, p_link text) returns void
language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, kind, title, body, link) values (p_user, p_kind, left(p_title, 120), left(p_body, 300), p_link);
$$;
revoke all on function private.notify(uuid, text, text, text, text) from public, anon, authenticated;

-- Who needs to know what: the shop hears about new applicants, arrivals and cash received; the worker hears about
-- the decision, the confirmed shift, a no-show report and the shop recording the cash payment.
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
    elsif new.status = 'rejected' then
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

create or replace trigger applications_notify after insert or update on public.applications
  for each row execute function private.applications_notify();

create or replace function public.my_notifications(p_limit int default 30) returns setof public.notifications
language sql stable security definer set search_path = public as $$
  select * from public.notifications where user_id = auth.uid()
  order by created_at desc limit least(greatest(coalesce(p_limit, 30), 1), 100)
$$;
create or replace function public.unread_notifications() returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.notifications where user_id = auth.uid() and read_at is null
$$;
create or replace function public.mark_notifications_read(p_ids uuid[] default null) returns void
language sql security definer set search_path = public as $$
  update public.notifications set read_at = now()
  where user_id = auth.uid() and read_at is null and (p_ids is null or id = any(p_ids))
$$;

-- "I'm here": only the accepted worker, on a day of the job, once per day. Distance to the shop is recorded when the
-- phone could tell where it is (informational: the shop still confirms the shift itself).
create or replace function public.check_in(p_application uuid, p_lat double precision default null, p_lng double precision default null)
returns public.applications
language plpgsql security definer set search_path = public as $$
declare a public.applications; j public.jobs; d int;
  today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
begin
  select * into a from public.applications where id = p_application for update;
  if a.id is null or a.seeker_id <> auth.uid() then raise exception 'FORBIDDEN'; end if;
  if a.status <> 'accepted' then raise exception 'NOT_ACCEPTED'; end if;
  if a.pay_status not in ('none', 'held') then raise exception 'ALREADY_SETTLED'; end if;
  select * into j from public.jobs where id = a.job_id;
  if today < j.start_date then raise exception 'TOO_EARLY'; end if;
  if today > j.end_date then raise exception 'JOB_ENDED'; end if;
  if a.checked_in_at is not null and (a.checked_in_at at time zone 'Asia/Ho_Chi_Minh')::date = today then raise exception 'ALREADY_CHECKED_IN'; end if;
  if (p_lat is null) <> (p_lng is null) or p_lat not between -90 and 90 or p_lng not between -180 and 180 then raise exception 'BAD_LOCATION'; end if;
  if p_lat is not null and j.lat is not null and j.lng is not null then
    d := round(2 * 6371000 * asin(sqrt(power(sin(radians(j.lat - p_lat) / 2), 2)
        + cos(radians(p_lat)) * cos(radians(j.lat)) * power(sin(radians(j.lng - p_lng) / 2), 2))))::int;
  end if;
  update public.applications set checked_in_at = now(), checkin_distance_m = d, checked_out_at = null
    where id = a.id returning * into a;
  return a;
end $$;

create or replace function public.check_out(p_application uuid) returns public.applications
language plpgsql security definer set search_path = public as $$
declare a public.applications;
  today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
begin
  select * into a from public.applications where id = p_application for update;
  if a.id is null or a.seeker_id <> auth.uid() then raise exception 'FORBIDDEN'; end if;
  if a.status <> 'accepted' then raise exception 'NOT_ACCEPTED'; end if;
  if a.checked_in_at is null or (a.checked_in_at at time zone 'Asia/Ho_Chi_Minh')::date <> today then raise exception 'NOT_CHECKED_IN'; end if;
  if a.checked_out_at is not null and a.checked_out_at >= a.checked_in_at then raise exception 'ALREADY_CHECKED_OUT'; end if;
  update public.applications set checked_out_at = now() where id = a.id returning * into a;
  return a;
end $$;

-- The worker says "yes, I got the cash" (free mode only: nothing went through the app). Safe to press twice.
create or replace function public.ack_cash_received(p_application uuid) returns public.applications
language plpgsql security definer set search_path = public as $$
declare a public.applications;
begin
  select * into a from public.applications where id = p_application for update;
  if a.id is null or a.seeker_id <> auth.uid() then raise exception 'FORBIDDEN'; end if;
  if a.status <> 'accepted' or a.pay_status <> 'released' then raise exception 'NOT_COMPLETED'; end if;
  if coalesce(a.funding_mode, 'off') <> 'off' then raise exception 'NOT_CASH'; end if;
  update public.applications set cash_received_at = coalesce(cash_received_at, now()) where id = a.id returning * into a;
  return a;
end $$;

revoke all on function public.my_notifications(int), public.unread_notifications(), public.mark_notifications_read(uuid[]),
  public.check_in(uuid, double precision, double precision), public.check_out(uuid), public.ack_cash_received(uuid) from public, anon;
grant execute on function public.my_notifications(int), public.unread_notifications(), public.mark_notifications_read(uuid[]),
  public.check_in(uuid, double precision, double precision), public.check_out(uuid), public.ack_cash_received(uuid) to authenticated;
