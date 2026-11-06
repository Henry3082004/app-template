# Đã áp dụng lên Supabase thật (16/10/2026)

Ba file migration được áp dụng thành nhiều phần nhỏ (`escrow_reputation_1a..1e`, `admin_payouts_a..b`, `escrow_admin_grants`) vì ứng dụng chặn các lệnh dài / có `drop`.
Khác biệt duy nhất so với file: hàm `public.reputations` được tạo thẳng bằng phiên bản cuối trong `20261018_reputation_integrity.sql`
(không chạy bản cũ của 20261016 rồi `drop`). Kết quả CSDL giống hệt chạy lần lượt 3 file.

18/10/2026: `20261018_free_mode.sql` áp dụng thành `free_mode_a_settings` + `free_mode_b_complete_shift`.
Dữ liệu: đóng 10 việc mẫu (status = closed) và khóa 8 tài khoản dùng thử (auth.users.banned_until = infinity) — hoàn tác được, không xóa.

18/10/2026: `20261019_multi_login.sql` áp dụng thành `multi_login_a_columns`, `multi_login_b_mark_existing_verified`, `multi_login_c_config_and_complete_profile`
(tách nhỏ; câu `update ... set verified = true` phải có `where verified = false` mới được chạy). Hàm `zalo-login` v3 dùng cột `verified`.

18/10/2026: `20261021_perf_admin_stats.sql` áp dụng thành `perf_rls_initplan` (15 `alter policy`), `perf_fk_indexes`, `admin_stats`.
Cố vấn hiệu năng Supabase hết cảnh báo WARN; chỉ còn INFO "unused index" cho các chỉ mục mới tạo.

19/10/2026: `20261022_seeker_profile.sql` áp dụng thành `seeker_profile_a_columns`, `seeker_profile_b_checks_grants`;
`20261022_avatars_storage.sql` áp dụng thành `avatars_storage` (bucket `avatars` công khai, ≤300 KB, chỉ chủ thư mục được thêm/xoá ảnh).

19/10/2026: `20261023_dual_role.sql` áp dụng thành `dual_role_1_roles`, `dual_role_2_worker_profiles`, `dual_role_2b_worker_grants`,
`dual_role_3_add_switch_role`, `dual_role_4_complete_profile`, `dual_role_5_submit_review`, `dual_role_6_role_reputations`,
`dual_role_7_admin_stats`, rồi `dual_role_8_move_worker_data` (chuyển dữ liệu + thu quyền, chạy cùng lúc đưa web mới lên).
Hàm `zalo-login` v4: tạo dòng `worker_profiles` cho người tìm việc mới. Các cột cũ trên `profiles` (bio, birth_year, experience,
availability, avatar_path) đã để trống và không ai ghi được — xoá hẳn khi tiện (`alter table public.profiles drop column …`).

19/10/2026: `20261024_worker_upsert_grant.sql` áp dụng thành `worker_upsert_grant` — sửa lỗi "permission denied for table
worker_profiles" khi lưu hồ sơ (upsert của PostgREST ghi cả cột user_id). Test upsert trong `70_dual_role.sql`.

20/10/2026: `20261025_sample_data.sql` áp dụng thành `sample_flag_columns`, `sample_flag_policies`, `sample_flag_admin_stats`,
`sample_flag_admin_samples_rpc`. Dữ liệu mẫu (10 quán, 10 nhân viên, 10 tin, đơn ứng tuyển) được chèn bằng SQL một lần (không nằm trong
file migration): quán `33333333-3333-4333-8333-0000000000NN`, nhân viên `44444444-4444-4444-8444-0000000000NN`, email
`mau.quanN@` / `mau.nvN@phone.viecthoivu.app`, tài khoản bị khoá đăng nhập (banned_until +100 năm). 8 tài khoản dùng thử cũ cũng được gắn `is_sample`.
Xoá hết mẫu: `delete from auth.users where id in (select id from public.profiles where is_sample)` (tin và đơn tự xoá theo).

20/10/2026: `20261026_shop_logo.sql` áp dụng thành `shop_logo_column`, `shop_logo_worker_sample_avatar`, `shop_logo_admin_samples_images`.
Ảnh logo 10 quán mẫu / ảnh đại diện 10 nhân viên mẫu nằm trong `public/sample/*.png` (vẽ bằng SVG, không phải ảnh thật);
đã gán bằng SQL một lần: `update profiles set logo_path = '/sample/shop-NN.png' …`, `update worker_profiles set avatar_path = '/sample/worker-NN.png' …`.

21/10/2026: `20261027_quick_quiz.sql` áp dụng thành `quick_quiz_1_table`, `quick_quiz_2_clean`, `quick_quiz_3_save_read`.
Test: `supabase/tests/80_quiz.sql`.

