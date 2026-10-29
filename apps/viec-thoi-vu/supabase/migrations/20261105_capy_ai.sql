-- Capy, the AI helper (edge function `capy-assistant`): switch + daily limits. It is OFF until app_settings.ai_assistant = 'on'.
-- (One small row per person per day; old days can be removed by hand now and then.)
-- ai_hit() counts a request and says whether it is allowed; only the edge function (service role) can call it.
create table if not exists public.ai_usage (
  key text not null,            -- 'u:<user id>' or 'd:<device id>'
  day date not null,
  n int not null default 0,
  primary key (key, day)
);
alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;

create or replace function public.ai_hit(p_key text, p_cap int, p_total_cap int) returns boolean
language plpgsql security definer set search_path = public as $$
declare d date := (now() at time zone 'Asia/Ho_Chi_Minh')::date; mine int; total bigint;
begin
  select coalesce(sum(n), 0) into total from public.ai_usage where day = d;
  if total >= p_total_cap then return false; end if;
  insert into public.ai_usage (key, day, n) values (left(p_key, 80), d, 1)
  on conflict (key, day) do update set n = public.ai_usage.n + 1 returning n into mine;
  if mine > p_cap then return false; end if;
  return true;
end $$;
revoke all on function public.ai_hit(text, int, int) from public, anon, authenticated;
do $$ begin if exists (select 1 from pg_roles where rolname = 'service_role') then grant execute on function public.ai_hit(text, int, int) to service_role; end if; end $$;

create or replace function public.app_config() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'payment_mode', coalesce((select value from public.app_settings where key = 'payment_mode'), 'test'),
    'billing', coalesce((select value from public.app_settings where key = 'billing'), 'on'),
    'google_login', coalesce((select value from public.app_settings where key = 'google_login'), 'off'),
    'zalo_web_login', coalesce((select value from public.app_settings where key = 'zalo_web_login'), 'off'),
    'zalo_published', coalesce((select value from public.app_settings where key = 'zalo_published'), 'off'),
    'ai_assistant', coalesce((select value from public.app_settings where key = 'ai_assistant'), 'off')) $$;

insert into public.app_settings (key, value) values ('ai_assistant', 'off'), ('ai_cap_guest', '15'), ('ai_cap_user', '40'), ('ai_cap_total', '3000')
on conflict (key) do nothing;
