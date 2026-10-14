# Quy trình tạo app với `/tao-app`

```
 BẠN                         CLAUDE (tự động, không hỏi lại)
 ───                         ──────────────────────────────
 1. Use this template  ─┐
    + gõ /tao-app       │
                        ▼
 2. Trả lời 2 câu
    • App là gì?
    • Ai dùng, để làm gì?
                        │
                        ▼
 3. Bấm chọn ─────────▶ 4. Viết APP_SPEC.md
    • Màu chủ đạo          • Bản đồ việc: suy ngược từ việc chính ra việc phụ
    • Phong cách             (tạo hồ sơ, đăng tin, sửa, hủy, đánh giá...)
    • Chạy ở đâu:          • Tự quyết luồng, nút, cảm giác bấm, giọng
      Web / Zalo /         • Phong cách nền: nhẹ nhàng, dễ chịu, đơn giản
      Cả hai                 mà đầy đủ, bo tròn góc
                        5. Viết DESIGN_PROMPT.md
                        6. Chọn nơi chạy:
                           A. Nhẹ               → claude.ai
                           B. Tài khoản+dữ liệu → Supabase + Netlify
                           C. Cần server        → Railway/Render + Supabase + Netlify
                           Z. Có Zalo           → thêm giao diện Zalo Mini App
                                                  (dữ liệu/server theo B hoặc C)
                        7. Build (B, C: gắn Sentry để bắt lỗi thật)
                        8. Tự kiểm tra: đi hết luồng, chụp mọi màn hình, lỗi thì tự sửa
                           (B, C: gây lỗi thử, xác nhận Sentry nhận được)
                        │
                        ▼
 9. Nhận: link app + tóm tắt (kèm bản đồ việc) + prompt thiết kế
    (có Zalo: link bản web xem trước + danh sách việc cần làm bên Zalo)
                        │
10. (Tùy chọn) Sửa ─────┘
    • Nhắn yêu cầu → Claude sửa spec rồi sửa app
    • Dán prompt vào Claude Design → gửi link lại → Claude chỉnh theo

 Chỉ khi chọn Zalo — việc bạn tự làm (cần danh tính thật):
 Z1. Đăng ký Zalo Developer, tạo Mini App → gửi Claude App ID + App Secret
 Z2. Khai báo domain server trong Zalo Developer Console (Claude đưa sẵn domain)
 Z3. Deploy lên Zalo: `zmp login` (quét QR) + `zmp deploy` theo hướng dẫn Claude soạn sẵn
     → Claude bật đăng nhập Zalo thật và kiểm tra lại

 Sau khi app chạy thật — tự sửa lỗi (chưa bật, xem TU_SUA_LOI.md):
 S1. Bạn nhắn: "bật tự sửa lỗi cho app X, mỗi sáng"
 S2. Lịch chạy trên cloud (máy tắt vẫn chạy):
     Sentry có lỗi mới → Claude tìm nguyên nhân → sửa → test
       → tự merge + deploy → hỏng thì tự quay lại bản trước
 S3. Bạn nhận thông báo điện thoại: lỗi gì, sửa gì, lỗi nào chưa sửa được
```

**Phần bạn phải làm:** bấm 1 lần tạo repo, trả lời 2 câu, bấm chọn màu, phong cách và nơi chạy. Nếu
chọn Zalo thì thêm 3 bước Z1–Z3. Còn lại Claude tự làm.

**Claude chỉ dừng lại hỏi khi:**
- có phát sinh chi phí: báo trước số tiền;
- không tạo được chỗ chạy app: báo lý do và vẫn gửi bản demo để xem trước.
