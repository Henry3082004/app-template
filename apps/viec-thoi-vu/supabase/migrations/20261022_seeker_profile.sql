-- 20261022: a short worker profile so businesses can choose people: birth year, past work, free time, photo.
-- Values are fixed codes (the app shows the labels). Only the owner can change them (column grants + RLS
-- profiles_update_own); businesses see them only for people who applied to their jobs (profiles_read).
alter table public.profiles
  add column if not exists birth_year smallint,
  add column if not exists experience text[] not null default '{}',
  add column if not exists availability text[] not null default '{}',
  add column if not exists avatar_path text;

alter table public.profiles
  add constraint profiles_birth_year_chk check (birth_year is null or birth_year between 1940 and 2015),
  add constraint profiles_experience_chk check (
    experience <@ array['service', 'barista', 'kitchen', 'cashier', 'sales', 'warehouse', 'event', 'none']::text[]
    and not ('none' = any(experience) and cardinality(experience) > 1)),
  add constraint profiles_availability_chk check (availability <@ array['morning', 'afternoon', 'evening', 'weekend']::text[]),
  -- the photo must live in the owner's own folder of the avatars bucket: "<user id>/<file>"
  add constraint profiles_avatar_path_chk check (avatar_path is null or avatar_path ~ ('^' || id::text || '/[A-Za-z0-9._-]{1,80}$'));

grant update (birth_year, experience, availability, avatar_path) on public.profiles to authenticated;