22/10/2026: `20261028_cash_paid.sql` áp dụng thành `cash_paid_1_column`, `cash_paid_2_rpc` — cột `applications.paid_cash_at` + hàm `mark_paid_cash` (quán ghi "đã trả tiền mặt", chế độ miễn phí). Test: `supabase/tests/90_cash_paid.sql`.

28/10/2026: `20261029_collab_notify_checkin.sql` áp dụng thành `collab_1_columns_table`, `collab_2_notify_trigger`, `collab_3_functions`
(thông báo trong app, chấm công đến/làm xong, người làm xác nhận đã nhận tiền mặt). Lưu ý: công cụ Supabase hỏi xác nhận khi gặp `drop trigger`, nên file dùng `create or replace trigger`.
Test: `supabase/tests/100_collab.sql`.

28/10/2026: `20261030_collab_chat_reports.sql` áp dụng thành `collab2_1_chat`, `collab2_2_reports`, `collab2_3_deletion_invites_grants`
(nhắn tin trong ca đã nhận, báo cáo người dùng, yêu cầu xóa tài khoản, mời làm lại). 4 bảng mới đều đóng (chỉ đi qua hàm). Test: `supabase/tests/110_collab2.sql`.

29/10/2026: `20261031_reminders.sql` áp dụng thành `reminders_1_function`, `reminders_2_schedule` (pg_cron `vtv-reminders`, mỗi giờ phút 05), `reminders_3_skip_samples` (bỏ qua tài khoản mẫu).
Nhắc việc: tối hôm trước (từ 17:00), sáng ngày làm (từ 06:00), quán chưa xác nhận ca (từ 08:00, một lần), nhắc đánh giá sau 1 đến 7 ngày (từ 09:00, một lần mỗi bên). Test: `supabase/tests/120_reminders.sql`.

01/11/2026: `20261101_find_workers.sql` áp dụng thành `find_workers` (cột `worker_profiles.discoverable` mặc định tắt, `set_discoverable`, `my_discoverable`, `search_workers`, `invite_worker` cho người đã bật). Anon không gọi được. Test: `supabase/tests/130_find_workers.sql`.

01/11/2026: `20261102_contacts_lockdown.sql` áp dụng thành `contacts_lockdown`. Người dùng và khách không còn ghi được bảng `contacts` (trước đó tự đặt được `verified`/`phone`, có thể chiếm số điện thoại của người khác khi đăng nhập Zalo). App chỉ đọc bảng này. Test: `supabase/tests/140_contacts_lockdown.sql`.

01/11/2026: `20261103_home_highlights.sql` áp dụng thành `home_highlights` (hàm công khai trả số đếm tổng hợp + tin tức cho banner trang chủ; không có thông tin cá nhân; bỏ qua tin/tài khoản mẫu). Test: `supabase/tests/150_home_highlights.sql`.
Đổi tin tức trên banner (không cần code): sửa dòng `home_news` trong `app_settings`, là một mảng JSON `[{"title","sub","url","source"}]`; chỉ nhận link https, tối đa 6 tin, tiêu đề không được trống.

01/11/2026: `20261104_saved_jobs.sql` áp dụng thành `saved_jobs` (bảng "Việc đã lưu": mỗi người chỉ đọc/thêm/xóa của mình; khách chưa đăng nhập không truy cập được). Test: `supabase/tests/160_saved_jobs.sql`.

01/11/2026: `20261105_capy_ai.sql` áp dụng thành `capy_ai` (bảng `ai_usage` đếm lượt hỏi Capy, hàm `ai_hit` chỉ máy chủ gọi được, `app_config` thêm `ai_assistant`, cài `ai_assistant='off'`, giới hạn `ai_cap_guest=15`, `ai_cap_user=40`, `ai_cap_total=3000` lượt/ngày). Test: `supabase/tests/170_capy_ai.sql`.
Edge function `capy-assistant` (Google Gemini, mặc định `gemini-2.5-flash`, đổi model bằng dòng `ai_model` trong `app_settings`; `supabase/functions/capy-assistant/index.ts`) đã triển khai. Cần secret `GEMINI_API_KEY`; bật bằng `update app_settings set value='on' where key='ai_assistant'`.

