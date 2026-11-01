-- Hiring tools.
--   · job guide: what to do / bring, kept apart from the public post and shown only to the shop and to accepted workers
--     (sent to the worker as a notification the moment they are accepted)
--   · shift agreement: pay, day and job are shown to both sides, each taps "confirm" (agree_shift)
--   · referral codes: each user has one; a new account (made in the last 7 days) can use one code; both sides get their open posts
--     pushed to the top of the list for 7 days (jobs.boosted_until, cleared by an hourly job once it ends)

alter table public.applications
  add column if not exists agreed_seeker_at timestamptz,
  add column if not exists agreed_employer_at timestamptz;
alter table public.jobs add column if not exists boosted_until timestamptz;

-- ── job guide ──────────────────────────────────────────────────────────────────────────────────
create table if not exists public.job_guides (
  job_id uuid primary key references public.jobs (id) on delete cascade,
  body text not null default '' check (char_length(body) <= 600),
  updated_at timestamptz not null default now()
);
alter table public.job_guides enable row level security;
revoke all on public.job_guides from anon, authenticated;

create or replace function public.set_job_guide(p_job uuid, p_body text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.jobs where id = p_job and employer_id = auth.uid()) then raise exception 'FORBIDDEN'; end if;
  insert into public.job_guides (job_id, body) values (p_job, left(btrim(coalesce(p_body, '')), 600))
    on conflict (job_id) do update set body = excluded.body, updated_at = now();
end $$;

-- the shop, and a worker who was accepted for this post
create or replace function public.job_guide(p_job uuid) returns text
language sql stable security definer set search_path = public as $$
  select nullif(g.body, '') from public.job_guides g
  where g.job_id = p_job and (
    exists (select 1 from public.jobs j where j.id = p_job and j.employer_id = auth.uid())
    or exists (select 1 from public.applications a where a.job_id = p_job and a.seeker_id = auth.uid() and a.status = 'accepted'))
$$;

create or replace function private.applications_guide() returns trigger
language plpgsql security definer set search_path = public as $$
declare g text; t text;
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    select nullif(body, '') into g from public.job_guides where job_id = new.job_id;
    if g is not null then
      select title into t from public.jobs where id = new.job_id;
      perform private.notify(new.seeker_id, 'job_guide', 'Hướng dẫn công việc', left('"' || coalesce(t, '') || '": ' || g, 300), '/app/cham-cong');
    end if;
  end if;
  return new;
end $$;
revoke all on function private.applications_guide() from public, anon, authenticated;
create or replace trigger applications_guide after update of status on public.applications
  for each row execute function private.applications_guide();

-- ── shift agreement ────────────────────────────────────────────────────────────────────────────
create or replace function public.agree_shift(p_application uuid) returns void
language plpgsql security definer set search_path = public as $$
declare a public.applications; j public.jobs; mine_seeker boolean; who text; other uuid;
begin
  select * into a from public.applications where id = p_application for update;
  if a.id is null then raise exception 'NOT_FOUND'; end if;
  select * into j from public.jobs where id = a.job_id;
  if auth.uid() is null or auth.uid() not in (a.seeker_id, j.employer_id) then raise exception 'FORBIDDEN'; end if;
  if a.status <> 'accepted' then raise exception 'NOT_ACCEPTED'; end if;
  if a.pay_status not in ('none', 'held') then raise exception 'ALREADY_SETTLED'; end if;
  mine_seeker := auth.uid() = a.seeker_id;
  if (mine_seeker and a.agreed_seeker_at is not null) or (not mine_seeker and a.agreed_employer_at is not null) then return; end if;
  if mine_seeker then update public.applications set agreed_seeker_at = now() where id = a.id; else update public.applications set agreed_employer_at = now() where id = a.id; end if;
  other := case when mine_seeker then j.employer_id else a.seeker_id end;
  select coalesce(business_name, full_name) into who from public.profiles where id = auth.uid();
  perform private.notify(other, 'agreed', coalesce(who, 'Đối tác') || ' xác nhận thỏa thuận ca', '"' || j.title || '" — vào xem và xác nhận nếu bạn đồng ý', case when mine_seeker then '/app/ca-lam' else '/app/cham-cong' end);
