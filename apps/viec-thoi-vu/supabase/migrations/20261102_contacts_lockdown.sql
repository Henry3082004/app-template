-- contacts.verified means "this phone was proven by Zalo" and zalo-login signs people in by it. Until now any signed-in user could
-- write contacts directly (phone, verified), so they could mark someone else's number as verified and capture that person's Zalo login.
-- The app only READS contacts from the browser; accounts and phones are written by complete_profile (security definer) and the
-- zalo-login edge function (service role). So signed-in users and visitors keep read access only.
revoke insert, update, delete, truncate, references, trigger on public.contacts from authenticated, anon;
