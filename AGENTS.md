# Hướng dẫn cho trợ lý AI (Codex và các công cụ khác)

Tệp này dành cho công cụ không đọc `CLAUDE.md`. Nội dung chính nằm ở hai tệp dưới, đọc theo thứ tự:

1. `CLAUDE.md` (gốc repo): quy ước chung. Spec trước, code sau; kiểm tra trước khi báo "xong"; không đưa khóa bí mật vào code.
2. `apps/viec-thoi-vu/HANDOFF.md`: bàn giao app Capi (đang làm): môi trường, quy tắc bắt buộc, việc đang chờ.
   Tiến độ chi tiết ở `apps/viec-thoi-vu/PROGRESS.md`, spec ở `apps/viec-thoi-vu/APP_SPEC.md`.

Tóm tắt cần nhớ:
- Henry không phải lập trình viên: trả lời tiếng Việt, ngắn, dùng ngôn ngữ thường.
- Chỉ sửa thư mục của app đang làm (`apps/<slug>/`). Code Capi nằm ở `apps/viec-thoi-vu`, nhánh `main` tự deploy lên Vercel.
- Không commit khóa, mật khẩu, file CCCD; không commit `supabase/functions/zalo-oa-webhook/`. Không xin Henry dán khóa vào chat.
- Thanh toán đang TẮT; không bật khi chưa có ý kiến luật sư và Henry xác nhận.
- Trước khi báo xong: chạy `npm test` trong `apps/viec-thoi-vu` (tsc, eslint, kiểm tra CSS, Playwright).
- Công cụ Supabase, Vercel, Google Sheets là kết nối riêng của Claude; Codex có thể không có, khi đó nhờ Henry chạy giúp hoặc dùng CLI tương ứng.
