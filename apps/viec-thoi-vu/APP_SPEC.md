# APP_SPEC — Việc Thời Vụ

> Bản đặc tả do `/tao-app` tạo ra. Mục 0–1 lấy từ câu trả lời của Henry; các mục còn lại do Claude
> quyết theo mặc định tốt nhất, Henry đổi được. Mọi màn hình, nút bấm, màu sắc, câu chữ khi build
> phải khớp file này. Muốn làm khác → sửa file này trước.

**Ngày tạo:** 14/10/2026 — **Link app:** https://viec-thoi-vu.vercel.app
**Người viết app:** Henry

## 0. Thông tin chung

- **Mô tả một câu:** App tìm việc làm thời vụ — người cần việc tìm việc ngắn hạn gần mình; cơ sở cần
  người theo đợt/ca đăng tin và chọn người nhanh.
- **Nền tảng:** Web (điện thoại là chính, máy tính vẫn dùng tốt) + Zalo Mini App (cùng code giao diện).
- **Loại app:** B + Zalo — Supabase (database, đăng nhập, hàm xử lý) + Vercel (web).
- **Cách kiếm tiền:** Nhà tuyển dụng trả phí gói Pro; người tìm việc luôn miễn phí (xem mục 7).

## 1. Người dùng

| Loại người dùng | Họ là ai | Dùng app để | Tần suất & hoàn cảnh | Ưu tiên |
|---|---|---|---|---|
| Nhà tuyển dụng | Cửa hàng, quán ăn, xưởng, kho hàng mùa cao điểm, nông trại mùa vụ, đơn vị tổ chức sự kiện | Đăng tin cần người theo đợt/ca, chọn người nhanh | Theo đợt cao điểm; thường đang bận việc, dùng điện thoại một tay | **1** (có tin thì mới có người tìm; là người trả tiền) |
| Người tìm việc | Sinh viên, lao động tự do, người muốn kiếm thêm cuối tuần/mùa vụ | Tìm việc thời vụ gần mình, hợp lịch, ứng tuyển | Lướt nhanh lúc rảnh, vài phút mỗi lần | 2 |

*Henry chưa trả lời câu "ai dùng" — Claude suy ra từ loại app; Henry sửa nếu khác.*

## 1b. Bản đồ việc

| Việc | Thuộc ai | Phục vụ việc chính | Loại | Bản đầu? |
|---|---|---|---|---|
| Xem danh sách việc (không cần đăng nhập) | Người tìm việc | Tìm & ứng tuyển | Chính | Có |
| Lọc: chỉ việc gấp, theo ngành, tìm theo chữ | Người tìm việc | Tìm & ứng tuyển | Trong | Có |
| Sắp xếp theo khoảng cách (khi cho phép vị trí) | Người tìm việc | Tìm & ứng tuyển | Trong | Có |
| Xem chi tiết việc | Người tìm việc | Tìm & ứng tuyển | Trong | Có |
| Ứng tuyển (kèm lời nhắn ngắn tùy chọn) | Người tìm việc | — | Chính | Có |
| Đăng nhập lần đầu + hồ sơ tối thiểu (tên, SĐT liên hệ) — chỉ khi bấm Ứng tuyển | Người tìm việc | Ứng tuyển | Trước | Có |
| Xem đơn đã ứng tuyển + trạng thái | Người tìm việc | Ứng tuyển | Sau | Có |
| Rút đơn khi chưa được duyệt | Người tìm việc | Ứng tuyển | Sau | Có |
| Thấy SĐT nhà tuyển dụng khi được nhận | Người tìm việc | Ứng tuyển | Sau | Có |
| Đăng tin tuyển (form ngắn, tự điền theo tin trước) | Nhà tuyển dụng | — | Chính | Có |
| Đăng nhập lần đầu + hồ sơ cơ sở (tên cơ sở, địa chỉ, SĐT) — chỉ khi bấm Đăng tin | Nhà tuyển dụng | Đăng tin | Trước | Có |
| Xem danh sách tin của mình + số ứng viên mới | Nhà tuyển dụng | Chọn người | Sau | Có |
| Xem ứng viên của một tin (tên, giới thiệu) | Nhà tuyển dụng | Chọn người | Trong | Có |
| Nhận / từ chối ứng viên | Nhà tuyển dụng | — | Chính | Có |
| Thấy SĐT ứng viên khi đã nhận | Nhà tuyển dụng | Chọn người | Sau | Có |
| Tin tự đóng khi đủ người; tự đóng/mở lại tin | Nhà tuyển dụng | Đăng tin | Sau | Có |
| Sửa hồ sơ, đổi ngôn ngữ, đăng xuất | Cả hai | — | Tài khoản | Có |
| Xem bảng giá, giới hạn gói Miễn phí | Nhà tuyển dụng | Đăng tin | Trước | Có |
| Thanh toán nâng cấp Pro | Nhà tuyển dụng | Đăng tin | Trước | Để sau (chờ tài khoản thanh toán) |
| Dữ liệu mẫu: vài tin ở TP.HCM, Hà Nội, Đà Nẵng, Cần Thơ | — | Màn hình đầu không trống | — | Có |
| Lưu việc yêu thích, thông báo khi có ứng viên/được nhận | Cả hai | — | Sau | Để sau |
| Đánh giá hai chiều sau khi làm xong | Cả hai | — | Sau | Để sau |
| Quản trị: duyệt tin, khóa tài khoản xấu, thống kê | Henry | — | Quản lý | Để sau |

