-- Proof of consent (Law on Personal Data Protection 91/2025, Decree 13/2023): when a person agreed, to what, and which version of the
-- terms. 'terms' = terms + privacy policy at sign-up; 'location' = sharing the phone's location when checking in. One row per agreement
-- (history is kept; withdrawing is done by deleting the account or asking the support e-mail). Only the person's own rows can be written.
create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('terms', 'location')),
  version text not null check (char_length(version) between 1 and 20),
  created_at timestamptz not null default now()
);
create index if not exists consents_user on public.consents (user_id, kind, created_at desc);
alter table public.consents enable row level security;
revoke all on public.consents from anon, authenticated;

create or replace function public.record_consent(p_kind text, p_version text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'FORBIDDEN'; end if;
  if p_kind not in ('terms', 'location') then raise exception 'BAD_KIND'; end if;
  if p_version is null or char_length(p_version) not between 1 and 20 then raise exception 'BAD_VERSION'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid()) then raise exception 'FORBIDDEN'; end if;
  -- do not pile up identical rows: the same version of the same kind is recorded once
  if exists (select 1 from public.consents where user_id = auth.uid() and kind = p_kind and version = p_version) then return; end if;
  insert into public.consents (user_id, kind, version) values (auth.uid(), p_kind, p_version);
end $$;

-- what I agreed to (latest per kind), so the app does not ask again
create or replace function public.my_consents() returns table (kind text, version text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select distinct on (c.kind) c.kind, c.version, c.created_at from public.consents c where c.user_id = auth.uid() order by c.kind, c.created_at desc
$$;

-- admin: how many people have agreed to the current terms
create or replace function public.admin_consent_stats(p_version text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not private.is_admin(auth.uid()) then raise exception 'FORBIDDEN'; end if;
  return jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'terms_current', (select count(distinct user_id) from public.consents where kind = 'terms' and version = p_version),
    'location', (select count(distinct user_id) from public.consents where kind = 'location'));
end $$;

revoke all on function public.record_consent(text, text), public.my_consents(), public.admin_consent_stats(text) from public, anon;
grant execute on function public.record_consent(text, text), public.my_consents(), public.admin_consent_stats(text) to authenticated;