end $$;

-- ── referral codes ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.referral_codes (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  code text not null unique
);
create table if not exists public.referrals (
  referred_id uuid primary key references public.profiles (id) on delete cascade,
  referrer_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.boosts (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  until timestamptz not null
);
alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;
alter table public.boosts enable row level security;
revoke all on public.referral_codes, public.referrals, public.boosts from anon, authenticated;

create or replace function public.my_referral() returns table (code text, n int)
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); c text; tries int := 0;
begin
  if uid is null then raise exception 'FORBIDDEN'; end if;
  select r.code into c from public.referral_codes r where r.user_id = uid;
  while c is null and tries < 20 loop
    tries := tries + 1;
    c := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    begin
      insert into public.referral_codes (user_id, code) values (uid, c);
    exception when unique_violation then
      c := null;
      select r.code into c from public.referral_codes r where r.user_id = uid; -- another call made it meanwhile
    end;
  end loop;
  return query select c, (select count(*)::int from public.referrals f where f.referrer_id = uid);
end $$;

create or replace function private.give_boost(uid uuid, days int) returns void
language plpgsql security definer set search_path = public as $$
declare u timestamptz;
begin
  insert into public.boosts (user_id, until) values (uid, now() + make_interval(days => days))
    on conflict (user_id) do update set until = greatest(public.boosts.until, now()) + make_interval(days => days)
    returning until into u;
  update public.jobs set boosted_until = u where employer_id = uid and status = 'open';
end $$;
revoke all on function private.give_boost(uuid, int) from public, anon, authenticated;

create or replace function public.redeem_referral(p_code text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); ref uuid; made timestamptz;
begin
  if uid is null then raise exception 'FORBIDDEN'; end if;
  select r.user_id into ref from public.referral_codes r where r.code = upper(btrim(coalesce(p_code, '')));
  if ref is null then raise exception 'BAD_CODE'; end if;
  if ref = uid then raise exception 'OWN_CODE'; end if;
  if exists (select 1 from public.referrals where referred_id = uid) then raise exception 'ALREADY_REFERRED'; end if;
  select created_at into made from public.profiles where id = uid;
  if made is null or made < now() - interval '7 days' then raise exception 'TOO_LATE'; end if;
  insert into public.referrals (referred_id, referrer_id) values (uid, ref);
  perform private.give_boost(ref, 7);
  perform private.give_boost(uid, 7);
  perform private.notify(ref, 'referral', 'Bạn bè dùng mã của bạn', 'Tin của bạn được đẩy lên đầu trong 7 ngày. Cảm ơn bạn đã giới thiệu!', '/app/tai-khoan');
end $$;

-- a post made while the shop has a boost starts boosted
create or replace function private.jobs_boost() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  select until into new.boosted_until from public.boosts where user_id = new.employer_id and until > now();
  return new;
end $$;
revoke all on function private.jobs_boost() from public, anon, authenticated;
create or replace trigger jobs_boost before insert on public.jobs
  for each row execute function private.jobs_boost();

create or replace function private.expire_boosts() returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update public.jobs set boosted_until = null where boosted_until is not null and boosted_until < now();
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function private.expire_boosts() from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if not exists (select 1 from cron.job where jobname = 'vtv-expire-boosts') then
      perform cron.schedule('vtv-expire-boosts', '25 * * * *', 'select private.expire_boosts()');
    end if;
  end if;
end $$;

revoke all on function public.set_job_guide(uuid, text), public.job_guide(uuid), public.agree_shift(uuid), public.my_referral(), public.redeem_referral(text) from public, anon;
grant execute on function public.set_job_guide(uuid, text), public.job_guide(uuid), public.agree_shift(uuid), public.my_referral(), public.redeem_referral(text) to authenticated;
