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
