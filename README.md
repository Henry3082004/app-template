# app-template

Khung chung để tạo app mới nhanh và đúng ý người viết.

## Cách dùng

1. Trên GitHub, bấm **Use this template → Create a new repository** để tạo repo cho app mới.
2. Mở repo mới trong Claude Code, gõ **`/tao-app`**.
3. Claude chỉ hỏi 2 điều: **app là gì**, và **ai dùng, dùng để làm gì**.
4. Claude làm liền một mạch, không dừng chờ duyệt:
   - tự quyết luồng, bố cục, màu, cảm giác khi bấm, giọng văn và ghi vào `APP_SPEC.md`;
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
