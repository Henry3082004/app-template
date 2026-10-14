---
name: tao-app
description: Tạo trọn một app mới từ 2 câu trả lời. Chỉ hỏi người viết app là gì và ai dùng / dùng để làm gì; Claude tự quyết mọi thứ còn lại theo mặc định tốt nhất, ghi APP_SPEC.md, viết DESIGN_PROMPT.md (prompt để người viết tự gửi Claude Design), build, tự kiểm tra, rồi gửi link web app chạy được cùng prompt thiết kế — không dừng giữa chừng chờ duyệt. Dùng khi người dùng gõ /tao-app, hoặc nói muốn tạo/làm/build một app mới.
---

# /tao-app — Trả lời 2 câu, nhận link app

Người viết app chỉ trả lời những điều **chỉ họ mới biết**. Mọi thứ khác Claude tự quyết và làm
liền một mạch tới khi có **link web app chạy được**. Không dừng giữa chừng xin duyệt spec hay thiết
kế — người viết xem link rồi yêu cầu sửa sau.

## Bước 1 — Hỏi (một lượt; chỉ hỏi lượt 2 khi thiếu thứ không thể tự suy ra)

1. **App là gì?** Mô tả một câu, kèm tên tạm nếu có.
2. **Ai dùng app?** Có mấy loại người dùng; mỗi loại **dùng app để làm gì** (1–2 việc chính).

Không hỏi về luồng, bố cục, màu, giọng, cách kiếm tiền, nền tảng.

Sau khi có câu trả lời, nói ngắn gọn: loại app (nhẹ/đầy đủ — xem Bước 4), model + effort + thời
gian ước tính, rồi làm luôn.

## Bước 2 — Tự quyết và ghi APP_SPEC.md

Chép `APP_SPEC.template.md` thành `APP_SPEC.md` và điền đầy đủ. Mục 0–1 lấy từ câu trả lời; các mục
còn lại suy ra từ mục đích app và người dùng theo các mặc định dưới đây. Có lý do rõ ràng để làm
khác (vd: công cụ văn phòng dùng trên máy tính) thì làm khác và ghi lý do vào spec.

**Luồng chính:**
- Việc chính hoàn thành với **ít lần chạm nhất có thể**; màn hình đầu tiên là nơi làm việc chính.
- Cho xem trước, chỉ đăng nhập khi thật sự cần (vd: lúc gửi/lưu dữ liệu).
- Chỉ hỏi người dùng thông tin khi cần, form ngắn, tự điền sẵn những gì đã biết.

**Bố cục và nút bấm:**
- Mặc định dùng một tay trên điện thoại: thanh điều hướng dưới đáy; nút chính ở nửa dưới, to (≥48px),
  rộng hết chiều ngang; mỗi màn hình một hành động chính.
- Đăng xuất và hành động nguy hiểm (xóa, hủy) để xa nút chính, luôn hỏi xác nhận.
- Thông tin quan trọng nhất (giá, thời gian, trạng thái) đặt nổi bật trên cùng mỗi thẻ.

**Hình ảnh:**
- Một màu chủ đạo hợp tính chất app (tránh trùng màu thương hiệu lớn như xanh Zalo), kèm màu nhạt đi
  kèm và màu đỏ cho lỗi/gấp. Nền sáng, thẻ trắng bo góc, tối giản. Không dark mode ở bản đầu.
- Icon nhỏ dùng emoji (không phụ thuộc font/CDN bên ngoài). Logo tạm: ô vuông bo góc chữ viết tắt.

**Cảm giác khi bấm:**
- Nút chính đổi màu khi nhấn, rung nhẹ trên điện thoại hỗ trợ; nút thường không rung.
- Chuyển trang trượt nhanh (~0,2s). Đang tải → khung xám chờ (skeleton).
- Xong việc chính → màn xác nhận ngắn (dấu tích + câu nói bước tiếp theo).

**Giọng giao tiếp:**
- Xưng "bạn", thân thiện, ngắn gọn; emoji vừa phải.
- Không màn giới thiệu; chỗ dễ bối rối hiện một dòng gợi ý lần đầu.
- Báo lỗi luôn kèm cách sửa, không hiện mã lỗi kỹ thuật. Bản demo có thêm nút
  "Sao chép báo lỗi cho Claude" (copy sẵn: lỗi gì, màn hình nào, lúc nào, chi tiết kỹ thuật).

**Phạm vi bản đầu:** chỉ những gì phục vụ việc chính của từng loại người dùng; thứ khác ghi vào
"Để sau". Chưa thu tiền, chưa thanh toán trong app trừ khi đó chính là việc chính.

## Bước 3 — Viết prompt thiết kế (chỉ viết, không tự vẽ)

