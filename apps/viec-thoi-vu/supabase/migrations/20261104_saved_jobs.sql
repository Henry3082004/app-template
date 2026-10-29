-- "Việc đã lưu": a worker keeps jobs to look at again, compare, and apply to all at once. Only the owner can read, add or remove.
-- (A visitor who is not signed in keeps the list on the device; it moves into the account at sign-in.)
create table if not exists public.saved_jobs (
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);
alter table public.saved_jobs enable row level security;
revoke all on public.saved_jobs from anon, authenticated;
grant select, delete on public.saved_jobs to authenticated;
grant insert (user_id, job_id) on public.saved_jobs to authenticated;
create policy saved_read on public.saved_jobs for select to authenticated using (user_id = (select auth.uid()));
create policy saved_insert on public.saved_jobs for insert to authenticated with check (user_id = (select auth.uid()));
create policy saved_delete on public.saved_jobs for delete to authenticated using (user_id = (select auth.uid()));
