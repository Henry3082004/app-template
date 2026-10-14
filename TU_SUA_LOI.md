# Tự sửa lỗi từ Sentry (chưa bật)

Henry đã chọn: **chưa bật lịch** lúc này. Khi bật, chế độ là **tự merge và deploy** (không chờ duyệt).

## Cách bật

Henry nhắn: "bật tự sửa lỗi cho app <tên>, mỗi <sáng / 4 giờ>". Claude tạo một Routine (lịch chạy trên
cloud, máy tắt vẫn chạy) bằng tool `create_trigger` với:

- `create_new_session_on_fire: true`
- `connectors`: `["Sentry", "GitHub"]` + nơi app chạy (`Railway` / `Render` / `Supabase` / `Netlify`)
- `notifications: { push: true }`
- `prompt`: nội dung ở mục "Prompt cho mỗi lần chạy" bên dưới, thay <...> bằng thông tin thật

Mỗi lần chạy tính vào hạn mức dùng Claude của Henry.

## Prompt cho mỗi lần chạy

```
Kiểm tra lỗi mới của app <tên app> (repo <owner/repo>, project Sentry <tên project>) từ lần chạy trước.
Không có lỗi mới chưa xử lý → kết thúc, không gửi gì.
Có lỗi → với từng lỗi (ưu tiên lỗi ảnh hưởng nhiều người dùng nhất):
1. Đọc chi tiết lỗi trên Sentry, tìm nguyên nhân gốc trong code. Không tìm ra nguyên nhân chắc chắn
   → không sửa đoán, chỉ ghi lại trong thông báo.
2. Sửa tối thiểu, đúng nguyên nhân. Không đổi tính năng, giao diện hay APP_SPEC.md.
3. Chạy test/typecheck/build. Có thể tái hiện lỗi thì tái hiện trước, xác nhận đã hết sau khi sửa.
4. Tất cả xanh → mở PR, merge vào nhánh chính, chờ deploy xong, đọc log deploy xác nhận app khởi
   động sạch. Đánh dấu lỗi đã giải quyết trên Sentry, ghi link PR.
5. Deploy lỗi hoặc app không khởi động → revert ngay bằng một PR revert, merge, xác nhận app chạy lại
   bình thường.
Cuối cùng gửi thông báo ngắn: lỗi gì, đã sửa gì (link PR), lỗi nào chưa sửa được và vì sao.
```

## Giới hạn an toàn (luôn áp dụng)

- Không sửa khi chưa chắc nguyên nhân. Không xóa dữ liệu, không chạy migration xóa cột/bảng.
- Không tạo tài nguyên tốn tiền.
- Sửa thất bại thì revert, không để app hỏng.
