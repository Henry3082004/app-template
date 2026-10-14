# app-template

Khung chung để tạo app mới nhanh và đúng ý người viết.

## Cách dùng

1. Trên GitHub, bấm **Use this template → Create a new repository** để tạo repo cho app mới.
2. Mở repo mới trong Claude Code, gõ **`/tao-app`**.
3. Claude chỉ hỏi 2 điều: **app là gì**, và **ai dùng, dùng để làm gì**.
4. Phần còn lại Claude tự quyết theo mặc định tốt nhất và ghi vào `APP_SPEC.md`: luồng ít chạm nhất,
   vị trí nút, màu, cảm giác khi bấm, giọng văn. Bạn xem bản tóm tắt ngắn, muốn đổi gì thì nói.
5. Chốt xong, Claude viết `DESIGN_PROMPT.md`, một prompt để bạn copy gửi Claude Design vẽ giao diện.
   Có spec và thiết kế rồi mới bắt đầu build.

## Nội dung repo

| File | Vai trò |
|---|---|
| `.claude/skills/tao-app/SKILL.md` | Câu hỏi và các mặc định Claude tự áp của `/tao-app` |
| `APP_SPEC.template.md` | Mẫu đặc tả app |
| `DESIGN_PROMPT.md` (tạo sau khi chốt) | Prompt gửi Claude Design, sinh ra từ `APP_SPEC.md` |
| `CLAUDE.md` | Quy ước Claude phải theo trong mọi app tạo từ template này |
