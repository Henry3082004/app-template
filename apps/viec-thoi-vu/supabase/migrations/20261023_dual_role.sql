-- 20261023: one account, up to two roles. An account starts with one role and can add the other later
-- (Account → "also hire" / "also look for work"); `role` is the role in use, `roles` the ones it owns.
-- Worker details move to their own table so a business's public profile row never exposes them.

-- 1. roles ------------------------------------------------------------------------------------------
alter table public.profiles add column if not exists roles public.user_role[] not null default '{}';
update public.profiles set roles = array[role] where cardinality(roles) = 0;

create or replace function private.profiles_roles() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.roles is null or cardinality(new.roles) = 0 then new.roles := array[new.role]; end if;
  if not (new.role = any(new.roles)) then raise exception 'ROLE_NOT_OWNED'; end if;
  return new;
end $$;
create trigger profiles_roles before insert or update of role, roles on public.profiles
  for each row execute function private.profiles_roles();

create or replace function private.has_role(uid uuid, r public.user_role) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = uid and r = any(roles))
$$;

-- posting needs the business role, applying the worker role — and nobody applies to their own job
alter policy jobs_insert_own on public.jobs
  with check (employer_id = (select auth.uid()) and private.has_role((select auth.uid()), 'employer'));
alter policy applications_insert_own on public.applications
  with check (seeker_id = (select auth.uid()) and private.has_role((select auth.uid()), 'seeker')
              and not private.is_job_employer(job_id, (select auth.uid())));
-- business profiles stay public (name on job posts) even while the owner is using the worker role
alter policy profiles_read on public.profiles
  using ('employer' = any(roles) or id = (select auth.uid()) or private.is_my_applicant(id, (select auth.uid())));

-- 2. worker details -------------------------------------------------------------------------------------
create table public.worker_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  bio text check (char_length(bio) <= 500),
  birth_year smallint check (birth_year is null or birth_year between 1940 and 2015),
  experience text[] not null default '{}' check (
    experience <@ array['service', 'barista', 'kitchen', 'cashier', 'sales', 'warehouse', 'event', 'none']::text[]
    and not ('none' = any(experience) and cardinality(experience) > 1)),
  availability text[] not null default '{}' check (availability <@ array['morning', 'afternoon', 'evening', 'weekend']::text[]),
  -- the photo must live in the owner's own folder of the avatars bucket: "<user id>/<file>"
  avatar_path text check (avatar_path is null or avatar_path ~ ('^' || user_id::text || '/[A-Za-z0-9._-]{1,80}$')),
  updated_at timestamptz not null default now()
);
alter table public.worker_profiles enable row level security;
-- only the worker and businesses they applied to can read it
create policy worker_read on public.worker_profiles for select to authenticated
  using (user_id = (select auth.uid()) or private.is_my_applicant(user_id, (select auth.uid())));
create policy worker_insert_own on public.worker_profiles for insert to authenticated
  with check (user_id = (select auth.uid()) and private.has_role((select auth.uid()), 'seeker'));
create policy worker_update_own on public.worker_profiles for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
-- Supabase gives new tables full rights to anon/authenticated by default; keep only what the app needs
revoke all on public.worker_profiles from anon, authenticated;
grant select on public.worker_profiles to authenticated;
grant insert (user_id, bio, birth_year, experience, availability, avatar_path) on public.worker_profiles to authenticated;
grant update (bio, birth_year, experience, availability, avatar_path) on public.worker_profiles to authenticated;

insert into public.worker_profiles (user_id, bio, birth_year, experience, availability, avatar_path)
select id, bio, birth_year, experience, availability, avatar_path from public.profiles where role = 'seeker'
on conflict (user_id) do nothing;
-- the old copies on profiles are emptied and can no longer be written
update public.profiles set bio = null, birth_year = null, experience = '{}', availability = '{}', avatar_path = null
where bio is not null or birth_year is not null or avatar_path is not null or cardinality(experience) > 0 or cardinality(availability) > 0;
revoke insert (bio) on public.profiles from authenticated;
revoke update (bio, birth_year, experience, availability, avatar_path) on public.profiles from authenticated;

-- 3. adding / switching roles ---------------------------------------------------------------------------
create or replace function public.add_role(p_role text, p_business text, p_address text, p_city text) returns public.profiles
language plpgsql security definer set search_path = public as $$
declare me public.profiles; r public.profiles;
begin
  select * into me from public.profiles where id = auth.uid();
  if me.id is null then raise exception 'NOT_SIGNED_IN'; end if;
  if p_role not in ('seeker', 'employer') then raise exception 'INVALID_ROLE'; end if;
  if p_role::public.user_role = any(me.roles) then raise exception 'ROLE_EXISTS'; end if;
  if p_role = 'employer' and (char_length(trim(coalesce(p_business, ''))) < 2 or char_length(trim(coalesce(p_address, ''))) < 3) then
    raise exception 'BUSINESS_REQUIRED';
  end if;
  update public.profiles set
    roles = roles || p_role::public.user_role, role = p_role::public.user_role,
    business_name = case when p_role = 'employer' then left(trim(p_business), 120) else business_name end,
    address = case when p_role = 'employer' then left(trim(p_address), 200) else address end,
    city = coalesce(nullif(left(trim(coalesce(p_city, '')), 60), ''), city)
  where id = me.id returning * into r;
  return r;