Viết `DESIGN_PROMPT.md` ở gốc repo: prompt hoàn chỉnh, tự đứng được, để người viết **tự** copy dán
vào Claude Design nếu muốn thiết kế đẹp hơn. Claude không tự tạo thiết kế trên canvas. Gồm: mô tả app
và người dùng; khung hình (vd điện thoại 390×844) và nguyên tắc bố cục; phong cách (mã màu, bo góc,
icon); **danh sách từng màn hình** theo từng loại người dùng bám đúng luồng chính, mỗi màn ghi nội
dung, nút chính và câu chữ mẫu đúng giọng; các trạng thái (đang tải, trống, lỗi, thành công, gợi ý lần
đầu); ghi chú tương tác; phần cần bàn giao (màn hình + trang thành phần). Dữ liệu mẫu thực tế, đúng
ngôn ngữ app. Không thêm gì spec không có. Không chờ người viết — sang Bước 4 ngay.

## Bước 4 — Build và đăng

Phân loại app rồi chọn nơi chạy (connector đã kết nối: Railway, Render, Supabase, Netlify, Sentry):

| Loại | Khi nào | Chạy ở đâu |
|---|---|---|
| **A. Nhẹ** | Dùng cá nhân/nhóm nhỏ, không cần tài khoản riêng từng người, không thanh toán | Tool **Artifact** trên claude.ai |
| **B. Có dữ liệu + đăng nhập** | Nhiều người dùng có tài khoản, dữ liệu lưu lâu dài, logic đơn giản (thêm/sửa/xem/lọc) | **Supabase** (database + đăng nhập + lưu file) + giao diện trên **Netlify** |
| **C. Cần server thật** | Logic nghiệp vụ phức tạp, tích hợp bên thứ ba (Zalo, thanh toán), xử lý định kỳ | Server trên **Railway**, hết chỗ → **Render**; database **Supabase** Postgres; giao diện **Netlify** |

Chọn loại **đơn giản nhất** đáp ứng được việc chính. Phân vân giữa B và C → chọn B.

- **Loại A:** theo đúng hướng dẫn của tool Artifact (nạp skill thiết kế artifact trước khi viết trang;
  dữ liệu dùng chung giữa người xem → capability `db` qua skill `artifact-capabilities`, không dùng
  localStorage cho dữ liệu chính). Mặc định private — nhắc người viết tự chia sẻ.
- **Loại B:** tạo project Supabase riêng cho app (gói miễn phí giới hạn số project → hết chỗ thì dùng
  chung project với schema riêng cho app). Bật Row Level Security cho mọi bảng, kiểm tra
  `get_advisors` trước khi gửi link. Frontend gọi Supabase bằng publishable key, deploy lên Netlify.
- **Loại C:** server dựng theo khung NestJS + Prisma + Dockerfile như Gig Việc. Thử Railway trước;
  không tạo được service (hết hạn mức) → Render (`create_web_service`). Bật Sentry cho cả server và
  frontend để Claude đọc được lỗi thật của người dùng.
- **Chi phí:** không bao giờ tạo tài nguyên tốn tiền khi chưa hỏi người viết. Tool báo có phí (vd
  Supabase `get_cost` khác 0) → dừng, báo số tiền và hỏi trước khi `confirm_cost`.
- Không tạo được ở mọi nơi → báo rõ lý do và việc người viết cần làm, đồng thời đăng bản demo giao
  diện bằng Artifact để vẫn có link xem ngay.
- Ghi nơi chạy, tên project/service và link vào APP_SPEC.md.

Không hỏi lại giữa chừng. Gặp quyết định không có trong mặc định → chọn phương án an toàn, đơn giản
nhất, ghi vào "Quyết định còn mở" trong spec.

## Bước 5 — Tự kiểm tra trước khi gửi link

- Chạy test/typecheck nếu có. Mở app thật, chụp màn hình kích thước điện thoại (Playwright) **mọi
  màn hình**, đi hết luồng chính của từng loại người dùng, theo dõi lỗi console.
- Đối chiếu spec: số chạm luồng chính, nút chính ở nửa dưới, màu, câu chữ đúng giọng.
- Mọi class CSS dùng trong code phải thực sự được định nghĩa; không phụ thuộc font/icon tải từ CDN.
- Sai thì sửa rồi kiểm tra lại. Chỉ gửi link khi đã đi hết luồng chính không lỗi.

## Bước 6 — Gửi kết quả

Commit APP_SPEC.md, DESIGN_PROMPT.md và code. Gửi người viết, ngắn gọn:
1. **Link app** (và tài khoản/cách dùng thử nếu có).
2. Tóm tắt 5–7 dòng: người dùng, luồng chính và số chạm, màu, giọng, những gì để sau, việc còn chờ
   người viết (nếu có).
3. **Nội dung DESIGN_PROMPT.md** ngay trong chat để copy, kèm một câu: muốn đẹp hơn thì gửi prompt
   cho Claude Design rồi đưa lại kết quả để Claude chỉnh app theo.

## Khi người viết yêu cầu sửa

Sửa APP_SPEC.md trước (và DESIGN_PROMPT.md nếu phần giao diện đổi), rồi sửa code, kiểm tra lại như
Bước 5, đăng lại cùng link. Có thiết kế từ Claude Design gửi lại → chỉnh app bám theo thiết kế đó
(là link Claude Design và app chạy trên Netlify → thử tool `import-claude-design-from-url` của Netlify
trước). Người dùng gặp lỗi → đọc lỗi trên Sentry (loại C) hoặc log Supabase (loại B) trước khi sửa.
