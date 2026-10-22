-- Free mode: the shop records that it paid the worker in cash (no money moves through the app).
alter table public.applications add column if not exists paid_cash_at timestamptz;

create or replace function public.mark_paid_cash(p_application uuid) returns void
language plpgsql security definer set search_path = public as $$
declare a public.applications; j public.jobs;
begin
  select * into a from public.applications where id = p_application for update;
  if a.id is null then raise exception 'NOT_FOUND'; end if;
  select * into j from public.jobs where id = a.job_id;
  if j.employer_id <> auth.uid() then raise exception 'FORBIDDEN'; end if;
  if a.pay_status <> 'released' or coalesce(a.funding_mode, 'off') <> 'off' then raise exception 'ALREADY_SETTLED'; end if;
  update public.applications set paid_cash_at = coalesce(paid_cash_at, now()) where id = a.id;
end $$;

revoke all on function public.mark_paid_cash(uuid) from public, anon;
grant execute on function public.mark_paid_cash(uuid) to authenticated;