end $$;

create or replace function public.switch_role(p_role text) returns public.profiles
language plpgsql security definer set search_path = public as $$
declare r public.profiles;
begin
  if p_role not in ('seeker', 'employer') then raise exception 'INVALID_ROLE'; end if;
  if not private.has_role(auth.uid(), p_role::public.user_role) then raise exception 'ROLE_NOT_OWNED'; end if;
  update public.profiles set role = p_role::public.user_role where id = auth.uid() returning * into r;
  return r;
end $$;

-- 4. sign-up with Google: worker intro text goes to worker_profiles ------------------------------------
create or replace function public.complete_profile(
  p_role text, p_full_name text, p_phone text, p_bio text, p_business text, p_address text, p_city text, p_locale text
) returns public.profiles
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); prov text; mail text; raw text := trim(coalesce(p_phone, '')); digits text; ph text; r public.profiles;
begin
  if uid is null then raise exception 'NOT_SIGNED_IN'; end if;
  if exists (select 1 from public.profiles where id = uid) then raise exception 'PROFILE_EXISTS'; end if;
  select raw_app_meta_data ->> 'provider', lower(email) into prov, mail from auth.users where id = uid;
  if prov is distinct from 'google' then raise exception 'FORBIDDEN'; end if;
  if p_role not in ('seeker', 'employer') then raise exception 'INVALID_ROLE'; end if;
  if char_length(trim(coalesce(p_full_name, ''))) < 1 then raise exception 'NAME_REQUIRED'; end if;
  digits := regexp_replace(raw, '\D', '', 'g');
  ph := case when left(raw, 1) = '+' then '+' || digits
             when left(raw, 1) = '0' then '+84' || substr(digits, 2)
             else null end;
  if ph is null or ph !~ '^\+[0-9]{8,15}$' then raise exception 'BAD_PHONE'; end if;
  insert into public.profiles (id, role, full_name, locale, business_name, address, city, auth_provider, is_admin)
  values (uid, p_role::public.user_role, left(trim(p_full_name), 80), case when p_locale = 'en' then 'en' else 'vi' end,
          case when p_role = 'employer' then nullif(left(trim(coalesce(p_business, '')), 120), '') end,
          case when p_role = 'employer' then nullif(left(trim(coalesce(p_address, '')), 200), '') end,
          nullif(left(trim(coalesce(p_city, '')), 60), ''), 'google',
          coalesce(mail = any (string_to_array(lower(replace(coalesce((select value from public.app_settings where key = 'admin_emails'), ''), ' ', '')), ',')), false))
  returning * into r;
  if p_role = 'seeker' then
    insert into public.worker_profiles (user_id, bio) values (uid, nullif(left(trim(coalesce(p_bio, '')), 500), ''));
  end if;
  insert into public.contacts (user_id, phone, verified) values (uid, ph, false);
  return r;
end $$;

-- 5. reviews: the side comes from the shift itself, not from the role in use ---------------------------
create or replace function public.submit_review(p_application uuid, p_stars int, p_tags text[], p_comment text) returns public.reviews
language plpgsql security definer set search_path = public as $$
declare a public.applications; j public.jobs; r public.reviews; allowed text[]; reviewee uuid; side public.user_role;
begin
  select * into a from public.applications where id = p_application;
  if a.id is null then raise exception 'NOT_FOUND'; end if;
  select * into j from public.jobs where id = a.job_id;
  if auth.uid() is null or auth.uid() not in (a.seeker_id, j.employer_id) then raise exception 'FORBIDDEN'; end if;
  if a.pay_status <> 'released' then raise exception 'NOT_COMPLETED'; end if;
  if a.released_at < now() - interval '30 days' then raise exception 'REVIEW_WINDOW_CLOSED'; end if;
  if p_stars is null or p_stars < 1 or p_stars > 5 then raise exception 'BAD_STARS'; end if;
  if auth.uid() = j.employer_id then
    side := 'employer'; allowed := array['hardworking', 'punctual', 'polite', 'fast_learner']; reviewee := a.seeker_id;
  else
    side := 'seeker'; allowed := array['accurate_description', 'friendly', 'clean_safe', 'clear_instructions']; reviewee := j.employer_id;
  end if;
  if not (coalesce(p_tags, '{}') <@ allowed) then raise exception 'BAD_TAGS'; end if;
  begin
    insert into public.reviews (application_id, reviewer_id, reviewee_id, reviewer_role, stars, tags, comment)
    values (a.id, auth.uid(), reviewee, side, p_stars, coalesce(p_tags, '{}'), nullif(left(trim(coalesce(p_comment, '')), 300), ''))
    returning * into r;
  exception when unique_violation then raise exception 'ALREADY_REVIEWED';
  end;
  return r;
