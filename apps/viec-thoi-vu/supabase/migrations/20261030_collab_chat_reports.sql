-- Collaboration, part 2: chat between a shop and an accepted worker, reports about a person, account-deletion requests,
-- and inviting a worker who already did a shift back to a new job. Every table is closed (RLS on, no direct access):
-- the app only goes through the functions below, which check who is asking.

alter table public.notifications add column if not exists ref uuid; -- what a notification is about (used to fold chat messages into one)

-- ── chat: only the two people of an ACCEPTED application can read and write ───────────────────────────────────────
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists messages_app_idx on public.messages (application_id, created_at);
alter table public.messages enable row level security;
revoke all on public.messages from anon, authenticated;

-- the other person of an accepted application, or null when uid is not one of the two
create or replace function private.chat_party(p_application uuid, uid uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select case when a.seeker_id = uid then j.employer_id when j.employer_id = uid then a.seeker_id end
  from public.applications a join public.jobs j on j.id = a.job_id
  where a.id = p_application and a.status = 'accepted'
$$;
revoke all on function private.chat_party(uuid, uuid) from public, anon, authenticated;

create or replace function public.app_messages(p_application uuid)
returns table (id uuid, sender_id uuid, body text, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if private.chat_party(p_application, auth.uid()) is null then raise exception 'FORBIDDEN'; end if;
  return query select m.id, m.sender_id, m.body, m.created_at from public.messages m
    where m.application_id = p_application order by m.created_at desc limit 200;
end $$;

create or replace function public.send_message(p_application uuid, p_body text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); other uuid := private.chat_party(p_application, auth.uid()); b text := btrim(coalesce(p_body, ''));
  j public.jobs; me_name text; to_seeker boolean;
begin
  if other is null then raise exception 'FORBIDDEN'; end if;
  if char_length(b) not between 1 and 1000 then raise exception 'BAD_MESSAGE'; end if;
  if (select count(*) from public.messages where sender_id = uid and application_id = p_application and created_at > now() - interval '1 hour') >= 30 then
    raise exception 'TOO_MANY';
  end if;
  insert into public.messages (application_id, sender_id, body) values (p_application, uid, b);
  select j2.* into j from public.jobs j2 join public.applications a on a.job_id = j2.id where a.id = p_application;
  to_seeker := (other <> j.employer_id);
  select case when uid = j.employer_id then coalesce(business_name, full_name) else full_name end into me_name from public.profiles where id = uid;
  -- one unread "message" notification per conversation (more messages do not pile up)
  if not exists (select 1 from public.notifications where user_id = other and kind = 'message' and ref = p_application and read_at is null) then
    insert into public.notifications (user_id, kind, title, body, link, ref)
    values (other, 'message', left(coalesce(me_name, 'Ai đó') || ' nhắn tin cho bạn', 120), left(b, 120), case when to_seeker then '/app/cham-cong' else '/app/ca-lam' end, p_application);
  end if;
end $$;

-- ── reports about a person (admin reads them) ─────────────────────────────────────────────────────────────────────
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_id uuid not null references public.profiles (id) on delete cascade,
  job_id uuid references public.jobs (id) on delete set null,
  reason text not null check (reason in ('scam', 'fee', 'no_show', 'harassment', 'fake_info', 'other')),
  detail text check (char_length(detail) <= 500),
  status text not null default 'open' check (status in ('open', 'resolved')),
  note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles (id) on delete set null
);
create index if not exists reports_status_idx on public.reports (status, created_at desc);
alter table public.reports enable row level security;
revoke all on public.reports from anon, authenticated;

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
end $$;

create or replace function public.admin_reports()
returns table (id uuid, reporter_name text, target_id uuid, target_name text, reason text, detail text, job_title text, status text, note text, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not private.is_admin(auth.uid()) then raise exception 'FORBIDDEN'; end if;
  return query
    select r.id, coalesce(rp.business_name, rp.full_name), r.target_id, coalesce(tp.business_name, tp.full_name), r.reason, r.detail, j.title, r.status, r.note, r.created_at
    from public.reports r join public.profiles rp on rp.id = r.reporter_id join public.profiles tp on tp.id = r.target_id left join public.jobs j on j.id = r.job_id
    order by (r.status = 'open') desc, r.created_at desc limit 200;
end $$;

create or replace function public.resolve_report(p_id uuid, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not private.is_admin(auth.uid()) then raise exception 'FORBIDDEN'; end if;
  update public.reports set status = 'resolved', note = left(btrim(coalesce(p_note, '')), 300), resolved_at = now(), resolved_by = auth.uid() where id = p_id;
end $$;

-- ── asking to delete the account (the admin does it by hand within 7 days, as the privacy policy says) ───────────────
create table if not exists public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  reason text check (char_length(reason) <= 300),
  status text not null default 'open' check (status in ('open', 'done', 'cancelled')),
  requested_at timestamptz not null default now(),
  resolved_at timestamptz,
  note text
);
create unique index if not exists deletion_one_open on public.deletion_requests (user_id) where status = 'open';
alter table public.deletion_requests enable row level security;
revoke all on public.deletion_requests from anon, authenticated;

create or replace function public.request_account_deletion(p_reason text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'FORBIDDEN'; end if;
  insert into public.deletion_requests (user_id, reason) values (auth.uid(), left(btrim(coalesce(p_reason, '')), 300))
    on conflict (user_id) where status = 'open' do nothing;
end $$;

create or replace function public.my_deletion_request() returns table (status text, requested_at timestamptz)
language sql stable security definer set search_path = public as $$
  select d.status, d.requested_at from public.deletion_requests d where d.user_id = auth.uid() and d.status = 'open'
$$;

create or replace function public.cancel_account_deletion() returns void
language sql security definer set search_path = public as $$
  update public.deletion_requests set status = 'cancelled', resolved_at = now() where user_id = auth.uid() and status = 'open'
$$;

create or replace function public.admin_deletions()
returns table (id uuid, user_id uuid, name text, email text, reason text, status text, requested_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not private.is_admin(auth.uid()) then raise exception 'FORBIDDEN'; end if;
  return query
    select d.id, d.user_id, coalesce(p.business_name, p.full_name), u.email::text, d.reason, d.status, d.requested_at
    from public.deletion_requests d join public.profiles p on p.id = d.user_id left join auth.users u on u.id = d.user_id
    order by (d.status = 'open') desc, d.requested_at desc limit 200;
end $$;

create or replace function public.resolve_deletion(p_id uuid, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not private.is_admin(auth.uid()) then raise exception 'FORBIDDEN'; end if;
  update public.deletion_requests set status = 'done', note = left(btrim(coalesce(p_note, '')), 300), resolved_at = now() where id = p_id and status = 'open';
end $$;

-- ── "come work for me again": only workers who already did a shift for this shop ─────────────────────────────────────
create table if not exists public.job_invites (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.profiles (id) on delete cascade,
  worker_id uuid not null references public.profiles (id) on delete cascade,
  job_id uuid not null references public.jobs (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (job_id, worker_id)
);
alter table public.job_invites enable row level security;
revoke all on public.job_invites from anon, authenticated;

create or replace function public.invite_worker(p_job uuid, p_worker uuid) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); j public.jobs; biz text; n int;
begin
  select * into j from public.jobs where id = p_job;
  if j.id is null or j.employer_id <> uid then raise exception 'FORBIDDEN'; end if;
  if j.status <> 'open' then raise exception 'JOB_NOT_OPEN'; end if;
  if not exists (select 1 from public.applications a join public.jobs jj on jj.id = a.job_id
                 where jj.employer_id = uid and a.seeker_id = p_worker and a.pay_status = 'released' and coalesce(a.attendance, 'ok') <> 'noshow') then
    raise exception 'NOT_A_REGULAR';
  end if;
  if exists (select 1 from public.applications where job_id = p_job and seeker_id = p_worker) then raise exception 'ALREADY_APPLIED'; end if;
  if (select count(*) from public.job_invites where employer_id = uid and created_at > now() - interval '1 day') >= 20 then raise exception 'TOO_MANY'; end if;
  insert into public.job_invites (employer_id, worker_id, job_id) values (uid, p_worker, p_job) on conflict (job_id, worker_id) do nothing;
  get diagnostics n = row_count;
  if n > 0 then
    select coalesce(business_name, full_name) into biz from public.profiles where id = uid;
    insert into public.notifications (user_id, kind, title, body, link, ref)
    values (p_worker, 'invite', left(coalesce(biz, 'Một quán') || ' mời bạn làm lại', 120), 'Việc "' || j.title || '" — xem và ứng tuyển', '/app/viec/' || p_job, p_job);
  end if;
end $$;

create or replace function public.my_sent_invites() returns table (job_id uuid, worker_id uuid)
language sql stable security definer set search_path = public as $$
  select i.job_id, i.worker_id from public.job_invites i where i.employer_id = auth.uid() and i.created_at > now() - interval '30 days'
$$;

revoke all on function public.app_messages(uuid), public.send_message(uuid, text), public.report_user(uuid, text, text, uuid),
  public.admin_reports(), public.resolve_report(uuid, text), public.request_account_deletion(text), public.my_deletion_request(),
  public.cancel_account_deletion(), public.admin_deletions(), public.resolve_deletion(uuid, text), public.invite_worker(uuid, uuid),
  public.my_sent_invites() from public, anon;
grant execute on function public.app_messages(uuid), public.send_message(uuid, text), public.report_user(uuid, text, text, uuid),
  public.admin_reports(), public.resolve_report(uuid, text), public.request_account_deletion(text), public.my_deletion_request(),
  public.cancel_account_deletion(), public.admin_deletions(), public.resolve_deletion(uuid, text), public.invite_worker(uuid, uuid),
  public.my_sent_invites() to authenticated;
