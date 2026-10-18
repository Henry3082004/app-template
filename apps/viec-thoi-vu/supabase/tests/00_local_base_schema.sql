create role anon nologin; create role authenticated nologin;
create schema auth; create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create schema private; grant usage on schema public, private to anon, authenticated;
create type user_role as enum ('seeker','employer'); create type application_status as enum ('pending','accepted','rejected','withdrawn');
create type job_status as enum ('open','closed'); create type pay_unit as enum ('hour','day','shift','job');
create table profiles (id uuid primary key references auth.users, role user_role not null, full_name text not null, bio text, business_name text, address text, city text,
  plan text not null default 'free', plan_until timestamptz, locale text not null default 'vi', created_at timestamptz not null default now());
create table contacts (user_id uuid primary key references profiles, phone text not null);
create table jobs (id uuid primary key default gen_random_uuid(), employer_id uuid not null references profiles, title text not null, description text, category text default 'other',
  pay_amount integer not null, pay_unit pay_unit not null, start_date date not null, end_date date not null, shift_note text, address text default '', city text default '', lat float, lng float,
  slots int not null default 1, filled int not null default 0, is_urgent boolean default false, status job_status not null default 'open', created_at timestamptz default now());
create table applications (id uuid primary key default gen_random_uuid(), job_id uuid not null references jobs, seeker_id uuid not null references profiles, status application_status not null default 'pending',
  message text, seen_by_employer boolean default false, created_at timestamptz default now(), decided_at timestamptz, unique (job_id, seeker_id));
alter table profiles enable row level security; alter table contacts enable row level security; alter table jobs enable row level security; alter table applications enable row level security;
create function private.current_role_of(uid uuid) returns user_role language sql stable security definer set search_path = public as $$ select role from public.profiles where id = uid $$;
create function private.is_accepted_pair(employer uuid, seeker uuid) returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.applications a join public.jobs j on j.id = a.job_id where a.status = 'accepted' and j.employer_id = employer and a.seeker_id = seeker) $$;
create function private.is_job_employer(p_job uuid, uid uuid) returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.jobs where id = p_job and employer_id = uid) $$;
create function private.is_my_applicant(seeker uuid, uid uuid) returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.applications a join public.jobs j on j.id = a.job_id where a.seeker_id = seeker and j.employer_id = uid) $$;
create function private.has_applied(p_job uuid, uid uuid) returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.applications where job_id = p_job and seeker_id = uid) $$;
create policy applications_read on applications for select using (seeker_id = auth.uid() or private.is_job_employer(job_id, auth.uid()));
create policy contacts_read on contacts for select using (user_id = auth.uid() or private.is_accepted_pair(auth.uid(), user_id) or private.is_accepted_pair(user_id, auth.uid()));
create policy jobs_read on jobs for select using (status = 'open' or employer_id = auth.uid() or private.has_applied(id, auth.uid()));
create policy profiles_read on profiles for select using (role = 'employer' or id = auth.uid() or private.is_my_applicant(id, auth.uid()));
grant select on all tables in schema public to anon, authenticated;
grant update (full_name, bio, business_name, address, city, locale) on profiles to authenticated;
create function public.decide_application(p_application uuid, p_decision application_status) returns applications language plpgsql security definer set search_path = public as $$
declare a public.applications; j public.jobs;
begin
  select * into a from public.applications where id = p_application for update;
  select * into j from public.jobs where id = a.job_id for update;
  if j.employer_id <> auth.uid() then raise exception 'FORBIDDEN'; end if;
  if a.status <> 'pending' then raise exception 'ALREADY_DECIDED'; end if;
  if p_decision = 'accepted' then
    update public.jobs set filled = filled + 1, status = case when filled + 1 >= slots then 'closed'::public.job_status else status end where id = j.id;
  end if;
  update public.applications set status = p_decision, decided_at = now(), seen_by_employer = true where id = a.id returning * into a; return a;
end $$;

-- prod has private.is_pro from init_schema; stub it here so 20261018_free_mode.sql can replace it
create function private.is_pro(uid uuid) returns boolean language sql stable as $$ select false $$;
