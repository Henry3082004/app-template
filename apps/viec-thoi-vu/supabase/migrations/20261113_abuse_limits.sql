-- Abuse limits: the daily TOTAL in ai_hit now counts only keys of the same kind (the text before ':'), so a flood of sign-ups
-- ('su:') or of guests ('g:') can no longer use up the budget of signed-in people ('u:') or switch Capy off for everyone.
create or replace function public.ai_hit(p_key text, p_cap int, p_total_cap int) returns boolean
language plpgsql security definer set search_path = public as $$
declare d date := (now() at time zone 'Asia/Ho_Chi_Minh')::date; mine int; total bigint; kind text := split_part(left(p_key, 80), ':', 1) || ':';
begin
  select coalesce(sum(n), 0) into total from public.ai_usage where day = d and key like kind || '%';
  if total >= p_total_cap then return false; end if;
  insert into public.ai_usage (key, day, n) values (left(p_key, 80), d, 1)
  on conflict (key, day) do update set n = public.ai_usage.n + 1 returning n into mine;
  if mine > p_cap then return false; end if;
  return true;
end $$;
