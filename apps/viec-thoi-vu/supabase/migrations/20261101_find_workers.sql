-- Shops can search for workers. A worker is listed only after switching "Let shops find me" on (default off).
-- A shop sees a shortened name, area, age, experience, free times, photo and reputation — never a phone number or the full name.
-- The phone is shared only when the worker accepts a job, as always. A shop may invite any listed worker to one of its open posts.

alter table public.worker_profiles add column if not exists discoverable boolean not null default false;

create or replace function public.set_discoverable(p_on boolean) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null or not private.has_role(uid, 'seeker') then raise exception 'FORBIDDEN'; end if;
  insert into public.worker_profiles (user_id, discoverable) values (uid, coalesce(p_on, false))
  on conflict (user_id) do update set discoverable = excluded.discoverable, updated_at = now();
end $$;

create or replace function public.my_discoverable() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select discoverable from public.worker_profiles where user_id = auth.uid()), false)
$$;

create or replace function public.search_workers(p_city text default null, p_exp text default null, p_when text default null, p_limit int default 30)
returns table (user_id uuid, name text, city text, birth_year smallint, experience text[], availability text[], avatar_path text,
               shifts_done int, avg_stars numeric, ratings int)
language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null or not private.has_role(uid, 'employer') then raise exception 'FORBIDDEN'; end if;
  return query
  with found as (
    select p.id, p.full_name, p.city, w.birth_year, w.experience, w.availability, w.avatar_path
    from public.worker_profiles w join public.profiles p on p.id = w.user_id
    where w.discoverable and p.id <> uid and private.has_role(p.id, 'seeker') and not p.is_sample
      and (nullif(p_city, '') is null or p.city = p_city)
      and (nullif(p_exp, '') is null or p_exp = any(w.experience))
      and (nullif(p_when, '') is null or p_when = any(w.availability))
  ), rep as (
    select r.user_id, r.shifts_done, r.avg_stars, r.ratings from public.role_reputations((select coalesce(array_agg(f.id), '{}') from found f), 'seeker') r
  )
  select f.id,
         case when position(' ' in btrim(f.full_name)) > 0
              then (regexp_match(btrim(f.full_name), '([^ ]+)$'))[1] || ' ' || upper(left(btrim(f.full_name), 1)) || '.'
              else btrim(f.full_name) end,
         f.city, f.birth_year, f.experience, f.availability, f.avatar_path,
         coalesce(rep.shifts_done, 0), rep.avg_stars, coalesce(rep.ratings, 0)
  from found f left join rep on rep.user_id = f.id
  order by coalesce(rep.shifts_done, 0) desc, rep.avg_stars desc nulls last, f.id
  limit least(greatest(coalesce(p_limit, 30), 1), 50);
end $$;

-- invites: a past worker of the shop OR a worker who chose to be found
create or replace function public.invite_worker(p_job uuid, p_worker uuid) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); j public.jobs; biz text; n int; reg boolean;
begin
  select * into j from public.jobs where id = p_job;
  if j.id is null or j.employer_id <> uid then raise exception 'FORBIDDEN'; end if;
  if j.status <> 'open' then raise exception 'JOB_NOT_OPEN'; end if;
  reg := exists (select 1 from public.applications a join public.jobs jj on jj.id = a.job_id
                 where jj.employer_id = uid and a.seeker_id = p_worker and a.pay_status = 'released' and coalesce(a.attendance, 'ok') <> 'noshow');
  if not reg and not exists (select 1 from public.worker_profiles w where w.user_id = p_worker and w.discoverable) then
    raise exception 'NOT_A_REGULAR';
  end if;
  if exists (select 1 from public.applications where job_id = p_job and seeker_id = p_worker) then raise exception 'ALREADY_APPLIED'; end if;
  if (select count(*) from public.job_invites where employer_id = uid and created_at > now() - interval '1 day') >= 20 then raise exception 'TOO_MANY'; end if;
  insert into public.job_invites (employer_id, worker_id, job_id) values (uid, p_worker, p_job) on conflict (job_id, worker_id) do nothing;
  get diagnostics n = row_count;
  if n > 0 then
    select coalesce(business_name, full_name) into biz from public.profiles where id = uid;
    insert into public.notifications (user_id, kind, title, body, link, ref)
    values (p_worker, 'invite', left(coalesce(biz, 'Một quán') || case when reg then ' mời bạn làm lại' else ' mời bạn làm' end, 120), 'Việc "' || j.title || '" — xem và ứng tuyển', '/app/viec/' || p_job, p_job);
  end if;
end $$;

revoke all on function public.set_discoverable(boolean), public.my_discoverable(), public.search_workers(text, text, text, int) from public, anon;
grant execute on function public.set_discoverable(boolean), public.my_discoverable(), public.search_workers(text, text, text, int) to authenticated;
