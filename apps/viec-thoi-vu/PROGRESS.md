# PROGRESS — Việc Thời Vụ

## Trạng thái: Bản đầu đã build (15/10/2026)

**Link:** https://viec-thoi-vu.vercel.app (Vercel project `viec-thoi-vu`, tự build từ `main` khi Claude gọi deploy) · **Database:** Supabase `niscqjczfvipxxgdslqs` · **Lỗi:** Sentry `sago-k5/javascript-react`, lọc tag `app:viec-thoi-vu`

### Đã xong
- Database: bảng profiles/contacts/jobs/applications, RLS từng dòng, giới hạn gói Miễn phí (2 tin) và nhãn Gấp chỉ Pro kiểm tra trong database; hàm `decide_application`, `withdraw_application`, `mark_applications_seen`; edge function `signup` (đăng ký bằng SĐT + mật khẩu).
- Giao diện dùng design system (`src/ds/`: tokens.css + bundle.css, nguồn: Claude Design). Sửa màu/kiểu ở tokens.json rồi sinh lại tokens.css.
- Giao diện web (React + Vite, tiếng Việt/Anh): Việc làm (lọc, tìm, sắp theo khoảng cách), Chi tiết + Ứng tuyển, bảng đăng nhập trượt lên (có nút dùng thử), Đã ứng tuyển (rút đơn, SĐT khi được nhận), Tin của tôi, Đăng tin (tự điền theo tin trước), Ứng viên (Nhận/Từ chối, gọi/nhắn Zalo), Bảng giá, Tài khoản.
- Landing `/`, trang pháp lý `/dieu-khoan` `/bao-mat` `/hoan-tien`, PWA (manifest, icon, service worker), `ban/`.
- Kiểm tra: Playwright 23 bước trên bản mock (`npm run build:mock`) — không lỗi console.

### Cách chạy
- `npm install` → `npm run dev` (dùng Supabase thật) · `npm run build:mock && npx vite preview --mode mock` (dữ liệu giả, không cần mạng).
- Tài khoản dùng thử: người tìm việc `0900000001` / `demo-tim-viec`; nhà tuyển dụng `0900000002` / `demo-tuyen-dung`.

### Lưu ý kỹ thuật
- Môi trường cloud của Claude không gọi được `*.supabase.co`, nên test UI chạy trên mock API (`src/lib/mockApi.ts`) mô phỏng đúng luật của database; luật database được test riêng bằng SQL.
- Sentry: tổ chức không cho thành viên tạo project mới → dùng chung project, gắn tag `app`.
- Còn sót 1 tài khoản test `84912345678` (Người Thử) trong Supabase — xóa khi tiện.

### Việc tiếp theo
- [ ] Thanh toán thật (cần tài khoản PayOS/SePay + Lemon Squeezy — BAN_APP.md B1, B2).
- [ ] Email hỗ trợ công khai cho trang pháp lý (`VITE_SUPPORT_EMAIL`).
- [ ] Bật "Leaked password protection" trong Supabase Dashboard → Auth.
- [ ] Zalo App ID (Z1) → đăng nhập Zalo.
