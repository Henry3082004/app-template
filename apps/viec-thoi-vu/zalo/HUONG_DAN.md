# Đưa Việc Thời Vụ lên Zalo Mini App

Mini App của bạn: **Capi việc làm 30s** — ID `2847107362388346804` (xem tại mini.zalo.me → ứng dụng của bạn).
Thư mục này (`zalo/`) đã đóng gói sẵn app thành bản Zalo (cùng code với bản web). Bước đưa lên Zalo cần
tài khoản Zalo của bạn nên bạn tự chạy trên **máy tính** (có Node.js 18+); tablet/điện thoại không chạy được.

## A. Làm một lần trên Zalo Developer (làm được trên tablet)
1. Vào trang quản lý Mini App → **Cấu hình ứng dụng → Cấu hình API Domains**, thêm các tên miền sau
   (app chỉ gọi được những miền đã khai báo):
   - `niscqjczfvipxxgdslqs.supabase.co` (database + đăng nhập)
   - `o4511828136493056.ingest.us.sentry.io` (báo lỗi)
   - `fonts.googleapis.com`, `fonts.gstatic.com` (phông chữ; thiếu thì app dùng phông hệ thống, vẫn chạy)
2. **Thông tin ứng dụng**: tên, mô tả ngắn, biểu tượng (dùng `public/icon-512.png`), danh mục.

## B. Đưa bản app lên (máy tính)
```bash
# 1. Lấy code: tải ZIP repo app-template từ GitHub (hoặc git clone), mở thư mục apps/viec-thoi-vu
cd apps/viec-thoi-vu
npm install                 # cài thư viện của app
cd zalo
npm install                 # cài zmp-cli
cp .env.example .env        # đã điền sẵn APP_ID; KHÔNG chia sẻ/commit file .env
npx zmp login               # hiện mã QR → quét bằng Zalo → lưu ZMP_TOKEN vào .env
npm run build               # thử đóng gói → tạo thư mục www/
npm run deploy              # tải lên Zalo → in ra mã QR/liên kết để mở thử
```
- Mở thử: quét QR do `deploy` in ra, hoặc trong trang quản lý chọn **Tạo mã QR** → mở bằng Zalo trên điện thoại.
- Muốn công khai: trang quản lý → **Yêu cầu xét duyệt phiên bản** → chọn phiên bản vừa deploy → gửi duyệt.
  (Zalo có thể yêu cầu xác minh tài khoản/doanh nghiệp và tự duyệt nội dung — làm theo màn hình của họ.)

## C. Chưa làm (cần App Secret của Zalo)
- Nút **Tiếp tục với Zalo** (đăng nhập bằng Zalo thật, lấy tên + số điện thoại). Hiện bản Zalo vẫn dùng
  đăng nhập bằng số điện thoại + mật khẩu và nút dùng thử. Khi cần, nhắn Claude "bật đăng nhập Zalo".
  **App Secret không dán lên chat** — sẽ cất ở Supabase (Edge Function secrets).
