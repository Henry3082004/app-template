-- Escrow (TEST MODE ONLY — no real money moves) + two-way reputation.
-- All state changes go through SECURITY DEFINER functions; clients cannot write these columns/tables directly.

-- ── settings (not readable by clients; exposed only through public.payment_mode()) ──────────────
create table if not exists public.app_settings (key text primary key, value text not null);
alter table public.app_settings enable row level security;
revoke all on public.app_settings from anon, authenticated;
insert into public.app_settings (key, value) values ('payment_mode', 'test'), ('fee_percent', '8')
  on conflict (key) do nothing;

-- ── shift / escrow state on applications ────────────────────────────────────────────────────────
-- pay_status: none (accepted, not funded) → held → released (paid to worker)
--                                         held → noshow_reported → refunded | disputed
--                                         held → disputed
alter table public.applications
  add column if not exists pay_status text not null default 'none'
    check (pay_status in ('none', 'held', 'released', 'refunded', 'noshow_reported', 'disputed')),
  add column if not exists escrow_amount numeric(12, 0),
  add column if not exists platform_fee numeric(12, 0),
  add column if not exists funding_mode text,
  add column if not exists attendance text check (attendance in ('ok', 'late', 'noshow')),
  add column if not exists dispute_reason text check (char_length(dispute_reason) <= 300),
  add column if not exists funded_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists released_at timestamptz;

-- ── reviews ─────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  reviewee_id uuid not null references public.profiles (id) on delete cascade,
  reviewer_role public.user_role not null,
  stars smallint not null check (stars between 1 and 5),
  tags text[] not null default '{}',
  comment text check (char_length(comment) <= 300),
  created_at timestamptz not null default now(),
  unique (application_id, reviewer_id)
);
create index if not exists reviews_reviewee_idx on public.reviews (reviewee_id);
alter table public.reviews enable row level security;
revoke all on public.reviews from anon, authenticated;
grant select on public.reviews to authenticated;

-- A review is revealed when both sides reviewed, or 7 days after payout (so nobody can retaliate).
create or replace function private.review_revealed(p_app uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.applications a
    where a.id = p_app
      and (a.released_at < now() - interval '7 days'
           or (select count(*) from public.reviews r where r.application_id = a.id) >= 2))
$$;

drop policy if exists reviews_read on public.reviews;
create policy reviews_read on public.reviews for select to authenticated
  using (reviewer_id = auth.uid() or (reviewee_id = auth.uid() and private.review_revealed(application_id)));

-- ── contact privacy: the worker sees the employer's phone only once the money is held ──────────
create or replace function private.is_funded_pair(employer uuid, seeker uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.applications a join public.jobs j on j.id = a.job_id
    where a.status = 'accepted' and a.pay_status in ('held', 'released', 'noshow_reported', 'disputed')
      and j.employer_id = employer and a.seeker_id = seeker)
$$;

drop policy if exists contacts_read on public.contacts;
create policy contacts_read on public.contacts for select
  using (user_id = auth.uid()
         or private.is_accepted_pair(auth.uid(), user_id)      -- employer sees accepted worker
         or private.is_funded_pair(user_id, auth.uid()));      -- worker sees employer after funding

-- ── helpers ─────────────────────────────────────────────────────────────────────────────────────
create or replace function private.free_slots(p_job uuid, p_n int) returns void
language sql security definer set search_path = public as $$
  update public.jobs set filled = greatest(filled - p_n, 0),
    status = case when status = 'closed' and end_date >= current_date then 'open'::public.job_status else status end
  where id = p_job
$$;

create or replace function private.sweep(p_user uuid default null) returns void
language plpgsql security definer set search_path = public as $$
declare rec record;
begin
  -- no-show report nobody answered for 48h → refund the employer and reopen the slot
  for rec in
    with r as (
      update public.applications a set pay_status = 'refunded'
      from public.jobs j
      where j.id = a.job_id and a.pay_status = 'noshow_reported'
        and a.completed_at < now() - interval '48 hours'
        and (p_user is null or a.seeker_id = p_user or j.employer_id = p_user)
      returning a.job_id)
    select job_id, count(*)::int n from r group by job_id
  loop
    perform private.free_slots(rec.job_id, rec.n);
  end loop;

  -- employer never confirmed 2 days after the job ended → pay the worker
  update public.applications a set pay_status = 'released', released_at = now(), completed_at = coalesce(a.completed_at, now())
  from public.jobs j
  where j.id = a.job_id and a.pay_status = 'held' and j.end_date + 2 < current_date
    and (p_user is null or a.seeker_id = p_user or j.employer_id = p_user);
end $$;

-- ── public API (RPC) ────────────────────────────────────────────────────────────────────────────
create or replace function public.payment_mode() returns text
language sql stable security definer set search_path = public as $$
  select value from public.app_settings where key = 'payment_mode' $$;

