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