31/10/2026: `20261106_zalo_links.sql` áp dụng thành `zalo_links` (bảng `zalo_links`: mã người dùng Zalo ↔ tài khoản, ghi bởi `zalo-login` mỗi lần đăng nhập Zalo; bảng `zalo_revokes`: nhật ký sự kiện rút đồng ý; cả hai chỉ máy chủ đọc/ghi). Test: `supabase/tests/180_zalo_links.sql`.
Edge function `zalo-webhook` (Webhook URL của Mini App: `https://niscqjczfvipxxgdslqs.supabase.co/functions/v1/zalo-webhook`) đã triển khai: kiểm tra chữ ký `X-ZEvent-Signature` (sha256 các giá trị theo thứ tự tên khóa + API Key), sự kiện `user.revoke.consent` → tạo yêu cầu xóa tài khoản (quản trị xử lý trong 7 ngày). Cần secret `ZALO_API_KEY` (API Key của Open API Mini App). `zalo-login` v6 ghi mã Zalo vào `zalo_links`. `signup` v5: đăng ký SĐT + mật khẩu (SĐT chưa xác thực).

31/10/2026: `20261107_zalo_revokes_verified.sql` thêm cột `zalo_revokes.verified`. `zalo-webhook` v2: chưa có secret `ZALO_API_KEY` (Zalo chưa cấp key Open API) thì vẫn nhận sự kiện nhưng đánh dấu CHƯA kiểm tra chữ ký (cả yêu cầu xóa lẫn nhật ký) — quản trị liên hệ người dùng trước khi xóa; có key thì sai chữ ký bị từ chối (401).

01/11/2026: bốn migration áp dụng lên Supabase thật (kiểm tra trước trên Postgres cục bộ bằng `supabase/tests/run.sh`):
- `20261108_commitments.sql` (áp thành `commitments`, rồi `backup_reset_search_path`): cột mới trên `applications` (`confirmed_at`, `is_backup`, `unpaid_reported_at`, `cancelled_at`, `cancel_late`, `as_posted`); hàm `confirm_attendance` ("Tôi vẫn đến"), `set_backup` (người dự bị = đơn đang chờ, không chiếm chỗ), `cancel_hire` (quán hủy người đã nhận; hủy từ ngày làm việc trở đi tính là hủy sát giờ), `report_unpaid`, `my_apply_lock`, `trust_signals`; trigger khóa ứng tuyển 7 ngày khi vắng ca 2 lần trong 30 ngày (`APPLY_LOCKED`); `private.send_commit_alerts` chạy mỗi giờ phút 15 (nhắc xác nhận, báo quán người chưa xác nhận, tin 12 giờ chưa ai ứng tuyển, đơn quá 24 giờ chưa trả lời, đóng tin hết hạn). Test: `190_commitments.sql`.
- `20261109_trust_safety.sql` (`trust_safety`): `jobs.held_reason`/`vetted`; tin chứa cụm trong `app_settings.suspicious_words` (cách nhau dấu phẩy, sửa được không cần code) bị giữ lại để quản trị duyệt (`admin_held_jobs`, `admin_review_job`); hai người báo "không đúng như tin đăng" (`mark_as_posted`) cũng giữ tin; báo cáo "mất tài sản" (lưu lý do `other` + tiền tố `[lost_property]`) tạm khóa người bị báo 3 ngày (bảng đóng `account_holds`, kết thúc khi quản trị xử lý báo cáo); `worker_notes` (nhận xét quán trước về người làm). Test: `200_trust_safety.sql`.
- `20261110_hiring_tools.sql` (`hiring_tools`): hướng dẫn công việc (`job_guides`, chỉ quán và người đã nhận đọc, gửi thông báo khi được nhận), thỏa thuận ca (`agree_shift`), mã giới thiệu (`referral_codes`, `referrals`, `boosts`; `redeem_referral` chỉ cho tài khoản mới trong 7 ngày; cả hai bên được đẩy tin lên đầu 7 ngày qua `jobs.boosted_until`, xóa mỗi giờ phút 25 bởi `private.expire_boosts`). Test: `210_hiring_tools.sql`.
- `20261111_admin_kpis.sql` (`admin_kpis`): chỉ số cho trang quản trị (tin có người ứng tuyển trong 24 giờ, quán quay lại, ca hoàn thành mỗi tuần, tỉ lệ vắng ca, thời gian quán trả lời). Test: `220_admin_kpis.sql`.
Lưu ý: công việc chưa có giờ trong ngày (chỉ có ngày bắt đầu/kết thúc), nên "Tôi vẫn đến" mở từ hôm trước và nhắc lúc 08:00; quán được báo lúc 09:00 ngày làm việc nếu người làm chưa xác nhận.

02/11/2026: `20261112_job_tasks.sql` áp dụng thành `job_tasks` (cột `jobs.tasks text[]` công khai, cấp quyền ghi cho cột này, trigger `jobs_tasks` chuẩn hóa: cắt khoảng trắng, bỏ rỗng và trùng, 60 ký tự, tối đa 12; `jobs_screen` đọc cả đầu việc). Test: `supabase/tests/230_job_tasks.sql`.

