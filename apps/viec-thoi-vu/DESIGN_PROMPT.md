# Prompt thiết kế — Việc Thời Vụ

> Tạo từ `APP_SPEC.md`. Copy toàn bộ phần dưới đường kẻ, dán vào Claude Design. Spec đổi → viết lại.

---

Thiết kế giao diện di động cho **Việc Thời Vụ** — app tìm việc làm thời vụ. Người tìm việc (sinh viên,
lao động tự do, người muốn kiếm thêm) tìm việc ngắn hạn gần mình và ứng tuyển; nhà tuyển dụng (cửa
hàng, xưởng, kho mùa cao điểm, nông trại mùa vụ, sự kiện) đăng tin cần người theo đợt/ca và chọn người.
Chạy trên web và trong Zalo Mini App. Chữ trong giao diện bằng **tiếng Việt** (có bản tiếng Anh).

## Khung hình và bố cục
- Khung điện thoại 390×844, dùng một tay. Nút chính mỗi màn ở nửa dưới, rộng hết chiều ngang, dạng
  viên thuốc, cao ≥48px. Mỗi màn chỉ một hành động chính.
- Thanh điều hướng dưới đáy. Người tìm việc / khách: "Việc làm", "Đã ứng tuyển", "Tài khoản".
  Nhà tuyển dụng: "Tin của tôi", "Tài khoản".

## Phong cách
- Nhẹ nhàng, dễ chịu, đơn giản mà đầy đủ; mềm mại, nhiều khoảng trắng; bo tròn rõ (thẻ 18px, nút viên
  thuốc, ô nhập 12px, ảnh tròn). Không dark mode.
- Màu: chủ đạo xanh dương nhạt #5B8DEF, nền nhấn #EAF1FE, nền trang #F6F8FC, thẻ trắng bóng rất nhẹ,
  chữ #1F2937 / chữ phụ #6B7280, gấp/lỗi đỏ dịu #E5675E trên nền #FDECEA, thành công #3FA672.
- Icon bằng emoji (📅 📍 👥 ⚡ ✅). Logo tạm: ô vuông bo tròn màu chủ đạo, chữ "VT" trắng.
- Giọng thân thiện, xưng "bạn", emoji vừa phải.

## Thẻ việc
1. Tên việc ("Phụ bếp ca tối") + nhãn "⚡ Gấp" đỏ dịu nếu gấp
2. **Mức lương** to, đậm, màu chủ đạo: "35.000đ / giờ", "300.000đ / ngày"
3. Nhãn nhỏ nền xám nhạt: "📅 18–20/10" · "📍 Q.1, TP.HCM · 1,2 km" · "👥 còn 3 chỗ"
4. Tên cơ sở ("Nhà hàng Mộc")

## Màn hình
### Người tìm việc
1. **Việc làm** (mở app là thấy, chưa cần đăng nhập): ô tìm kiếm, hàng nhãn lọc (Tất cả / ⚡ Gấp /
   Phục vụ / Kho hàng / Sự kiện / Nông nghiệp / Bán hàng), danh sách thẻ việc gần nhất trước. Góc trên
   có nút nhỏ "Tôi cần tuyển người".
2. **Chi tiết việc:** thẻ đầu tên + Gấp + lương to; thẻ thứ hai: 📅 thời gian và ca, 📍 địa chỉ +
   khoảng cách, 👥 "Còn 3/5 chỗ", 🏪 tên cơ sở; mô tả công việc. Nút dưới đáy "Ứng tuyển ngay"; hết chỗ
   → nút xám "Đã đủ người"; đã ứng tuyển → "Đã gửi đơn".
3. **Đăng nhập lần đầu** (bảng trượt lên khi bấm Ứng tuyển): ô "Số điện thoại", "Mật khẩu", "Tên của
   bạn"; nút "Ứng tuyển ngay"; dòng nhỏ "Đã có tài khoản? Đăng nhập". Trong Zalo: nút "Tiếp tục với Zalo".
