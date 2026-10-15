# Prompt thiết kế — Việc Thời Vụ (bản 2: điện thoại + tablet + máy tính)

> Viết lại từ `APP_SPEC.md` sau khi bản 1 chỉ tối ưu cho điện thoại (lên tablet/máy tính bị cột hẹp 480px,
> trống hai bên). Copy toàn bộ phần dưới đường kẻ, dán vào Claude Design. Nên đính kèm design system
> "Việc Thời Vụ" đã có (tokens + component) để giữ đúng màu và kiểu.

---

Thiết kế giao diện **responsive** cho **Việc Thời Vụ** — app tìm việc làm thời vụ. Người tìm việc (sinh viên,
lao động tự do, người muốn kiếm thêm) tìm việc ngắn hạn gần mình và ứng tuyển; nhà tuyển dụng (cửa hàng,
xưởng, kho mùa cao điểm, nông trại, sự kiện) đăng tin cần người theo đợt/ca và chọn người. Chạy trên web
(điện thoại, tablet, máy tính) và trong Zalo Mini App (chỉ điện thoại). Chữ tiếng **Việt** (có bản tiếng Anh).

**Yêu cầu quan trọng nhất:** giao diện phải đẹp và dùng hết chỗ trên MỌI cỡ màn hình — không được chỉ là
"cột điện thoại căn giữa, trống hai bên". Mỗi màn thiết kế đủ 4 cỡ khung (bên dưới).

## Các cỡ khung phải thiết kế
| Tên | Khung | Cách dùng |
|---|---|---|
| Điện thoại | 390×844 | một tay, một cột |
| Tablet dọc | 834×1112 | chạm bằng hai tay, 2 cột |
| Tablet ngang | 1194×834 | 2–3 cột, thanh bên |
| Máy tính | 1440×900 | chuột + bàn phím, 3 vùng |

Điểm chuyển bố cục: <600px điện thoại · 600–1023px tablet · ≥1024px máy tính. Nội dung co giãn mượt giữa các
điểm (không nhảy cóc), không bao giờ cuộn ngang trang.

## Phong cách (giữ nguyên mọi cỡ)
- Nhẹ nhàng, dễ chịu, đơn giản mà đầy đủ; mềm mại, nhiều khoảng trắng; bo tròn rõ (thẻ 18px, nút viên thuốc,
  ô nhập 12px, ảnh tròn). Không dark mode.
- Màu: chủ đạo xanh dương nhạt #5B8DEF (nhấn #4A7AD9), nền nhấn #EAF1FE, nền trang #F6F8FC, thẻ trắng bóng
  rất nhẹ, chữ #1F2937 / chữ phụ #6B7280, gấp/lỗi đỏ dịu #E5675E trên #FDECEA, thành công #3FA672.
- Icon bằng emoji (📅 📍 👥 ⚡ ✅ 🏪 📞 💬). Logo: ô vuông bo tròn màu chủ đạo, chữ "VT" trắng.
- Giọng thân thiện, xưng "bạn", emoji vừa phải. Font hệ thống.
- Chữ co theo cỡ: tiêu đề trang 22px (điện thoại) → 26px (tablet) → 28px (máy tính); tên việc 16 → 17 → 18px;
  mức lương luôn to và đậm nhất thẻ. Chữ thân ≥15px mọi cỡ.

## Nguyên tắc theo thiết bị
**Điện thoại** — như bản 1: nút chính mỗi màn ở nửa dưới, rộng hết chiều ngang, viên thuốc, cao ≥48px; thanh
điều hướng đáy; form trong bảng trượt từ dưới lên.

**Tablet** — KHÔNG phóng to giao diện điện thoại.
- Thanh điều hướng chuyển sang **thanh bên trái** (rộng 96px: biểu tượng + chữ nhỏ bên dưới), không còn thanh đáy.
- Danh sách và chi tiết đặt **cạnh nhau** (master–detail): trái danh sách thẻ (rộng ~340–380px, cuộn riêng),
  phải chi tiết việc / ứng viên. Chạm một thẻ → chi tiết hiện ngay bên phải, không chuyển trang.
- Nút chính (Ứng tuyển, Nhận, Đăng tin) nằm **cuối khung chi tiết** (dính đáy khung đó), rộng vừa phải
  (tối đa 360px), không kéo dài hết màn hình.
- Bảng trượt (đăng nhập, xác nhận) thành **hộp thoại giữa màn hình** rộng 440px, nền mờ phía sau.
- Chạm ≥44px, khoảng cách giữa các nút đủ rộng để chạm ngón cái cả hai tay.

**Máy tính** — thiết kế cho chuột và bàn phím.
- **Thanh trên cùng** (cao 64px): logo "VT Việc Thời Vụ" bên trái, tab điều hướng ở giữa (Việc làm · Đã ứng tuyển
  / Tin của tôi), bên phải: nút "Tôi cần tuyển người" hoặc tên người dùng + đổi ngôn ngữ. Không có thanh đáy.
