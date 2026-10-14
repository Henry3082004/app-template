# Quy ước cho Claude khi làm app trong repo này

Repo này được tạo từ `app-template` của Henry. Người viết app không phải lập trình viên — nói tiếng
Việt, ngắn gọn, giải thích bằng ngôn ngữ thường.

## Quy tắc số 1: spec trước, code sau

- Chưa có `APP_SPEC.md` ở gốc repo → **chạy skill `/tao-app`**. Skill này chỉ hỏi người viết 2 câu,
  tự ghi spec, viết prompt thiết kế, rồi build và gửi link luôn — không dừng chờ duyệt.
- `APP_SPEC.md` là nguồn sự thật cho mọi quyết định về người dùng, luồng, bố cục, hình ảnh, cảm
  giác khi bấm và giọng văn. Code đi ngược spec là lỗi, kể cả khi "trông đẹp hơn".
- Người viết đổi ý → sửa `APP_SPEC.md` trước, rồi mới sửa code.

## Trước mỗi việc lớn

Nêu cho người viết: model nên dùng, mức effort, thời gian ước tính, có vừa một phiên làm việc không.

## Theo dõi tiến độ

Duy trì `PROGRESS.md` ở gốc repo: đang ở đâu, xong gì, đang chờ gì, chờ ai. Cập nhật sau mỗi
bước quan trọng (merge PR, đổi quyết định) — phiên làm việc trên cloud không giữ lại gì ngoài repo.

## Kiểm tra trước khi báo "xong"

- Chạy test/typecheck của dự án.
- Giao diện: chạy app thật, chụp màn hình ở kích thước điện thoại bằng Playwright, đối chiếu với
  `APP_SPEC.md` (số lần chạm luồng chính, vị trí nút chính, màu, câu chữ). Theo dõi lỗi console.
- Mọi class CSS dùng trong code phải thực sự được định nghĩa (đã từng gặp: dùng class kiểu Tailwind
  khi dự án không cài Tailwind → toàn bộ class vô tác dụng mà không báo lỗi).
- Không phụ thuộc font/icon/ảnh tải từ CDN bên ngoài cho những thứ người dùng phải thấy, trừ khi
  đã kiểm tra chắc chắn tải được.
- Deploy xong phải xem log deploy xác nhận app khởi động sạch, không chỉ dựa vào trạng thái build.