## 2. Luồng chính

### Người tìm việc — Tìm và ứng tuyển
- Hiện đang làm bằng: nhóm Facebook/Zalo, hỏi người quen — vướng ở: tin trôi nhanh, không biết tin
  nào còn tuyển, không biết gần hay xa.
- Luồng: `Mở app → danh sách việc (gần nhất trước) → chạm việc → Ứng tuyển → Xong` (**2 lần chạm**;
  lần đầu thêm bước đăng nhập + nhập tên, SĐT ngay trong một bảng trượt lên, rồi tự gửi đơn tiếp).
- **Hồ sơ cho quán chọn người (từ 19/10/2026):** ngay sau lần đăng nhập đầu tiên hiện **một** màn hình
  "Giúp quán biết về bạn": ảnh đại diện (không bắt buộc), năm sinh (chọn từ danh sách), việc đã từng làm
  (chip, có "Chưa làm bao giờ"), giờ rảnh (chip Sáng/Chiều/Tối/Cuối tuần, được bỏ trống). Gần như không gõ
  chữ, ~15–20 giây. Có nút "Để sau"; nếu bỏ qua, lần đầu bấm Ứng tuyển nhắc lại **một lần** rồi gửi đơn tiếp.
  Sửa lại được ở Tài khoản. Quán thấy tuổi, ảnh, kinh nghiệm, giờ rảnh trên thẻ ứng viên (chỉ quán mà người đó
  đã ứng tuyển mới thấy).

### Nhà tuyển dụng — Đăng tin
- Hiện đang làm bằng: đăng nhóm Facebook/Zalo, treo biển — vướng ở: chờ tin nhắn, hỏi từng người.
- Luồng: `Mở app → Tin của tôi → nút "+ Đăng tin" ở đáy → form tự điền theo tin trước → Đăng → Xong`
  (**2 lần chạm** + phần sửa thông tin). Lần đầu: chọn "Tôi cần tuyển người" → đăng nhập → hồ sơ cơ sở.

### Nhà tuyển dụng — Chọn người
- Luồng: `Mở app → Tin của tôi (nhãn "3 ứng viên mới") → chạm tin → Nhận → Xong` (**2 lần chạm**).
  Nhận xong hiện ngay SĐT ứng viên để gọi/nhắn Zalo.

**Lần đầu mở app:** xem danh sách việc ngay, không cần đăng nhập. Có nút "Tôi cần tuyển người" cho
nhà tuyển dụng.

