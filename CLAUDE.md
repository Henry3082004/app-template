# Quy ước cho Claude trong repo này

Đây là **repo chung chứa mọi app** của Henry. Mỗi app nằm trong một thư mục `apps/<slug>/`; phần gốc
repo là quy tắc và quy trình dùng chung. Henry không phải lập trình viên — nói tiếng Việt, ngắn gọn,
giải thích bằng ngôn ngữ thường.

## Quy tắc số 1: spec trước, code sau

- Henry muốn tạo app mới → **chạy skill `/tao-app`** (tạo thư mục `apps/<slug>/`). Skill chỉ hỏi vài
  câu, tự ghi spec, viết prompt thiết kế, rồi build và gửi link luôn — không dừng chờ duyệt.
- `apps/<slug>/APP_SPEC.md` là nguồn sự thật cho mọi quyết định của app đó về người dùng, luồng, bố
  cục, hình ảnh, cảm giác khi bấm và giọng văn. Code đi ngược spec là lỗi, kể cả khi "trông đẹp hơn".
- Henry đổi ý → sửa APP_SPEC.md của app trước, rồi mới sửa code.
- Đang làm app nào thì chỉ sửa thư mục của app đó (và quy tắc chung ở gốc khi Henry yêu cầu).

## Trước mỗi việc lớn

Nêu cho Henry: model nên dùng, mức effort, thời gian ước tính, có vừa một phiên làm việc không.

## Theo dõi tiến độ

Mỗi app có `apps/<slug>/PROGRESS.md`: đang ở đâu, xong gì, đang chờ gì, chờ ai, link và tên các
dịch vụ đang chạy. Cập nhật sau mỗi bước quan trọng — phiên cloud không giữ lại gì ngoài repo.

## Kiểm tra trước khi báo "xong"

- Chạy test/typecheck/build của app.
- Giao diện: chạy app thật, chụp màn hình ở kích thước điện thoại bằng Playwright, đối chiếu với
  APP_SPEC.md (số lần chạm luồng chính, vị trí nút chính, màu, câu chữ). Theo dõi lỗi console.
- Mọi class CSS dùng trong code phải thực sự được định nghĩa (đã từng gặp: dùng class kiểu Tailwind
  khi dự án không cài Tailwind → toàn bộ class vô tác dụng mà không báo lỗi).
- Không phụ thuộc font/icon/ảnh tải từ CDN bên ngoài cho những thứ người dùng phải thấy, trừ khi
  đã kiểm tra chắc chắn tải được.
- Deploy xong phải xem log deploy xác nhận app khởi động sạch, không chỉ dựa vào trạng thái build.
- Khóa bí mật (API key, token, mật khẩu) không bao giờ vào code hay commit.
