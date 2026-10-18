-- Multiple sign-in methods: Zalo (Vietnamese users, phone verified by Zalo) and Google (international users).
-- Plan: web/Zalo for Vietnamese = Zalo; foreigners without a Vietnamese number = Google (+ a phone they type, NOT verified).
-- Requires everything up to 20261018_free_mode.sql.

-- A verified phone (proven by Zalo) must be unique and can never be squatted by someone who merely typed it.
alter table public.contacts add column if not exists verified boolean not null default false;
update public.contacts set verified = true;   -- every existing row came from the Zalo/demo era
create unique index if not exists contacts_phone_verified_uq on public.contacts (phone) where verified;

alter table public.profiles add column if not exists auth_provider text not null default 'password'
  check (auth_provider in ('password', 'zalo', 'google'));

insert into public.app_settings (key, value) values ('google_login', 'off'), ('zalo_web_login', 'off')
  on conflict (key) do nothing;

create or replace function public.app_config() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'payment_mode', coalesce((select value from public.app_settings where key = 'payment_mode'), 'test'),
    'billing', coalesce((select value from public.app_settings where key = 'billing'), 'on'),
    'google_login', coalesce((select value from public.app_settings where key = 'google_login'), 'off'),
    'zalo_web_login', coalesce((select value from public.app_settings where key = 'zalo_web_login'), 'off')) $$;

-- Finish an account created through Google (supabase OAuth). Only OAuth users can use this path.
create or replace function public.complete_profile(
  p_role text, p_full_name text, p_phone text, p_bio text, p_business text, p_address text, p_city text, p_locale text
) returns public.profiles
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); prov text; raw text := trim(coalesce(p_phone, '')); digits text; ph text; r public.profiles;
begin
  if uid is null then raise exception 'NOT_SIGNED_IN'; end if;
  if exists (select 1 from public.profiles where id = uid) then raise exception 'PROFILE_EXISTS'; end if;
  select raw_app_meta_data ->> 'provider' into prov from auth.users where id = uid;
  if prov is distinct from 'google' then raise exception 'FORBIDDEN'; end if;
  if p_role not in ('seeker', 'employer') then raise exception 'INVALID_ROLE'; end if;
  if char_length(trim(coalesce(p_full_name, ''))) < 1 then raise exception 'NAME_REQUIRED'; end if;
  digits := regexp_replace(raw, '\D', '', 'g');
  ph := case when left(raw, 1) = '+' then '+' || digits
             when left(raw, 1) = '0' then '+84' || substr(digits, 2)   -- local Vietnamese format
             else null end;
  if ph is null or ph !~ '^\+[0-9]{8,15}$' then raise exception 'BAD_PHONE'; end if;
  insert into public.profiles (id, role, full_name, locale, bio, business_name, address, city, auth_provider)
  values (uid, p_role::public.user_role, left(trim(p_full_name), 80), case when p_locale = 'en' then 'en' else 'vi' end,
          case when p_role = 'seeker' then nullif(left(trim(coalesce(p_bio, '')), 500), '') end,
          case when p_role = 'employer' then nullif(left(trim(coalesce(p_business, '')), 120), '') end,
          case when p_role = 'employer' then nullif(left(trim(coalesce(p_address, '')), 200), '') end,
          nullif(left(trim(coalesce(p_city, '')), 60), ''), 'google')
  returning * into r;
  insert into public.contacts (user_id, phone, verified) values (uid, ph, false);   -- typed by the user, not verified
  return r;
end $$;

revoke all on function public.complete_profile(text, text, text, text, text, text, text, text) from public, anon;
grant execute on function public.complete_profile(text, text, text, text, text, text, text, text) to authenticated;
