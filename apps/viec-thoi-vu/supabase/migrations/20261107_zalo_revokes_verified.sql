-- Until Zalo issues the Mini App's Open API key (secret ZALO_API_KEY), zalo-webhook cannot check signatures. It still records
-- revoke events and opens deletion requests, marked as unverified, so the admin confirms with the person before deleting anything.
alter table public.zalo_revokes add column if not exists verified boolean not null default true;
