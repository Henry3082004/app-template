-- "Capy hỏi nhanh": a few tap-only questions the first time someone opens the app. The answers suggest matching
-- jobs and pre-fill the worker profile. One row per device until the person signs in, then one row per account.
-- Answers are only ever added to (new questions later are asked on their own); nothing here is shown to others.

create table if not exists public.quiz_answers (
  device_id uuid primary key,
  user_id uuid unique references public.profiles (id) on delete set null,
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object' and pg_column_size(answers) < 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.quiz_answers enable row level security;
revoke all on public.quiz_answers from anon, authenticated; -- only through the two functions below

-- Keeps known questions with known values; a question answered "skip" is stored as null so it is not asked again.
-- Adding a question = add it to the app (src/lib/quiz.ts) AND here.
create or replace function private.clean_quiz(p jsonb) returns jsonb
language plpgsql immutable set search_path = public as $$
declare out jsonb := '{}'::jsonb; k text; v jsonb;
  allowed jsonb := '{
    "cats": ["service","warehouse","event","farm","retail","any"],
    "time": ["morning","afternoon","evening","weekend"],
    "exp":  ["service","barista","kitchen","cashier","sales","warehouse","event","none"]
  }';
begin
  if p is null or jsonb_typeof(p) <> 'object' then return out; end if;
  for k, v in select * from jsonb_each(p) loop
    if k not in ('goal', 'city', 'cats', 'time', 'exp') then continue; end if;
    if jsonb_typeof(v) = 'null' then out := out || jsonb_build_object(k, v);
    elsif k = 'goal' and v #>> '{}' in ('seeker', 'employer') then out := out || jsonb_build_object(k, v);
    elsif k = 'city' and jsonb_typeof(v) = 'string' and char_length(v #>> '{}') between 1 and 40 then out := out || jsonb_build_object(k, v);
    elsif k in ('cats', 'time', 'exp') and jsonb_typeof(v) = 'array' and jsonb_array_length(v) between 1 and 10
      and not exists (select 1 from jsonb_array_elements(v) e where jsonb_typeof(e) <> 'string' or not (allowed -> k ? (e #>> '{}'))) then
      out := out || jsonb_build_object(k, v);
    end if;
  end loop;
  return out;
end $$;

create or replace function public.save_quiz(p_device uuid, p_answers jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); clean jsonb := private.clean_quiz(p_answers); n int;
begin
  if p_device is null then raise exception 'BAD_QUIZ'; end if;
  if clean = '{}'::jsonb then return; end if;
  if uid is null then
    -- signed out: one row per device (a device row that already belongs to an account is left alone)
    insert into quiz_answers (device_id, answers) values (p_device, clean)
      on conflict (device_id) do update set answers = quiz_answers.answers || excluded.answers, updated_at = now()
      where quiz_answers.user_id is null;
    return;
  end if;
  -- signed in: the account's row collects everything; this device's anonymous answers are folded in once
  update quiz_answers a set answers = a.answers || coalesce((select d.answers from quiz_answers d where d.device_id = p_device and d.user_id is null), '{}') || clean,
    updated_at = now() where a.user_id = uid;
  get diagnostics n = row_count;
  if n > 0 then
    delete from quiz_answers where device_id = p_device and user_id is null;
    return;
  end if;
  insert into quiz_answers (device_id, user_id, answers) values (p_device, uid, clean)
    on conflict (device_id) do update set user_id = uid, answers = quiz_answers.answers || excluded.answers, updated_at = now()
    where quiz_answers.user_id is null;
  get diagnostics n = row_count;
  if n = 0 then -- a shared phone: this device's row belongs to someone else, so the account gets its own row
    insert into quiz_answers (device_id, user_id, answers) values (gen_random_uuid(), uid, clean);
  end if;
end $$;

create or replace function public.my_quiz() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce((select answers from quiz_answers where user_id = auth.uid()), '{}'::jsonb) $$;

revoke all on function public.save_quiz(uuid, jsonb), public.my_quiz() from public, anon, authenticated;
grant execute on function public.save_quiz(uuid, jsonb) to anon, authenticated;
grant execute on function public.my_quiz() to authenticated;
