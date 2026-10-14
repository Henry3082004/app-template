# app-template

Khung chung để tạo app mới nhanh và đúng ý người viết.

## Cách dùng

1. Trên GitHub, bấm **Use this template → Create a new repository** để tạo repo cho app mới.
2. Mở repo mới trong Claude Code, gõ **`/tao-app`**.
3. Claude hỏi lần lượt 6 nhóm câu hỏi:
   1. **Người dùng**: có mấy loại, mỗi loại dùng app để làm gì.
   2. **Luồng chính**: từ lúc mở app đến lúc xong việc, càng ít bước càng tốt.
   3. **Bố cục và nút bấm**: đặt ở đâu cho dễ bấm nhất.
   4. **Hình ảnh**: màu sắc, phong cách, ảnh và icon.
   5. **Cảm giác khi bấm**: rung, hiệu ứng, cách báo thành công.
   6. **Giọng giao tiếp**: xưng hô, cách hướng dẫn, cách báo lỗi.
4. Câu trả lời được ghi vào `APP_SPEC.md`. Bạn chốt xong, Claude viết `DESIGN_PROMPT.md`, một
   prompt để bạn copy gửi Claude Design vẽ giao diện. Có spec và thiết kế rồi mới bắt đầu build.

## Nội dung repo

| File | Vai trò |
|---|---|
| `.claude/skills/tao-app/SKILL.md` | Bộ câu hỏi và cách hỏi của `/tao-app` |
| `APP_SPEC.template.md` | Mẫu đặc tả app, được điền sau khi hỏi xong |
| `DESIGN_PROMPT.md` (tạo sau khi chốt) | Prompt gửi Claude Design, sinh ra từ `APP_SPEC.md` |
| `CLAUDE.md` | Quy ước Claude phải theo trong mọi app tạo từ template này |