4. **Ứng tuyển thành công:** dấu tích lớn, "Đã gửi đơn! Nhà tuyển dụng sẽ liên hệ bạn sớm 🙌", nút
   "Xem thêm việc".
5. **Đã ứng tuyển:** danh sách đơn, mỗi đơn có nhãn trạng thái (Đang chờ / Được nhận / Chưa phù hợp).
   Được nhận → hiện SĐT nhà tuyển dụng + nút "Gọi" và "Nhắn Zalo". Đang chờ → nút chữ "Rút đơn".
### Nhà tuyển dụng
6. **Tin của tôi:** thẻ tin (tên, "2/5 chỗ", nhãn xanh "3 ứng viên mới", nhãn "Đã đóng" nếu đóng);
   thanh nhỏ "Gói Miễn phí: 1/2 tin đang mở · Nâng cấp"; nút cố định dưới đáy "+ Đăng tin".
7. **Đăng tin:** dòng nhỏ "Đã điền theo tin trước, sửa nếu cần"; ô: tên việc, ngành (nhãn chọn), lương
   + đơn vị (giờ / ngày / ca / việc), ngày bắt đầu–kết thúc, ghi chú ca, số người cần, địa chỉ, mô tả;
   công tắc "Tin gấp" có nhãn "Pro". Nút dưới đáy "Đăng tin".
8. **Ứng viên của một tin:** thẻ ứng viên: tên, lời nhắn, giới thiệu ngắn; nút "Nhận" (chính) và
   "Từ chối" (phụ) ở phần dưới thẻ. Đã nhận → hiện SĐT + "Gọi" / "Nhắn Zalo". Nút chữ "Đóng tin".
9. **Nhận người thành công:** dấu tích, "Đã nhận Minh! Gọi ngay để hẹn lịch nhé", số điện thoại to.
10. **Hồ sơ cơ sở lần đầu:** tên cơ sở, địa chỉ, SĐT; nút "Lưu và đăng tin".
11. **Bảng giá:** 2 thẻ Miễn phí / Pro (149.000đ/tháng · 1.490.000đ/năm), Pro nổi bật; nút "Nâng cấp".
### Chung
12. **Tài khoản:** tên, SĐT, giới thiệu (người tìm việc) hoặc thông tin cơ sở; đổi ngôn ngữ Tiếng Việt /
    English; Bảng giá (nhà tuyển dụng); "Đăng xuất" dạng chữ ở cuối, tách xa.
- **Đang tải:** khung xám chờ hình thẻ. **Trống:** "Chưa có việc phù hợp. Thử bỏ bớt bộ lọc nhé 👀".
  **Lỗi:** câu thân thiện kèm cách sửa + nút "Thử lại". **Gợi ý lần đầu:** bong bóng nhỏ chỉ nút
  "+ Đăng tin": "Đăng tin đầu tiên chỉ mất 1 phút".

## Landing page (máy tính và điện thoại)
Hero: "Việc thời vụ gần bạn — tìm nhanh, nhận việc trong ngày" + 2 nút "Tìm việc ngay" / "Đăng tin
tuyển"; ảnh chụp app trong khung điện thoại; 3 lợi ích cho người tìm việc, 3 cho nhà tuyển dụng; bảng
giá; câu hỏi thường gặp; chân trang có Điều khoản / Bảo mật / Hoàn tiền.

## Tương tác
Nút chính đậm màu khi nhấn + rung nhẹ (Ứng tuyển, Đăng tin, Nhận). Chuyển trang mềm ~0,2s. Thành công
→ màn xác nhận (4, 9).

## Bàn giao
Các màn trên (khung điện thoại) + landing (máy tính và điện thoại), dữ liệu mẫu tiếng Việt thực tế
(lương 25.000–45.000đ/giờ, 250.000–400.000đ/ngày; TP.HCM, Hà Nội, Đà Nẵng, Cần Thơ), và trang thành
phần: thẻ việc (thường / gấp / hết chỗ), thẻ ứng viên, nút chính/phụ/chữ, nhãn, ô nhập, thanh điều
hướng, bảng màu, cỡ chữ.
