---
name: tao-app
description: Bắt đầu một app mới. Chỉ hỏi người viết app là gì và ai dùng / dùng để làm gì; mọi thứ còn lại (luồng, bố cục, hình ảnh, cảm giác khi bấm, giọng văn) Claude tự quyết theo mặc định tốt nhất, ghi vào APP_SPEC.md, cho người viết xem lướt và đổi nếu muốn, rồi viết DESIGN_PROMPT.md (prompt gửi Claude Design) trước khi viết bất kỳ dòng code nào. Dùng khi người dùng gõ /tao-app, hoặc nói muốn tạo/làm/build một app mới mà repo chưa có APP_SPEC.md đã chốt.
---

# /tao-app — Hỏi ít, quyết hộ phần còn lại

Người viết app chỉ cần trả lời những điều **chỉ họ mới biết**: app để làm gì, ai dùng, dùng để làm
gì. Những thứ có sẵn đáp án tốt nhất (số chạm, vị trí nút, cách báo lỗi, màu, giọng văn...) thì
Claude tự quyết, không hỏi. **Không viết code cho tới khi APP_SPEC.md đã chốt.**

## Bước 1 — Hỏi (một lượt, tối đa 2 lượt nếu cần làm rõ)

Hỏi bằng tiếng Việt, ngắn gọn, không thuật ngữ:

1. **App là gì?** Mô tả một câu, kèm tên tạm nếu có.
2. **Ai dùng app?** Có mấy loại người dùng; mỗi loại **dùng app để làm gì** (1–2 việc chính).

Chỉ hỏi thêm khi câu trả lời thiếu thứ không thể tự suy ra (vd: không rõ có mấy loại người dùng).
Không hỏi về luồng, bố cục, màu, giọng, cách kiếm tiền.

## Bước 2 — Tự quyết phần còn lại

Suy ra từ mục đích app và người dùng, áp các mặc định dưới đây. Có lý do rõ ràng để làm khác
(vd: app nội bộ văn phòng dùng trên máy tính) thì làm khác và ghi lý do vào spec.

**Nền tảng:** web chạy tốt trên điện thoại (nhanh ra mắt nhất). Cần chạy trong Zalo → Zalo Mini App.

**Luồng chính:**
- Việc chính hoàn thành với **ít lần chạm nhất có thể**; màn hình đầu tiên là nơi làm việc chính.
- Cho xem trước, chỉ đăng nhập khi thật sự cần (vd: lúc gửi/lưu dữ liệu).
- Chỉ hỏi người dùng thông tin khi cần, form ngắn, tự điền sẵn những gì đã biết.

**Bố cục và nút bấm:**
- Mặc định dùng một tay trên điện thoại: thanh điều hướng dưới đáy; nút chính ở nửa dưới, to (≥48px),
  rộng hết chiều ngang; mỗi màn hình một hành động chính.
- Đăng xuất và hành động nguy hiểm (xóa, hủy) để xa nút chính, luôn hỏi xác nhận.
- Thông tin quan trọng nhất với người dùng (giá, thời gian, trạng thái) đặt nổi bật trên cùng mỗi thẻ.

**Hình ảnh:**
- Chọn một màu chủ đạo hợp tính chất app (tránh trùng màu thương hiệu lớn như xanh Zalo), kèm màu
  nhạt đi kèm và màu đỏ cho lỗi/gấp. Nền sáng, thẻ trắng bo góc, tối giản. Không dark mode ở bản đầu.
- Icon nhỏ dùng emoji (không phụ thuộc font/CDN bên ngoài). Logo tạm: ô vuông bo góc chữ viết tắt.

**Cảm giác khi bấm:**
- Nút chính đổi màu khi nhấn, rung nhẹ trên điện thoại hỗ trợ; nút thường không rung.
- Chuyển trang trượt nhanh (~0,2s). Đang tải → khung xám chờ (skeleton).
- Xong việc chính → màn xác nhận ngắn (dấu tích + câu nói bước tiếp theo).

**Giọng giao tiếp:**
- Xưng "bạn", thân thiện, ngắn gọn; emoji vừa phải.
- Không màn giới thiệu; chỗ dễ bối rối hiện một dòng gợi ý lần đầu.
- Báo lỗi luôn kèm cách sửa, không hiện mã lỗi kỹ thuật. Chế độ demo/thử nghiệm có thêm nút
  "Sao chép báo lỗi cho Claude" (copy sẵn: lỗi gì, màn hình nào, lúc nào, chi tiết kỹ thuật).

**Phạm vi bản đầu:** chỉ những gì phục vụ việc chính của từng loại người dùng; thứ khác ghi vào
"Để sau" trong spec. Chưa thu tiền, chưa thanh toán trong app trừ khi đó chính là việc chính.

## Bước 3 — Ghi spec và cho xem lướt

1. Chép `APP_SPEC.template.md` thành `APP_SPEC.md`, điền đầy đủ. Mục 0–1 lấy từ câu trả lời; các
   mục còn lại là quyết định của Claude.
2. Tóm tắt trong chat thật ngắn (5–7 dòng): người dùng, luồng chính và số chạm, màu, giọng, những gì
   để sau. Nói rõ: "Muốn đổi gì cứ nói, không thì mình chốt."
3. Người viết đổi gì → sửa spec rồi tóm tắt lại phần đổi. Đồng ý (hoặc không phản đối) → ghi ngày
   chốt vào APP_SPEC.md.

## Bước 4 — Prompt thiết kế

Viết `DESIGN_PROMPT.md` ở gốc repo: một prompt hoàn chỉnh, tự đứng được, để người viết copy dán vào
Claude Design. Gồm: mô tả app và người dùng; khung hình (vd điện thoại 390×844) và nguyên tắc bố cục;
phong cách (mã màu, bo góc, icon); **danh sách từng màn hình** theo từng loại người dùng bám đúng
luồng chính, mỗi màn ghi nội dung, nút chính và câu chữ mẫu đúng giọng; các trạng thái (đang tải,
trống, lỗi, thành công, gợi ý lần đầu); ghi chú tương tác; phần cần bàn giao (màn hình + trang thành
phần). Dữ liệu mẫu thực tế, đúng ngôn ngữ app. Không thêm gì spec không có.
Đưa nội dung prompt ngay trong chat để copy được luôn.

## Bước 5 — Trước khi build

Commit APP_SPEC.md + DESIGN_PROMPT.md. Nêu model nên dùng, mức effort, thời gian ước tính rồi mới
build. Có thiết kế từ Claude Design gửi lại → build bám theo thiết kế đó và APP_SPEC.md.
Spec đổi → cập nhật APP_SPEC.md trước, viết lại DESIGN_PROMPT.md, rồi mới sửa code.

## Trong lúc build

- Mọi màn hình, nút, màu, câu chữ phải khớp APP_SPEC.md. Muốn làm khác → sửa spec trước.
- Mỗi màn hình làm xong: chụp màn hình (Playwright, kích thước điện thoại), đối chiếu spec: số chạm
  của luồng chính, nút chính ở nửa dưới, câu chữ đúng giọng.