end $$;

-- 6. reputation per role (same rules as reputations(), counted only on the asked side) ------------------
create or replace function public.role_reputations(p_users uuid[], p_as public.user_role)
returns table (user_id uuid, shifts_done int, on_time int, noshow int, late int, partners int,
               ratings int, avg_stars numeric, top_tags text[])
language sql stable security definer set search_path = public as $$
  with cfg as (
    select private.setting_num('rep_min_amount', 50000) as min_amt,
           now() - make_interval(days => private.setting_num('rep_window_days', 365)::int) as since
  ),
  shifts as (   -- qualifying shifts; `me` is the person on the asked side, `other` the partner
    select a.id, a.pay_status, a.attendance,
           case when p_as = 'seeker' then a.seeker_id else j.employer_id end as me,
           case when p_as = 'seeker' then j.employer_id else a.seeker_id end as other
    from public.applications a join public.jobs j on j.id = a.job_id, cfg
    where coalesce(a.escrow_amount, 0) >= cfg.min_amt and coalesce(a.completed_at, a.released_at) >= cfg.since
  ),
  revs as (     -- revealed reviews about the asked side, latest per reviewer→reviewee pair
    select distinct on (r.reviewer_id, r.reviewee_id) r.*
    from public.reviews r, cfg
    where r.created_at >= cfg.since and r.reviewer_role <> p_as and private.review_revealed(r.application_id)
      and exists (select 1 from shifts s where s.id = r.application_id)
    order by r.reviewer_id, r.reviewee_id, r.created_at desc
  )
  select u.id,
    (select count(*)::int from shifts s where s.pay_status = 'released' and s.me = u.id),
    (select count(*)::int from shifts s where s.pay_status = 'released' and s.attendance is distinct from 'late' and s.me = u.id),
    (select count(*)::int from shifts s where p_as = 'seeker' and s.me = u.id and s.pay_status = 'refunded' and s.attendance = 'noshow'),
    (select count(*)::int from shifts s where p_as = 'seeker' and s.me = u.id and s.pay_status = 'released' and s.attendance = 'late'),
    (select count(distinct s.other)::int from shifts s where s.pay_status = 'released' and s.me = u.id),
    (select count(*)::int from revs r where r.reviewee_id = u.id),
    (select round(avg(r.stars), 1) from revs r where r.reviewee_id = u.id),
    coalesce((select array_agg(t.tag order by t.n desc) from (
       select tag, count(*) n from revs r, unnest(r.tags) tag where r.reviewee_id = u.id
       group by tag order by count(*) desc limit 3) t), '{}')
  from unnest(p_users) as u(id)
$$;

-- 7. admin numbers count people by the roles they own ----------------------------------------------------
create or replace function public.admin_stats()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  today timestamptz := date_trunc('day', now() at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh';
begin
  if not private.is_admin(auth.uid()) then raise exception 'FORBIDDEN'; end if;
  return jsonb_build_object(
    'employers',        (select count(*) from profiles where 'employer' = any(roles)),
    'seekers',          (select count(*) from profiles where 'seeker' = any(roles)),
    'new_users_today',  (select count(*) from profiles where created_at >= today),
    'new_users_7d',     (select count(*) from profiles where created_at >= now() - interval '7 days'),
    'open_jobs',        (select count(*) from jobs where status = 'open'),
    'jobs_7d',          (select count(*) from jobs where created_at >= now() - interval '7 days'),
    'applications_today', (select count(*) from applications where created_at >= today),
    'applications_7d',  (select count(*) from applications where created_at >= now() - interval '7 days'),
    'accepted_total',   (select count(*) from applications where status = 'accepted'),
    'shifts_done',      (select count(*) from applications where completed_at is not null),
    'reviews_total',    (select count(*) from reviews),
    'open_disputes',    (select count(*) from applications where pay_status in ('disputed', 'noshow_reported'))
  );
end $$;

revoke all on function public.add_role(text, text, text, text), public.switch_role(text) from public, anon;
grant execute on function public.add_role(text, text, text, text), public.switch_role(text) to authenticated;
revoke all on function public.role_reputations(uuid[], public.user_role) from public;
grant execute on function public.role_reputations(uuid[], public.user_role) to anon, authenticated;
