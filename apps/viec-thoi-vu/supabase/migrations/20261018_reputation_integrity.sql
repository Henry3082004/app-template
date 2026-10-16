-- Reputation integrity: the reputation score is the app's core asset, so it must be hard to fake.
-- Rules (all tunable in app_settings):
--   • only shifts worth >= rep_min_amount count (stops 1.000đ "fake shifts")
--   • only the last rep_window_days count (people can recover from a bad past)
--   • one review per pair of accounts counts (the latest) — a friend can't pump you with 50 reviews
-- Requires 20261016 + 20261017 first.

insert into public.app_settings (key, value) values ('rep_min_amount', '50000'), ('rep_window_days', '365')
  on conflict (key) do nothing;

create or replace function private.setting_num(p_key text, p_default numeric) returns numeric
language sql stable security definer set search_path = public as $$
  select coalesce((select value::numeric from public.app_settings where key = p_key), p_default) $$;

drop function if exists public.reputations(uuid[]);
create function public.reputations(p_users uuid[])
returns table (user_id uuid, shifts_done int, on_time int, noshow int, late int, partners int,
               ratings int, avg_stars numeric, top_tags text[])
language sql stable security definer set search_path = public as $$
  with cfg as (
    select private.setting_num('rep_min_amount', 50000) as min_amt,
           now() - make_interval(days => private.setting_num('rep_window_days', 365)::int) as since
  ),
  shifts as (   -- qualifying shifts, with both parties
    select a.id, a.seeker_id, j.employer_id, a.pay_status, a.attendance
    from public.applications a join public.jobs j on j.id = a.job_id, cfg
    where coalesce(a.escrow_amount, 0) >= cfg.min_amt and coalesce(a.completed_at, a.released_at) >= cfg.since
  ),
  revs as (     -- revealed reviews in the window, only the latest per reviewer→reviewee pair
    select distinct on (r.reviewer_id, r.reviewee_id) r.*
    from public.reviews r, cfg
    where r.created_at >= cfg.since and private.review_revealed(r.application_id)
      and exists (select 1 from shifts s where s.id = r.application_id)
    order by r.reviewer_id, r.reviewee_id, r.created_at desc
  )
  select u.id,
    (select count(*)::int from shifts s where s.pay_status = 'released' and (s.seeker_id = u.id or s.employer_id = u.id)),
    (select count(*)::int from shifts s where s.pay_status = 'released' and s.attendance is distinct from 'late' and (s.seeker_id = u.id or s.employer_id = u.id)),
    (select count(*)::int from shifts s where s.seeker_id = u.id and s.pay_status = 'refunded' and s.attendance = 'noshow'),
    (select count(*)::int from shifts s where s.seeker_id = u.id and s.pay_status = 'released' and s.attendance = 'late'),
    (select count(distinct case when s.seeker_id = u.id then s.employer_id else s.seeker_id end)::int
       from shifts s where s.pay_status = 'released' and (s.seeker_id = u.id or s.employer_id = u.id)),
    (select count(*)::int from revs r where r.reviewee_id = u.id),
    (select round(avg(r.stars), 1) from revs r where r.reviewee_id = u.id),
    coalesce((select array_agg(t.tag order by t.n desc) from (
       select tag, count(*) n from revs r, unnest(r.tags) tag where r.reviewee_id = u.id
       group by tag order by count(*) desc limit 3) t), '{}')
  from unnest(p_users) as u(id)
$$;
revoke all on function public.reputations(uuid[]) from public;
grant execute on function public.reputations(uuid[]) to anon, authenticated;

-- How many finished shifts (last 30 days) the caller still has to review.
create or replace function public.my_pending_reviews() returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.applications a join public.jobs j on j.id = a.job_id
  where a.pay_status = 'released' and a.released_at >= now() - interval '30 days'
    and auth.uid() in (a.seeker_id, j.employer_id)
    and not exists (select 1 from public.reviews r where r.application_id = a.id and r.reviewer_id = auth.uid())
$$;

-- For the caller's own shifts: has the OTHER side already reviewed? (never reveals the content)
create or replace function public.review_flags(p_apps uuid[]) returns table (application_id uuid, other_reviewed boolean)
language sql stable security definer set search_path = public as $$
  select a.id, exists (select 1 from public.reviews r where r.application_id = a.id and r.reviewer_id <> auth.uid())
  from public.applications a join public.jobs j on j.id = a.job_id
  where a.id = any (p_apps) and auth.uid() in (a.seeker_id, j.employer_id)
$$;

-- Admin: patterns that look like reputation farming.
create or replace function public.admin_flags()
returns table (kind text, employer_name text, seeker_name text, shifts int, total numeric, last_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not private.is_admin(auth.uid()) then raise exception 'FORBIDDEN'; end if;
  return query
    -- same pair, many paid shifts in 30 days
    select 'repeat_pair'::text, coalesce(nullif(e.business_name, ''), e.full_name), s.full_name, count(*)::int, sum(a.escrow_amount), max(a.released_at)
    from public.applications a join public.jobs j on j.id = a.job_id
      join public.profiles e on e.id = j.employer_id join public.profiles s on s.id = a.seeker_id
    where a.pay_status = 'released' and a.released_at >= now() - interval '30 days'
    group by e.id, e.business_name, e.full_name, s.id, s.full_name having count(*) >= 3
    union all
    -- paid shift between two brand-new accounts (both created < 7 days before payout)
    select 'new_accounts', coalesce(nullif(e.business_name, ''), e.full_name), s.full_name, 1, a.escrow_amount, a.released_at
    from public.applications a join public.jobs j on j.id = a.job_id
      join public.profiles e on e.id = j.employer_id join public.profiles s on s.id = a.seeker_id
    where a.pay_status = 'released' and a.released_at >= now() - interval '30 days'
      and e.created_at > a.released_at - interval '7 days' and s.created_at > a.released_at - interval '7 days'
    order by 6 desc nulls last;
end $$;

revoke all on function public.my_pending_reviews(), public.review_flags(uuid[]), public.admin_flags() from public, anon;
grant execute on function public.my_pending_reviews(), public.review_flags(uuid[]), public.admin_flags() to authenticated;
