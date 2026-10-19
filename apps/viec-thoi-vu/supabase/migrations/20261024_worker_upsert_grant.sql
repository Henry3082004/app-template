-- 20261024: the app saves worker details with an upsert (insert … on conflict do update), and PostgREST's
-- "do update" sets every column it was sent — user_id included — so it needs UPDATE on user_id too.
-- Safe: worker_update_own only lets anyone touch their own row, and with check keeps user_id = auth.uid().
grant update (user_id) on public.worker_profiles to authenticated;
