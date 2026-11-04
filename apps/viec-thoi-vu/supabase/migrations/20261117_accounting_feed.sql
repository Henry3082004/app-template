-- Accounting feed: once an hour the edge function `accounting-sync` copies DAILY TOTALS (never names, phones or e-mails) into the owner's
-- private Google Sheet: new shops, new workers, finished shifts, fee at list price, voucher discount, fee due. A finished shift that
-- owes a fee also becomes one balanced journal entry (Dr 1100 receivable / Cr 4000 service fee revenue), so the statements update by themselves.
--   · acct_daily(days): the totals per Vietnam-time day (real accounts only, sample accounts are left out). Only the service role may call it.
--   · acct_sync_key(): a random key kept in the vault; the hourly pg_cron call sends it and the edge function checks it. Nothing to paste by hand.
--   · NOTHING is charged and no payment is read here: payments stay off. Money received is still typed into the sheet's Journal by hand.
insert into public.app_settings (key, value) values ('acct_sheet_id', '1DyaDd3CFvGQixEBZk4qzoDmPBC5vwbWifZxVnro4zXA')
on conflict (key) do nothing;

create or replace function public.acct_daily(p_days int default 400) returns jsonb
language sql stable security definer set search_path = public as $$
  with last_day as (select (now() at time zone 'Asia/Ho_Chi_Minh')::date as d),
  days as (
    select g::date as day from last_day,
      generate_series(last_day.d - (least(greatest(coalesce(p_days, 400), 1), 800) - 1), last_day.d, interval '1 day') g),
  pr as (
    select (created_at at time zone 'Asia/Ho_Chi_Minh')::date as day,
           count(*) filter (where 'employer'::user_role = any (roles)) as shops,
           count(*) filter (where 'seeker'::user_role = any (roles)) as workers
    from public.profiles where not is_sample group by 1),
  sf as (
    select (f.created_at at time zone 'Asia/Ho_Chi_Minh')::date as day, count(*) as shifts,
           coalesce(sum(f.fee), 0) as fee, coalesce(sum(f.discount), 0) as discount, coalesce(sum(f.due), 0) as due
    from public.service_fees f join public.profiles e on e.id = f.employer_id and not e.is_sample group by 1)
  select coalesce(jsonb_agg(jsonb_build_object(
    'day', days.day, 'shops', coalesce(pr.shops, 0), 'workers', coalesce(pr.workers, 0), 'shifts', coalesce(sf.shifts, 0),
    'fee', coalesce(sf.fee, 0), 'discount', coalesce(sf.discount, 0), 'due', coalesce(sf.due, 0)) order by days.day), '[]'::jsonb)
  from days left join pr on pr.day = days.day left join sf on sf.day = days.day
$$;
revoke all on function public.acct_daily(int) from public, anon, authenticated;
do $$ begin if exists (select 1 from pg_roles where rolname = 'service_role') then grant execute on function public.acct_daily(int) to service_role; end if; end $$;

-- the shared key and the hourly call (only where the vault, pg_net and pg_cron exist; the local test database has none)
do $do$ begin
  if exists (select 1 from pg_extension where extname = 'supabase_vault') then
    if not exists (select 1 from vault.secrets where name = 'acct_sync_key') then
      perform vault.create_secret(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'acct_sync_key', 'key the hourly accounting-sync call sends');
    end if;
    execute $f$create or replace function public.acct_sync_key() returns text
      language sql stable security definer set search_path = public, vault as
      $b$ select decrypted_secret from vault.decrypted_secrets where name = 'acct_sync_key' $b$$f$;
    execute 'revoke all on function public.acct_sync_key() from public, anon, authenticated';
    if exists (select 1 from pg_roles where rolname = 'service_role') then execute 'grant execute on function public.acct_sync_key() to service_role'; end if;
  end if;
  if exists (select 1 from pg_extension where extname = 'pg_cron') and exists (select 1 from pg_extension where extname = 'pg_net')
     and exists (select 1 from pg_extension where extname = 'supabase_vault') then
    if not exists (select 1 from cron.job where jobname = 'vtv-accounting-sync') then
      perform cron.schedule('vtv-accounting-sync', '20 * * * *', $c$
        select net.http_post(
          url := 'https://niscqjczfvipxxgdslqs.supabase.co/functions/v1/accounting-sync',
          headers := jsonb_build_object('Content-Type', 'application/json', 'x-sync-key', (select decrypted_secret from vault.decrypted_secrets where name = 'acct_sync_key')),
          body := '{}'::jsonb, timeout_milliseconds := 25000) $c$);
    end if;
  end if;
end $do$;
