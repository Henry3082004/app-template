-- Numbers and news for the home banner. Only aggregates (counts) and links an admin chose: no names, phones or other personal data.
-- News lives in app_settings key `home_news` (a JSON array of {title, sub, url, source}); only https links are passed on, at most 6.
-- Readable by anyone (visitors see the banner before signing in). Sample accounts' jobs and profiles are never counted.

create or replace function public.home_highlights() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare news jsonb := '[]'::jsonb; raw jsonb;
begin
  begin
    raw := coalesce((select value::jsonb from public.app_settings where key = 'home_news'), '[]'::jsonb);
    select coalesce(jsonb_agg(item), '[]'::jsonb) into news from (
      select jsonb_build_object('title', left(coalesce(e->>'title', ''), 120), 'sub', left(coalesce(e->>'sub', ''), 160),
                                'url', e->>'url', 'source', left(coalesce(e->>'source', ''), 40)) item
      from jsonb_array_elements(case when jsonb_typeof(raw) = 'array' then raw else '[]'::jsonb end) e
      where coalesce(e->>'url', '') ~ '^https://[^ ]+$' and coalesce(e->>'title', '') <> ''
      limit 6
    ) s;
  exception when others then news := '[]'::jsonb;
  end;
  return jsonb_build_object(
    'open_jobs', (select count(*) from public.jobs where status = 'open' and not is_sample),
    'new_jobs_7d', (select count(*) from public.jobs where status = 'open' and not is_sample and created_at > now() - interval '7 days'),
    'urgent_jobs', (select count(*) from public.jobs where status = 'open' and not is_sample and is_urgent),
    'top_city', (select jsonb_build_object('name', c, 'n', n) from (select city c, count(*) n from public.jobs where status = 'open' and not is_sample and coalesce(city, '') <> '' group by city order by count(*) desc, city limit 1) t),
    'top_category', (select jsonb_build_object('name', c, 'n', n) from (select category c, count(*) n from public.jobs where status = 'open' and not is_sample and coalesce(category, '') <> '' group by category order by count(*) desc, category limit 1) t),
    'ready_workers', (select count(*) from public.worker_profiles w join public.profiles p on p.id = w.user_id where w.discoverable and not p.is_sample),
    'news', news);
end $$;
revoke all on function public.home_highlights() from public;
grant execute on function public.home_highlights() to anon, authenticated;

-- first news items: headlines found by a web search (not yet opened and read by us) — replace in app_settings when you pick better ones
insert into public.app_settings (key, value) values ('home_news', '[
 {"title":"Tuyển dụng TPHCM cận Tết 2026 dự kiến nhu cầu lên tới 30.000 vị trí","sub":"Bài báo về nhu cầu tuyển dụng dịp cận Tết ở TP.HCM.","url":"https://voh.com.vn/kinh-te/tuyen-dung-tphcm-can-tet-2026-du-kien-nhu-cau-len-toi-30000-vi-tri-630672.html","source":"VOH"},
 {"title":"Thị trường lao động 2026 khởi sắc","sub":"Tin về xu hướng thị trường lao động năm 2026.","url":"https://vneconomy.vn/thi-truong-lao-dong-2026-khoi-sac-nhan-luc-chat-luong-cao-duoc-san-don.htm","source":"VnEconomy"}
]') on conflict (key) do nothing;