- Nội dung rộng tối đa 1200px, căn giữa, chia **3 vùng**: bộ lọc bên trái (rộng 240px) · danh sách giữa (lưới
  thẻ 1–2 cột) · chi tiết bên phải (rộng 420px, dính trên cùng khi cuộn).
- Có trạng thái **di chuột** (thẻ nổi nhẹ + viền chủ đạo mờ), **focus bàn phím** (vòng sáng 3px #EAF1FE + viền
  chủ đạo), con trỏ tay trên mọi thứ bấm được. Nút chính mặc định nhỏ gọn (cao 44px, rộng theo nội dung hoặc
  tối đa 320px), không rộng hết màn hình.
- Phím tắt gợi ý bằng nhãn nhỏ: "/" tìm kiếm, "Esc" đóng hộp thoại.

## Thẻ việc (mọi cỡ)
1. Tên việc + nhãn "⚡ Gấp" đỏ dịu nếu gấp
2. **Mức lương** to, đậm, màu chủ đạo: "35.000đ / giờ", "300.000đ / ngày"
3. Nhãn nhỏ nền xám nhạt: "📅 18–20/10" · "📍 Q.1, TP.HCM · 1,2 km" · "👥 còn 3 chỗ"
4. Tên cơ sở ("🏪 Nhà hàng Mộc")

Điện thoại: một cột. Tablet: một cột trong khung trái. Máy tính: lưới 2 cột khi vùng giữa đủ rộng. Thẻ đang
chọn có viền chủ đạo 2px + nền #EAF1FE nhạt.

## Màn hình (mỗi màn đủ 4 cỡ khung)
### Người tìm việc
1. **Việc làm** — mở app là thấy, chưa cần đăng nhập. Ô tìm kiếm, nhãn lọc (Tất cả / ⚡ Gấp / Phục vụ / Kho
   hàng / Sự kiện / Nông nghiệp / Bán hàng), dòng "📍 Sắp xếp theo khoảng cách", danh sách thẻ gần nhất trước.
   - Điện thoại: nhãn lọc cuộn ngang. Tablet ngang/Máy tính: bộ lọc thành cột bên trái (nhãn xếp dọc, thêm ô
     chọn khu vực và mức lương tối thiểu). Có nút nhỏ "Tôi cần tuyển người" (điện thoại: góc trên; máy tính:
     thanh trên cùng).
   - Tablet/Máy tính: khi chưa chọn thẻ nào, khung chi tiết hiện trạng thái trống đẹp: "Chọn một việc để xem chi
     tiết 👈".
2. **Chi tiết việc** — thẻ đầu: tên + Gấp + lương to; thẻ hai: 📅 thời gian và ca, 📍 địa chỉ + khoảng cách,
   👥 "Còn 3/5 chỗ", 🏪 cơ sở; mô tả; ô lời nhắn (không bắt buộc). Nút "Ứng tuyển ngay"; hết chỗ → xám "Đã đủ
   người"; đã ứng tuyển → "Đã gửi đơn ✓". Điện thoại: trang riêng, có nút ←. Tablet/Máy tính: khung bên phải.
3. **Đăng nhập lần đầu** — hiện khi bấm Ứng tuyển: ô "Tên của bạn", "Số điện thoại", "Mật khẩu"; nút "Ứng tuyển
   ngay"; "Đã có tài khoản? Đăng nhập"; trong Zalo: "Tiếp tục với Zalo"; bản dùng thử: nút "Dùng thử: Người tìm
   việc". Điện thoại: bảng trượt. Tablet/Máy tính: hộp thoại giữa màn hình 440px.
4. **Ứng tuyển thành công** — dấu tích lớn, "Đã gửi đơn! Nhà tuyển dụng sẽ liên hệ bạn sớm 🙌", nút "Xem thêm
   việc", chữ "Xem đơn đã gửi". Điện thoại: toàn màn hình. Tablet/Máy tính: hộp thoại giữa.
5. **Đã ứng tuyển** — danh sách đơn với nhãn trạng thái (Đang chờ / Được nhận 🎉 / Chưa phù hợp). Được nhận →
   hiện SĐT nhà tuyển dụng to + nút "📞 Gọi" "💬 Nhắn Zalo". Đang chờ → chữ "Rút đơn". Tablet/Máy tính: lưới 2
   cột thẻ, hoặc danh sách trái + chi tiết đơn phải.

### Nhà tuyển dụng
6. **Tin của tôi** — thẻ tin (tên, "2/5 chỗ", nhãn xanh "3 ứng viên mới", "Đã đóng"); thanh "Gói Miễn phí: 1/2
   tin đang mở · Nâng cấp"; nút "+ Đăng tin". Điện thoại: nút dính đáy. Tablet/Máy tính: **master–detail** —
   trái danh sách tin, phải danh sách ứng viên của tin đang chọn (màn 8), nút "+ Đăng tin" ở đầu cột trái.
