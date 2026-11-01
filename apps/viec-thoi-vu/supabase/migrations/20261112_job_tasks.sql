-- Tasks inside a shift: the shop lists what the worker will actually do ("Gọt hàng", "Bưng bê", "Lọc cá"…).
-- Public on the post. Cleaned up on every write: trimmed, blanks and repeats dropped, 60 characters each, at most 12.
-- The suspicious-phrase screening (jobs_screen) now reads the tasks too.

alter table public.jobs add column if not exists tasks text[] not null default '{}';
grant insert (tasks), update (tasks) on public.jobs to authenticated;

create or replace function private.jobs_tasks() returns trigger
language plpgsql set search_path = public as $$
declare arr text[];
begin
  select coalesce(array_agg(d.t order by d.ord), '{}') into arr from (
    select distinct on (lower(s.t)) s.t, s.ord from (
      select left(btrim(x), 60) as t, ord from unnest(coalesce(new.tasks, '{}')) with ordinality as u(x, ord)) s
    where s.t <> '' order by lower(s.t), s.ord) d;
  new.tasks := arr[1:12];
  return new;
end $$;
revoke all on function private.jobs_tasks() from public, anon, authenticated;
create or replace trigger jobs_tasks before insert or update on public.jobs
  for each row execute function private.jobs_tasks();

create or replace function private.jobs_screen() returns trigger
language plpgsql security definer set search_path = public as $$
declare hit text; txt text; changed boolean;
begin
  changed := tg_op = 'INSERT' or new.title is distinct from old.title or new.description is distinct from old.description
    or new.shift_note is distinct from old.shift_note or new.tasks is distinct from old.tasks;
  if changed then
    txt := lower(coalesce(new.title, '') || ' ' || coalesce(new.description, '') || ' ' || coalesce(new.shift_note, '') || ' ' || coalesce(array_to_string(new.tasks, ' '), ''));
    select btrim(w) into hit from unnest(string_to_array(coalesce((select value from public.app_settings where key = 'suspicious_words'), ''), ',')) w
      where btrim(w) <> '' and position(lower(btrim(w)) in txt) > 0 limit 1;
    if hit is not null then
      new.held_reason := 'Chứa cụm "' || hit || '"'; new.vetted := false;
    elsif private.hold_until(new.employer_id) is not null then
      new.held_reason := 'Tài khoản đang chờ xác minh'; new.vetted := false;
    elsif new.held_reason is not null and new.held_reason not like 'REJECTED%' and new.held_reason like 'Chứa cụm%' then
      new.held_reason := null; new.vetted := true;
    end if;
  end if;
  if new.held_reason is not null and not new.vetted then new.status := 'closed'; end if;
  if new.held_reason is not null and not new.vetted and new.held_reason not like 'REJECTED%'
     and (tg_op = 'INSERT' or old.held_reason is distinct from new.held_reason) then
    perform private.notify(new.employer_id, 'job_held', 'Tin đang chờ duyệt', left('"' || new.title || '" — ' || new.held_reason || '. Quản trị sẽ xem trong 24 giờ.', 300), '/app/viec-cua-toi');
  end if;
  return new;
end $$;
revoke all on function private.jobs_screen() from public, anon, authenticated;