**Đăng nhập:**
- Số điện thoại + mật khẩu (bản đầu chưa xác minh SMS — xem "Quyết định còn mở").
- Trong Zalo: đăng nhập bằng Zalo (khi có Zalo App ID).
- Bản demo: 2 nút "Dùng thử: Người tìm việc" / "Dùng thử: Nhà tuyển dụng".
- **Vai trò (từ 19/10/2026):** lần đầu đăng nhập, màn hình "Bạn đến đây để…" với 2 thẻ to "Tìm việc làm thêm" /
  "Tuyển người cho quán", chọn sẵn theo nút vừa bấm (thường chỉ 1 chạm "Tiếp tục"). Mỗi tài khoản bắt đầu với
  **một** vai trò; sau này vào Tài khoản → "Tạo thêm hồ sơ tuyển người" (tên quán, địa chỉ) hoặc "Tạo thêm hồ sơ
  tìm việc" (màn hình "Giúp quán biết về bạn") — cùng tài khoản, chuyển qua lại bằng 1 nút. Uy tín tính **riêng
  từng vai trò**. Thông tin người tìm việc (ảnh, tuổi, giới thiệu…) chỉ quán được ứng tuyển mới thấy, kể cả khi
  người đó cũng có quán. Không ứng tuyển vào tin của chính mình.

## 3. Bố cục và nút bấm

- **Thiết bị:** responsive 4 cỡ: điện thoại <600px (thanh đáy), tablet 600–1023px (thanh bên trái, danh sách + chi tiết cạnh nhau), tablet ngang 1024–1279px (thêm cột bộ lọc), máy tính ≥1280px (thanh trên, 3 vùng, form đăng tin có xem trước).
- **Điều hướng:** thanh dưới đáy.
  - Khách / người tìm việc: "Việc làm" · "Đã ứng tuyển" · "Tài khoản".
  - Nhà tuyển dụng: "Tin của tôi" · "Tài khoản".
- **Luôn hiển thị:** nút chính của mỗi màn ở nửa dưới (Ứng tuyển / + Đăng tin / Nhận), rộng hết
  chiều ngang, dạng viên thuốc.
- **Giấu trong Tài khoản:** đăng xuất (có hỏi xác nhận), đổi ngôn ngữ, bảng giá.
- **Thẻ việc:** tên việc + nhãn "Gấp" · **mức lương** (to, màu chủ đạo) · nhãn nhỏ: 📅 thời gian · 📍
  khu vực + khoảng cách · 👥 còn mấy chỗ · tên cơ sở.

## 4. Hình ảnh

- **Phong cách nền:** nhẹ nhàng, dễ chịu, đơn giản mà đầy đủ, bo tròn rõ (thẻ 18px, nút viên thuốc,
  ô nhập 12px).
- **Biến thể đã chọn:** mềm mại, nhiều khoảng trắng; linh vật **Capy** (capybara) — xem `src/ds/` và `public/capy/`.
- **Màu (bản Capy, 15/10/2026):** chủ đạo nâu caramel `#A65F2A` (nhấn `#8A4C1F`) — nền nhấn kem `#FBEFDF` — nền trang `#FFF9F1` — chữ `#3B2A1E`, chữ phụ `#7A6657` — vàng nắng `#F2B63D` (Pro) — xanh nước `#7CC4D8` (thông tin) — gấp/lỗi `#D9534F` trên `#FDE9E4` — thành công `#4F9D5D`. Bảng đầy đủ: `src/ds/tokens/colors.css`. (Bản đầu dùng xanh dương `#5B8DEF`.)
- **Ảnh & icon:** emoji + 6 dáng Capy (chào, mừng, trống, lỗi, tắm/đang tải, gấp) trong `public/capy/`; logo = đầu Capy.
- **Dark mode:** không ở bản đầu.

## 5. Cảm giác khi bấm

