-- Shop logo / photo (shown on job cards and job pages) + bundled sample pictures for the admin-only sample data.
-- profiles.logo_path: either "<user id>/<file>" in the public `avatars` bucket (same rule as worker photos),
-- or "/sample/<name>.png", a picture that ships with the web app (used only by the sample shops/workers).

alter table public.profiles add column if not exists logo_path text;
alter table public.profiles add constraint profiles_logo_path_chk check (
  logo_path is null
  or logo_path ~ ('^' || id::text || '/[A-Za-z0-9._-]{1,80}$')
  or logo_path ~ '^/sample/[a-z0-9-]{1,40}\.(png|jpg|webp)$');
grant update (logo_path) on public.profiles to authenticated;

alter table public.worker_profiles drop constraint worker_profiles_check;
alter table public.worker_profiles add constraint worker_profiles_check check (
  avatar_path is null
  or avatar_path ~ ('^' || user_id::text || '/[A-Za-z0-9._-]{1,80}$')
  or avatar_path ~ '^/sample/[a-z0-9-]{1,40}\.(png|jpg|webp)$');

-- admin_samples now also returns the pictures (logo_path for shops, avatar_path for workers): see 20261025 for the rest of the body.
create or replace function public.admin_samples() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not private.is_admin(auth.uid()) then raise exception 'FORBIDDEN'; end if;
  return jsonb_build_object(
    'shops', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.business_name, 'owner', p.full_name, 'address', p.address, 'city', p.city, 'logo_path', p.logo_path,
        'jobs', (select count(*) from jobs j where j.employer_id = p.id)) order by p.business_name)
      from profiles p where p.is_sample and 'employer' = any(p.roles)), '[]'::jsonb),
    'workers', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.full_name, 'city', p.city, 'birth_year', w.birth_year, 'avatar_path', w.avatar_path,
        'experience', w.experience, 'availability', w.availability,
        'applications', (select count(*) from applications a where a.seeker_id = p.id)) order by p.full_name)
      from profiles p left join worker_profiles w on w.user_id = p.id
      where p.is_sample and 'seeker' = any(p.roles)), '[]'::jsonb));
end $$;