03/11/2026: `20261113_abuse_limits.sql` áp dụng thành `abuse_limits` (tổng lượt mỗi ngày của `ai_hit` chỉ tính các khóa cùng loại: `u:` người đã đăng nhập, `g:` khách, `su:` đăng ký; nên đăng ký hàng loạt không làm tắt Capy). Hàm `signup` và `capy-assistant` deploy lại: lấy IP thật (`cf-connecting-ip` hoặc phần tử cuối của `x-forwarded-for`), khách Capy tính theo IP, 5 lượt/ngày/IP, tổng khách 500/ngày (`ai_cap_guest_total`). Danh sách việc mở tải tối đa 100 tin. Test: `supabase/tests/170_capy_ai.sql`.

03/11/2026: `20261114_service_fees.sql` áp dụng thành `service_fees` (phí dịch vụ mỗi người, mỗi ca hoàn thành: `app_settings.fee_per_shift=12000`, ưu đãi `fee_voucher_pct=100`, `fee_voucher_name='Ưu đãi ra mắt'`; bảng sổ `service_fees` ghi khi ca chuyển sang `released`, giữ mức phí lúc đó; hàm `fee_plan`, `my_fees`, `admin_fees`, `admin_set_fee`). Không thu tiền thật. Test: `supabase/tests/240_service_fees.sql`.

03/11/2026: `20261115_consents.sql` áp dụng thành `consents` (bảng `consents` ghi bằng chứng đồng ý: `terms` khi đăng ký, `location` khi chấm công; hàm `record_consent`, `my_consents`, `admin_consent_stats`). Ứng dụng thêm ô tick đồng ý khi đăng ký, hộp hỏi vị trí trước lần chấm công đầu, chính sách cập nhật theo Luật 91/2025. Test: `supabase/tests/250_consents.sql`.

03/11/2026: `20261116_admin_modes.sql` áp dụng thành `admin_modes` (hàm `private.is_sample`; tài khoản mẫu nhìn thấy tin và quán mẫu khác; `app_settings.demo_employer/demo_seeker`; lịch sử mẫu cho quán "Nhà hàng Mộc" và người làm "Nguyễn Thị Lan": 4 ca đã hoàn thành có đánh giá hai chiều, 1 ca sắp tới đã nhận, 2 đơn đang chờ; hàm `demo_account` chỉ service role gọi được). Hàm biên `admin-switch` deploy (chỉ admin thật, chỉ mở được tài khoản `is_sample`). Hồ sơ → "Chế độ xem (quản trị)": Người dùng mới / Nhà tuyển dụng / Người tìm việc / Quản trị. Test: `supabase/tests/260_admin_modes.sql`.

04/11/2026: `20261117_accounting_feed.sql` áp dụng thành `accounting_feed` (hàm `acct_daily` trả tổng theo ngày giờ Việt Nam: quán mới, người làm mới, ca hoàn thành, phí niêm yết, ưu đãi, phí phải thu; bỏ tài khoản mẫu; chỉ service role gọi được. Hàm `acct_sync_key` đọc khóa ngẫu nhiên trong vault `acct_sync_key`; `app_settings.acct_sheet_id` = file Google Sheets kế toán; pg_cron `vtv-accounting-sync` chạy phút 20 mỗi giờ). Hàm biên `accounting-sync` deploy (verify_jwt tắt, tự kiểm tra khóa `x-sync-key`): ghi tab Metrics và bút toán `AUTO-YYYY-MM-DD` (Nợ 1100 / Có 4000) vào Journal; chỉ ghi số tổng, không có tên, số điện thoại, e-mail. Chưa có khóa Google nên trả `NOT_CONFIGURED` và không làm gì. Cần Secret `GOOGLE_SA_JSON` (Henry tự thêm trong dashboard Supabase) và chia sẻ file cho e-mail của tài khoản dịch vụ với quyền Editor. Không thu tiền thật, không đọc thanh toán. Test: `supabase/tests/270_accounting_feed.sql`.


### 06/11/2026
`20261118_direct_pay.sql` áp dụng thành `direct_pay` (Henry cho phép). Thêm `choose_direct_pay` (chỉ chủ ca, chỉ ca đã nhận chưa nạp tiền; anon bị thu quyền), cập nhật `complete_shift`, `fund_application`, `private.is_funded_pair` để hiểu `funding_mode='off'` theo từng ca. Không đổi payment_mode, không tạo payout. Test cục bộ `supabase/tests/280_direct_pay.sql` (Codex chạy, tôi chưa chạy lại).
