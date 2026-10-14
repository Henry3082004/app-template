# app-template

Khung chung để tạo app mới nhanh và đúng ý người viết.

## Cách dùng

Sơ đồ đầy đủ: [`QUY_TRINH.md`](QUY_TRINH.md).

1. Trên GitHub, bấm **Use this template → Create a new repository** để tạo repo cho app mới.
2. Mở repo mới trong Claude Code, gõ **`/tao-app`**.
3. Claude chỉ hỏi: **app là gì**, **ai dùng, dùng để làm gì**, rồi cho bấm chọn **màu sắc,
   phong cách** và **chạy ở đâu** (Web / Zalo Mini App / Cả hai). Mọi app đều theo phong cách nền: nhẹ nhàng, dễ chịu, đơn giản
   mà đầy đủ, bo tròn góc.
4. Claude làm liền một mạch, không dừng chờ duyệt:
   - tự quyết luồng, bố cục, cảm giác khi bấm, giọng văn và ghi vào `APP_SPEC.md`;
   - viết `DESIGN_PROMPT.md`;
   - build, tự kiểm tra bằng ảnh chụp màn hình.
5. Bạn nhận **link web app chạy được**, kèm bản tóm tắt và prompt thiết kế. Muốn giao diện đẹp hơn
   thì dán prompt vào Claude Design rồi gửi kết quả lại để Claude chỉnh app theo.
6. Muốn sửa gì cứ nhắn, Claude sửa spec trước rồi sửa app.

## Nội dung repo

| File | Vai trò |
|---|---|
| `.claude/skills/tao-app/SKILL.md` | Câu hỏi và các mặc định Claude tự áp của `/tao-app` |
| `APP_SPEC.template.md` | Mẫu đặc tả app |
| `DESIGN_PROMPT.md` (tạo khi chạy `/tao-app`) | Prompt bạn tự gửi Claude Design, sinh ra từ `APP_SPEC.md` |
| `CLAUDE.md` | Quy ước Claude phải theo trong mọi app tạo từ template này |
| `QUY_TRINH.md` | Sơ đồ quy trình tạo app |
| `TU_SUA_LOI.md` | Cách bật lịch tự sửa lỗi từ Sentry (máy tắt vẫn chạy) |
| `BAN_APP.md` | Việc thiết lập một lần để bán app (thanh toán, store) + danh sách đã thiết lập |
