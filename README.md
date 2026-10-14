# app-template — repo chung cho mọi app

Mọi app của Henry nằm trong repo này, mỗi app một thư mục `apps/<tên-app>/`. Phần gốc là quy tắc và
quy trình dùng chung. Sơ đồ quy trình đầy đủ: [`QUY_TRINH.md`](QUY_TRINH.md).

## Cách dùng

1. Mở repo này trong Claude Code, gõ **`/tao-app`**. Claude tự tạo thư mục cho app mới.
2. Trả lời: **app là gì**, **ai dùng, dùng để làm gì**.
3. Bấm chọn **màu sắc**, **phong cách**, **chạy ở đâu** (Web / Zalo Mini App / Cả hai) và **có bán
   không**. Mọi app đều theo phong cách nền: nhẹ nhàng, dễ chịu, đơn giản mà đầy đủ, bo tròn góc.
4. Claude làm liền một mạch: viết spec và prompt thiết kế, build, tự kiểm tra, deploy.
5. Bạn nhận **link app chạy được**, bản tóm tắt và prompt thiết kế (có bán: thêm landing page, bảng
   giá và tài liệu đăng bán).
6. Muốn sửa gì cứ nhắn, Claude sửa spec trước rồi sửa app.

## App hiện có

| App | Thư mục | Trạng thái |
|---|---|---|
| Việc Thời Vụ — tìm việc làm thời vụ | `apps/viec-thoi-vu/` | Đang build |

## Nội dung phần chung

| File | Vai trò |
|---|---|
| `.claude/skills/tao-app/SKILL.md` | Câu hỏi và các mặc định Claude tự áp của `/tao-app` |
| `APP_SPEC.template.md` | Mẫu đặc tả app |
| `CLAUDE.md` | Quy ước Claude phải theo trong repo này |
| `QUY_TRINH.md` | Sơ đồ quy trình tạo app |
| `TU_SUA_LOI.md` | Cách bật lịch tự sửa lỗi từ Sentry (máy tắt vẫn chạy) |
| `BAN_APP.md` | Việc thiết lập một lần để bán app (thanh toán, store) + danh sách đã thiết lập |

Trong mỗi thư mục app: code, `APP_SPEC.md`, `DESIGN_PROMPT.md`, `PROGRESS.md`, và `ban/` (nếu bán).