- Nút chính đậm màu khi nhấn, rung nhẹ (trên điện thoại hỗ trợ) với Ứng tuyển / Đăng tin / Nhận.
- Chuyển trang mềm, nhanh (~0,2s). Đang tải → khung xám chờ hình thẻ.
- Xong việc chính → màn xác nhận: dấu tích lớn + câu nói bước tiếp theo.

## 6. Giọng giao tiếp

- **Xưng hô:** "bạn". Tiếng Anh: "you", cùng giọng thân thiện.
- **Giọng:** thân thiện, ngắn gọn, emoji vừa phải. Câu mẫu: "Đã gửi đơn! Nhà tuyển dụng sẽ liên hệ
  bạn sớm 🙌"
- **Người mới:** không màn giới thiệu; màn trống có câu gợi ý bước đầu tiên.
- **Báo lỗi:** luôn kèm cách sửa, không mã lỗi. Câu mẫu: "Chưa gửi được đơn. Kiểm tra mạng rồi thử
  lại nhé." Bản demo có nút "Sao chép báo lỗi cho Claude".
- **Từ dùng:** "việc thời vụ", "tin tuyển", "ứng tuyển", "nhà tuyển dụng". **Tránh:** "lao động phổ
  thông" (nghe xem nhẹ), thuật ngữ tiếng Anh trong bản tiếng Việt.

## 7. Bán

- **Thị trường:** Việt Nam + quốc tế.
- **Gói giá (nhà tuyển dụng):**
  - Miễn phí: tối đa **2 tin đang mở** cùng lúc.
  - Pro: không giới hạn tin + được gắn nhãn **Gấp** (tin gấp lên đầu danh sách).
    **149.000đ/tháng, 1.490.000đ/năm** · **$7/month, $70/year**.
  - Lý do: ngang chi phí một lần đăng tin tuyển gấp ở nơi khác, cơ sở nhỏ chịu được; trả năm ~2 tháng
    miễn phí. Người tìm việc luôn miễn phí để có nhiều người dùng.
  - Giới hạn gói được kiểm tra ở database, không chỉ ẩn nút.
- **Thanh toán:** PayOS/SePay (VN), Lemon Squeezy (quốc tế) — **chưa kết nối** vì Henry chưa đăng ký
  tài khoản (BAN_APP.md B1, B2). Hiện nút "Nâng cấp" hiện bảng giá và thông báo "sắp mở thanh toán".
- **Ngôn ngữ:** vi + en. Mở lần đầu luôn là tiếng Việt (từ 19/10/2026, không đoán theo trình duyệt); bấm EN thì app nhớ lựa chọn đó.
- **Landing page:** trang `/` của site; app ở `/app`. **Trang pháp lý:** `/dieu-khoan`, `/bao-mat`,
  `/hoan-tien`.
- **Nơi đăng bán:** Product Hunt, Google Play (đóng gói Android), Zalo Mini App; tài liệu trong `ban/`.
- **Việc Henry cần làm:** đăng ký cổng thanh toán (B1, B2); tên miền (B3); Google Play Console (B4);
  Product Hunt (B5); Zalo Developer (Z1–Z3).

## Để sau (không làm ở bản đầu)

- Thanh toán thật (khi có tài khoản cổng thanh toán).
- Xác minh số điện thoại bằng SMS; đăng nhập Google.
- Lưu việc yêu thích, thông báo, đánh giá hai chiều, quản trị nội dung.
- Một tài khoản dùng được cả hai vai trò.

## Quyết định còn mở

- [ ] Số điện thoại chưa được xác minh — có thể bị nhập số của người khác. Cần SMS OTP (tốn phí) hoặc
      chỉ dùng đăng nhập Zalo khi lên Zalo.
- [ ] Zalo App ID / Secret (Z1) để bật đăng nhập Zalo thật.
- [ ] Tài khoản PayOS/SePay + Lemon Squeezy để bật thanh toán.
- [ ] Tên miền riêng.