7. **Đăng tin** — dòng "✨ Đã điền theo tin trước, sửa nếu cần"; tên việc, ngành (nhãn chọn), lương + đơn vị
   (giờ / ngày / ca / việc), ngày bắt đầu–kết thúc, ghi chú ca, số người cần, địa chỉ, mô tả, công tắc "Tin gấp"
   có nhãn "Pro". Điện thoại: form một cột, nút "Đăng tin" dính đáy. Tablet: form 2 cột (lương/ngày/số người
   cạnh nhau). Máy tính: **form bên trái + xem trước thẻ việc trực tiếp bên phải** (đúng như người tìm việc sẽ
   thấy), nút "Đăng tin" ở cuối form.
8. **Ứng viên của một tin** — thẻ ứng viên: avatar chữ cái, tên, giới thiệu ngắn, lời nhắn; nút "Từ chối" (phụ)
   và "Nhận" (chính). Đã nhận → SĐT + "Gọi" / "Nhắn Zalo". Chữ "Đóng tin". Tablet/Máy tính: lưới 2 cột.
9. **Nhận người thành công** — dấu tích, "Đã nhận Minh! Gọi ngay để hẹn lịch nhé", SĐT to, nút Gọi / Nhắn Zalo.
   Điện thoại: toàn màn hình. Tablet/Máy tính: hộp thoại giữa.
10. **Hồ sơ cơ sở lần đầu** — tên cơ sở, địa chỉ, SĐT; nút "Lưu và đăng tin".
11. **Bảng giá** — hai thẻ Miễn phí / Pro (149.000đ/tháng · 1.490.000đ/năm), Pro nổi bật viền chủ đạo; nút
    "Nâng cấp Pro"; dòng thông báo "Thanh toán đang được mở…". Điện thoại: xếp dọc. Tablet/Máy tính: cạnh nhau.

### Chung
12. **Tài khoản** — tên, SĐT, giới thiệu (người tìm việc) hoặc thông tin cơ sở; đổi ngôn ngữ Tiếng Việt /
    English; Bảng giá (nhà tuyển dụng); "Đăng xuất" dạng chữ cuối trang, tách xa. Tablet/Máy tính: hai khối
    (hồ sơ | cài đặt) cạnh nhau, rộng tối đa 880px.
13. **Trạng thái** — Đang tải: khung xám chờ đúng hình thẻ (có cả khung chi tiết trên tablet/máy tính). Trống:
    emoji + "Chưa có việc phù hợp. Thử bỏ bớt bộ lọc nhé 👀". Lỗi: câu thân thiện kèm cách sửa + "Thử lại".
    Gợi ý lần đầu: bong bóng nhỏ chỉ nút "+ Đăng tin": "Đăng tin đầu tiên chỉ mất 1 phút".

## Landing page (mọi cỡ)
Hero: "Việc thời vụ gần bạn — tìm nhanh, nhận việc trong ngày" + 2 nút "Tìm việc ngay" / "Đăng tin tuyển"; ảnh app
trong khung điện thoại (máy tính: hero 2 cột, chữ trái – khung điện thoại phải; tablet dọc: xếp dọc, khung điện
thoại ở dưới; điện thoại: khung thu nhỏ). 3 lợi ích cho người tìm việc + 3 cho nhà tuyển dụng (máy tính/tablet:
2 cột; điện thoại: xếp dọc), bảng giá (2 thẻ cạnh nhau từ tablet trở lên), câu hỏi thường gặp (rộng tối đa
760px), chân trang có Điều khoản / Bảo mật / Hoàn tiền. Thanh trên cùng dính, có nút đổi ngôn ngữ.

## Tương tác
Nút chính đậm màu khi nhấn + rung nhẹ trên điện thoại (Ứng tuyển, Đăng tin, Nhận); máy tính có hiệu ứng di
chuột. Chuyển trang mềm ~0,2s; hộp thoại mờ dần vào ~0,18s; chọn thẻ ở master–detail đổi khung chi tiết bằng
mờ chéo nhanh, không giật. Thành công → màn/hộp thoại xác nhận (4, 9).

## Bàn giao
- Mỗi màn ở 4 cỡ khung (điện thoại, tablet dọc, tablet ngang, máy tính), dữ liệu mẫu tiếng Việt thực tế
  (lương 25.000–45.000đ/giờ, 250.000–400.000đ/ngày; TP.HCM, Hà Nội, Đà Nẵng, Cần Thơ).
- Trang thành phần: thẻ việc (thường / gấp / hết chỗ / đang chọn / di chuột), thẻ ứng viên, nút chính/phụ/chữ
  (thường / di chuột / focus / vô hiệu), nhãn, ô nhập, thanh bên tablet, thanh trên máy tính, thanh đáy điện
  thoại, hộp thoại, bảng màu, cỡ chữ theo từng cỡ khung, lưới và khoảng cách.
- Ghi rõ mỗi điểm chuyển bố cục (600px, 1024px) đổi những gì để lập trình viên làm đúng.
