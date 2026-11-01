-- Trust and safety.
--   · suspicious posts ("đặt cọc", "phí hồ sơ"…) are held for the admin instead of going public (jobs.held_reason / vetted;
--     the word list is the app_settings row suspicious_words, comma separated)
--   · a post that several workers called "not as posted" is held too (mark_as_posted)
--   · "lost property" report: the person reported is put on a 3-day hold (their open posts close, they cannot apply or post
--     until the admin resolves the report); the report reason is stored as 'other' with the prefix [lost_property]
--   · worker_notes(): the last comments shops wrote about a worker, for the shop's candidate cards

alter table public.jobs
  add column if not exists held_reason text,
  add column if not exists vetted boolean not null default true;

insert into public.app_settings (key, value) values
  ('suspicious_words', 'đặt cọc,dat coc,tiền cọc,tien coc,phí hồ sơ,phi ho so,phí giữ chỗ,phí đồng phục,nộp phí,đóng phí,dong phi,nạp tiền,chuyển khoản trước,chuyen khoan truoc,việc nhẹ lương cao,viec nhe luong cao,ứng tiền trước')
  on conflict (key) do nothing;

-- holds on accounts (closed to clients)
create table if not exists public.account_holds (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  until timestamptz not null,
  reason text,
  created_at timestamptz not null default now()
);
alter table public.account_holds enable row level security;
revoke all on public.account_holds from anon, authenticated;

create or replace function private.hold_until(uid uuid) returns timestamptz
language sql stable security definer set search_path = public as $$
  select until from public.account_holds where user_id = uid and until > now()
$$;
revoke all on function private.hold_until(uuid) from public, anon, authenticated;

-- a worker cannot apply while on a no-show lock OR a hold (the later of the two)
create or replace function private.apply_lock_until(uid uuid) returns timestamptz
language sql stable security definer set search_path = public as $$
  select greatest(
    (select case when count(*) >= 2 then max(coalesce(completed_at, created_at)) + interval '7 days' end
       from public.applications
       where seeker_id = uid and attendance = 'noshow' and pay_status = 'refunded' and coalesce(completed_at, created_at) > now() - interval '30 days'),
    private.hold_until(uid))
$$;
revoke all on function private.apply_lock_until(uuid) from public, anon, authenticated;

-- ── held posts ────────────────────────────────────────────────────────────────────────────────
create or replace function private.jobs_screen() returns trigger
language plpgsql security definer set search_path = public as $$
declare hit text; txt text; changed boolean;
begin
  changed := tg_op = 'INSERT' or new.title is distinct from old.title or new.description is distinct from old.description or new.shift_note is distinct from old.shift_note;
  if changed then
    txt := lower(coalesce(new.title, '') || ' ' || coalesce(new.description, '') || ' ' || coalesce(new.shift_note, ''));
    select btrim(w) into hit from unnest(string_to_array(coalesce((select value from public.app_settings where key = 'suspicious_words'), ''), ',')) w
      where btrim(w) <> '' and position(lower(btrim(w)) in txt) > 0 limit 1;
    if hit is not null then
      new.held_reason := 'Chứa cụm "' || hit || '"'; new.vetted := false;
    elsif private.hold_until(new.employer_id) is not null then
      new.held_reason := 'Tài khoản đang chờ xác minh'; new.vetted := false;
    elsif new.held_reason is not null and new.held_reason not like 'REJECTED%' and new.held_reason like 'Chứa cụm%' then
      new.held_reason := null; new.vetted := true; -- the words were taken out
    end if;
  end if;
  if new.held_reason is not null and not new.vetted then new.status := 'closed'; end if;
  if new.held_reason is not null and not new.vetted and new.held_reason not like 'REJECTED%'
     and (tg_op = 'INSERT' or old.held_reason is distinct from new.held_reason) then
    perform private.notify(new.employer_id, 'job_held', 'Tin đang chờ duyệt', left('"' || new.title || '" — ' || new.held_reason || '. Quản trị sẽ xem trong 24 giờ.', 300), '/app/viec-cua-toi');
  end if;
  return new;
end $$;
revoke all on function private.jobs_screen() from public, anon, authenticated;
create or replace trigger jobs_screen before insert or update on public.jobs
  for each row execute function private.jobs_screen();

