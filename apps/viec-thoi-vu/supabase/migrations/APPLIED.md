# Đã áp dụng lên Supabase thật (16/10/2026)

Ba file migration được áp dụng thành nhiều phần nhỏ (`escrow_reputation_1a..1e`, `admin_payouts_a..b`, `escrow_admin_grants`) vì ứng dụng chặn các lệnh dài / có `drop`.
Khác biệt duy nhất so với file: hàm `public.reputations` được tạo thẳng bằng phiên bản cuối trong `20261018_reputation_integrity.sql`
(không chạy bản cũ của 20261016 rồi `drop`). Kết quả CSDL giống hệt chạy lần lượt 3 file.

18/10/2026: `20261018_free_mode.sql` áp dụng thành `free_mode_a_settings` + `free_mode_b_complete_shift`.
Dữ liệu: đóng 10 việc mẫu (status = closed) và khóa 8 tài khoản dùng thử (auth.users.banned_until = infinity) — hoàn tác được, không xóa.
