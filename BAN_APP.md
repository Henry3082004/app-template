# Bán app — việc thiết lập một lần

Những việc dưới đây cần danh tính, giấy tờ hoặc tài khoản ngân hàng thật nên Henry phải tự làm. Mỗi
việc **chỉ làm một lần**, sau đó mọi app tạo từ template đều dùng lại. Làm xong mục nào thì đánh dấu
`[x]` ở mục "Đã thiết lập" (hoặc nhắn Claude đánh dấu) — `/tao-app` đọc mục đó để biết dùng được gì.

## Việc cần làm

| # | Việc | Để làm gì | Bắt buộc? |
|---|---|---|---|
| 1 | **Cổng thanh toán Việt Nam**: PayOS (payos.vn) hoặc SePay (sepay.vn) | Khách Việt chuyển khoản QR, app tự xác nhận đã trả tiền | Khi bán ở Việt Nam |
| 2 | **Lemon Squeezy** (lemonsqueezy.com) | Khách quốc tế trả bằng thẻ/PayPal; Lemon Squeezy lo thuế và hóa đơn quốc tế, chuyển tiền về ngân hàng/PayPal của bạn | Khi bán quốc tế |
| 3 | **Tên miền** (vd tên thương hiệu chung, mỗi app một tên miền con) | Landing page và app có địa chỉ chuyên nghiệp | Nên có |
| 4 | **Google Play Console** (phí 25 USD một lần) | Đưa app Android lên Google Play | Khi muốn có app trên Play |
| 5 | **Product Hunt** (tài khoản cá nhân) | Ra mắt app với cộng đồng quốc tế | Nên có khi bán quốc tế |
| 6 | **AppSumo** (đăng ký đối tác bán) | Bán gói dùng trọn đời cho khách quốc tế | Tùy chọn |
| 7 | **Thuế và pháp lý** | Bán phần mềm có doanh thu ở Việt Nam phải kê khai thuế; một số cổng thanh toán yêu cầu hộ kinh doanh hoặc doanh nghiệp | Tự kiểm tra với cơ quan thuế / người am hiểu |

Mỗi cổng thanh toán có quy định riêng về việc nhận tài khoản cá nhân hay chỉ nhận hộ kinh doanh /
doanh nghiệp — kiểm tra khi đăng ký.

## Khóa bí mật (API key)

Cổng thanh toán sẽ cấp API key và webhook secret. **Cách an toàn nhất:** Henry tự dán vào phần biến
môi trường của dịch vụ chạy app (Claude chỉ đúng chỗ và đúng tên biến). Gửi key qua chat cũng được nhưng
key sẽ nằm trong lịch sử trò chuyện. Claude không bao giờ đưa key vào code hay commit.

## Đã thiết lập

- [ ] PayOS
- [ ] SePay
- [ ] Lemon Squeezy
- [ ] Tên miền: ____
- [ ] Google Play Console
- [ ] Product Hunt
- [ ] AppSumo