create or replace function public.admin_held_jobs()
returns table (id uuid, title text, business text, held_reason text, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not private.is_admin(auth.uid()) then raise exception 'FORBIDDEN'; end if;
  return query
    select j.id, j.title, coalesce(p.business_name, p.full_name), j.held_reason, j.created_at
    from public.jobs j join public.profiles p on p.id = j.employer_id
    where j.held_reason is not null and not j.vetted and j.held_reason not like 'REJECTED%'
    order by j.created_at desc limit 100;
end $$;

create or replace function public.admin_review_job(p_job uuid, p_ok boolean, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
declare j public.jobs;
begin
  if not private.is_admin(auth.uid()) then raise exception 'FORBIDDEN'; end if;
  select * into j from public.jobs where id = p_job for update;
  if j.id is null or j.held_reason is null then raise exception 'NOT_FOUND'; end if;
  if p_ok then
    update public.jobs set vetted = true, held_reason = null,
      status = case when filled < slots and end_date >= current_date then 'open'::public.job_status else 'closed'::public.job_status end where id = j.id;
    perform private.notify(j.employer_id, 'job_approved', 'Tin đã được duyệt', '"' || j.title || '" đã hiển thị cho người tìm việc', '/app/viec-cua-toi');
  else
    update public.jobs set vetted = false, held_reason = 'REJECTED' || coalesce(': ' || nullif(left(btrim(p_note), 200), ''), ''), status = 'closed' where id = j.id;
    perform private.notify(j.employer_id, 'job_rejected', 'Tin không được duyệt', left('"' || j.title || '"' || coalesce(' — ' || nullif(left(btrim(p_note), 200), ''), ''), 300), '/app/viec-cua-toi');
  end if;
end $$;

-- ── "was it as posted?" ──────────────────────────────────────────────────────────────────────────
-- Two workers saying no on the same post holds it for the admin.
create or replace function public.mark_as_posted(p_application uuid, p_ok boolean) returns void
language plpgsql security definer set search_path = public as $$
declare a public.applications; j public.jobs;
begin
  select * into a from public.applications where id = p_application for update;
  if a.id is null or a.seeker_id <> auth.uid() then raise exception 'FORBIDDEN'; end if;
  if a.pay_status <> 'released' then raise exception 'NOT_COMPLETED'; end if;
  if p_ok is null then raise exception 'BAD_REQUEST'; end if;
  update public.applications set as_posted = p_ok where id = a.id;
  if not p_ok and (select count(*) from public.applications where job_id = a.job_id and as_posted = false) >= 2 then
    select * into j from public.jobs where id = a.job_id for update;
    if j.vetted then
      update public.jobs set held_reason = 'Nhiều người báo không đúng như tin đăng', vetted = false, status = 'closed' where id = j.id;
    end if;
  end if;
end $$;

-- ── a shop reads what other shops wrote about a worker ─────────────────────────────────────────
create or replace function public.worker_notes(p_users uuid[])
returns table (user_id uuid, stars int, comment text, shop_name text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select n.user_id, n.stars, n.comment, n.shop_name, n.created_at
  from unnest(p_users) as u(id)
  cross join lateral (
    select r.reviewee_id as user_id, r.stars::int as stars, r.comment, coalesce(p.business_name, p.full_name) as shop_name, r.created_at
    from public.reviews r join public.profiles p on p.id = r.reviewer_id
    where r.reviewee_id = u.id and r.reviewer_role = 'employer' and btrim(coalesce(r.comment, '')) <> ''
      and private.review_revealed(r.application_id)
    order by r.created_at desc limit 2
  ) n
  where private.has_role(auth.uid(), 'employer'::public.user_role)
$$;

-- ── reports: "lost property" puts the person on hold ─────────────────────────────────────────────
create or replace function public.report_user(p_target uuid, p_reason text, p_detail text default null, p_job uuid default null) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null or p_target is null or p_target = uid then raise exception 'FORBIDDEN'; end if;
  if p_reason is null or p_reason not in ('scam', 'fee', 'no_show', 'harassment', 'fake_info', 'other') then raise exception 'BAD_REASON'; end if;
  if not exists (select 1 from public.profiles where id = p_target) then raise exception 'NOT_FOUND'; end if;
  -- you can only report someone you dealt with (shared application) or the shop behind a post you are looking at
  if not exists (select 1 from public.applications a join public.jobs j on j.id = a.job_id
                 where (a.seeker_id = uid and j.employer_id = p_target) or (a.seeker_id = p_target and j.employer_id = uid))
     and not (p_job is not null and exists (select 1 from public.jobs where id = p_job and employer_id = p_target)) then
    raise exception 'FORBIDDEN';
  end if;
  if (select count(*) from public.reports where reporter_id = uid and created_at > now() - interval '1 day') >= 5 then raise exception 'TOO_MANY'; end if;
  insert into public.reports (reporter_id, target_id, job_id, reason, detail) values (uid, p_target, p_job, p_reason, left(btrim(coalesce(p_detail, '')), 500));
  if p_reason = 'other' and left(coalesce(p_detail, ''), 15) = '[lost_property]' then
    insert into public.account_holds (user_id, until, reason) values (p_target, now() + interval '3 days', 'lost_property')
      on conflict (user_id) do update set until = greatest(public.account_holds.until, excluded.until), reason = excluded.reason;
    update public.jobs set status = 'closed' where employer_id = p_target and status = 'open';
    perform private.notify(p_target, 'account_hold', 'Tài khoản đang được xác minh', 'Có báo cáo cần kiểm tra. Quản trị sẽ liên hệ bạn trong 3 ngày.', '/app/tai-khoan');
  end if;
end $$;

create or replace function public.resolve_report(p_id uuid, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
declare tgt uuid;
begin
  if not private.is_admin(auth.uid()) then raise exception 'FORBIDDEN'; end if;
  update public.reports set status = 'resolved', note = left(btrim(coalesce(p_note, '')), 300), resolved_at = now(), resolved_by = auth.uid()
    where id = p_id returning target_id into tgt;
  update public.account_holds set until = now() where user_id = tgt and reason = 'lost_property';
end $$;

revoke all on function public.admin_held_jobs(), public.admin_review_job(uuid, boolean, text), public.mark_as_posted(uuid, boolean), public.worker_notes(uuid[]) from public, anon;
grant execute on function public.admin_held_jobs(), public.admin_review_job(uuid, boolean, text), public.mark_as_posted(uuid, boolean), public.worker_notes(uuid[]) to authenticated;