create or replace function public.quote_application(p_application uuid, p_hours int default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare a public.applications; j public.jobs; days int; amt numeric; rate numeric;
begin
  select * into a from public.applications where id = p_application;
  if a.id is null then raise exception 'NOT_FOUND'; end if;
  select * into j from public.jobs where id = a.job_id;
  if auth.uid() is null or auth.uid() not in (a.seeker_id, j.employer_id) then raise exception 'FORBIDDEN'; end if;
  days := greatest((j.end_date - j.start_date) + 1, 1);
  if j.pay_unit = 'hour' and p_hours is not null and (p_hours < 1 or p_hours > 16 * days) then raise exception 'BAD_HOURS'; end if;
  amt := case j.pay_unit
    when 'hour' then j.pay_amount * coalesce(p_hours, 8 * days)
    when 'day' then j.pay_amount * days
    else j.pay_amount end;
  select value::numeric into rate from public.app_settings where key = 'fee_percent';
  return jsonb_build_object('amount', round(amt), 'fee', round(amt * rate / 100), 'net', round(amt) - round(amt * rate / 100));
end $$;

-- TEST MODE: marks the money as held without charging anything. In live mode the gateway webhook does this.
create or replace function public.fund_application(p_application uuid, p_hours int default null) returns public.applications
language plpgsql security definer set search_path = public as $$
declare a public.applications; j public.jobs; q jsonb;
begin
  if public.payment_mode() <> 'test' then raise exception 'PAYMENT_NOT_AVAILABLE'; end if;
  select * into a from public.applications where id = p_application for update;
  if a.id is null then raise exception 'NOT_FOUND'; end if;
  select * into j from public.jobs where id = a.job_id;
  if j.employer_id <> auth.uid() then raise exception 'FORBIDDEN'; end if;
  if a.status <> 'accepted' then raise exception 'NOT_ACCEPTED'; end if;
  if a.pay_status <> 'none' then raise exception 'ALREADY_FUNDED'; end if;
  if j.end_date < current_date then raise exception 'JOB_ENDED'; end if;
  q := public.quote_application(p_application, p_hours);
  update public.applications
    set pay_status = 'held', escrow_amount = (q->>'amount')::numeric, platform_fee = (q->>'fee')::numeric,
        funding_mode = 'test', funded_at = now()
    where id = a.id returning * into a;
  return a;
end $$;

-- Employer confirms the shift. ok/late → pay the worker. noshow → report (worker can confirm or contest).
create or replace function public.complete_shift(p_application uuid, p_attendance text) returns public.applications
language plpgsql security definer set search_path = public as $$
declare a public.applications; j public.jobs;
begin
  if p_attendance not in ('ok', 'late', 'noshow') then raise exception 'BAD_ATTENDANCE'; end if;
  select * into a from public.applications where id = p_application for update;
  if a.id is null then raise exception 'NOT_FOUND'; end if;
  select * into j from public.jobs where id = a.job_id;
  if j.employer_id <> auth.uid() then raise exception 'FORBIDDEN'; end if;
  if a.pay_status = 'none' then raise exception 'NOT_FUNDED'; end if;
  if a.pay_status <> 'held' then raise exception 'ALREADY_SETTLED'; end if;
  if current_date < j.start_date then raise exception 'TOO_EARLY'; end if;
  if p_attendance = 'noshow' then
    update public.applications set pay_status = 'noshow_reported', attendance = 'noshow', completed_at = now()
      where id = a.id returning * into a;
  else
    update public.applications set pay_status = 'released', attendance = p_attendance, completed_at = now(), released_at = now()
      where id = a.id returning * into a;
  end if;
  return a;
end $$;

-- Worker answers a no-show report: accept → refund employer; contest → frozen for manual review.
create or replace function public.respond_noshow(p_application uuid, p_accept boolean) returns public.applications
language plpgsql security definer set search_path = public as $$
declare a public.applications;
begin
  select * into a from public.applications where id = p_application for update;
  if a.id is null then raise exception 'NOT_FOUND'; end if;
  if a.seeker_id <> auth.uid() then raise exception 'FORBIDDEN'; end if;
  if a.pay_status <> 'noshow_reported' then raise exception 'ALREADY_SETTLED'; end if;
  if p_accept then
    update public.applications set pay_status = 'refunded' where id = a.id returning * into a;
    perform private.free_slots(a.job_id, 1);
  else
    update public.applications set pay_status = 'disputed', dispute_reason = 'worker_contests_noshow' where id = a.id returning * into a;
  end if;
  return a;
end $$;

create or replace function public.open_dispute(p_application uuid, p_reason text) returns public.applications
language plpgsql security definer set search_path = public as $$
declare a public.applications; j public.jobs;
begin
  select * into a from public.applications where id = p_application for update;
  if a.id is null then raise exception 'NOT_FOUND'; end if;
  select * into j from public.jobs where id = a.job_id;
  if auth.uid() not in (a.seeker_id, j.employer_id) then raise exception 'FORBIDDEN'; end if;
  if a.pay_status <> 'held' then raise exception 'CANNOT_DISPUTE'; end if;
  update public.applications set pay_status = 'disputed', dispute_reason = left(coalesce(nullif(trim(p_reason), ''), 'unspecified'), 300)
    where id = a.id returning * into a;
  return a;
end $$;

create or replace function public.sweep_overdue() returns void
language sql security definer set search_path = public as $$ select private.sweep(auth.uid()) $$;

create or replace function public.submit_review(p_application uuid, p_stars int, p_tags text[], p_comment text) returns public.reviews
language plpgsql security definer set search_path = public as $$
declare a public.applications; j public.jobs; me public.profiles; r public.reviews; allowed text[]; reviewee uuid;
begin
  select * into a from public.applications where id = p_application;
  if a.id is null then raise exception 'NOT_FOUND'; end if;
  select * into j from public.jobs where id = a.job_id;
  if auth.uid() is null or auth.uid() not in (a.seeker_id, j.employer_id) then raise exception 'FORBIDDEN'; end if;
  if a.pay_status <> 'released' then raise exception 'NOT_COMPLETED'; end if;
  if a.released_at < now() - interval '30 days' then raise exception 'REVIEW_WINDOW_CLOSED'; end if;
  if p_stars is null or p_stars < 1 or p_stars > 5 then raise exception 'BAD_STARS'; end if;
  select * into me from public.profiles where id = auth.uid();
  if me.role = 'employer' then
    allowed := array['hardworking', 'punctual', 'polite', 'fast_learner']; reviewee := a.seeker_id;
  else
    allowed := array['accurate_description', 'friendly', 'clean_safe', 'clear_instructions']; reviewee := j.employer_id;
  end if;
  if not (coalesce(p_tags, '{}') <@ allowed) then raise exception 'BAD_TAGS'; end if;
  begin
    insert into public.reviews (application_id, reviewer_id, reviewee_id, reviewer_role, stars, tags, comment)
    values (a.id, auth.uid(), reviewee, me.role, p_stars, coalesce(p_tags, '{}'), nullif(left(trim(coalesce(p_comment, '')), 300), ''))
    returning * into r;
  exception when unique_violation then raise exception 'ALREADY_REVIEWED';
  end;
  return r;
end $$;

-- Public, aggregate-only reputation (no individual comments). Only counts revealed reviews.
create or replace function public.reputations(p_users uuid[])
returns table (user_id uuid, shifts_done int, noshow int, late int, ratings int, avg_stars numeric, top_tags text[])
language sql stable security definer set search_path = public as $$
  select u.id,
    (select count(*)::int from public.applications a join public.jobs j on j.id = a.job_id
       where a.pay_status = 'released' and (a.seeker_id = u.id or j.employer_id = u.id)),
    (select count(*)::int from public.applications a where a.seeker_id = u.id and a.pay_status = 'refunded' and a.attendance = 'noshow'),
    (select count(*)::int from public.applications a where a.seeker_id = u.id and a.pay_status = 'released' and a.attendance = 'late'),
    (select count(*)::int from public.reviews r where r.reviewee_id = u.id and private.review_revealed(r.application_id)),
    (select round(avg(r.stars), 1) from public.reviews r where r.reviewee_id = u.id and private.review_revealed(r.application_id)),
    coalesce((select array_agg(t.tag order by t.n desc) from (
       select tag, count(*) n from public.reviews r, unnest(r.tags) tag
       where r.reviewee_id = u.id and private.review_revealed(r.application_id) group by tag order by count(*) desc limit 3) t), '{}')
  from unnest(p_users) as u(id)
$$;

revoke all on function public.quote_application(uuid, int), public.fund_application(uuid, int), public.complete_shift(uuid, text),
  public.respond_noshow(uuid, boolean), public.open_dispute(uuid, text), public.sweep_overdue(),
  public.submit_review(uuid, int, text[], text) from public, anon;
grant execute on function public.quote_application(uuid, int), public.fund_application(uuid, int), public.complete_shift(uuid, text),
  public.respond_noshow(uuid, boolean), public.open_dispute(uuid, text), public.sweep_overdue(),
  public.submit_review(uuid, int, text[], text) to authenticated;
revoke all on function public.reputations(uuid[]), public.payment_mode() from public;
grant execute on function public.reputations(uuid[]), public.payment_mode() to anon, authenticated;
revoke all on function private.sweep(uuid), private.free_slots(uuid, int) from public, anon, authenticated;

-- Hourly safety net so unanswered reports / unconfirmed shifts settle even when nobody opens the app.
do $$ begin
  create extension if not exists pg_cron;
  perform cron.schedule('vtv-sweep', '*/30 * * * *', 'select private.sweep(null)');
exception when others then raise notice 'pg_cron not available (%): the app sweeps on load instead', sqlerrm;
end $$;
