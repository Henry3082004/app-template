-- Zalo Mini App "user rút lại sự đồng ý và xoá dữ liệu" (Nghị định 13): Zalo calls our webhook with the user's Zalo id (userId).
-- zalo_links remembers which Zalo id belongs to which account (written by zalo-login at every Zalo sign-in);
-- zalo_revokes keeps a record of every revoke event and what was done with it (a deletion request, or "no account known").
-- Both are server-only: no policies, nothing granted to anon/authenticated.

create table if not exists public.zalo_links (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  zalo_id text not null unique check (char_length(zalo_id) between 1 and 64),
  linked_at timestamptz not null default now()
);
alter table public.zalo_links enable row level security;
revoke all on public.zalo_links from anon, authenticated;

create table if not exists public.zalo_revokes (
  id uuid primary key default gen_random_uuid(),
  zalo_id text not null check (char_length(zalo_id) between 1 and 64),
  user_id uuid,
  outcome text not null check (outcome in ('request_created', 'request_open', 'no_account')),
  received_at timestamptz not null default now()
);
alter table public.zalo_revokes enable row level security;
revoke all on public.zalo_revokes from anon, authenticated;
