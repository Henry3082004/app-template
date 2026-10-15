# Bộ tài liệu đăng bán — Việc Thời Vụ

Ảnh chụp màn hình (điện thoại 390×844) trong `anh/`. Thay ảnh khi giao diện đổi.

## Mô tả ngắn (≤80 ký tự)
- **VI:** Tìm việc thời vụ gần bạn — ứng tuyển 2 chạm, đăng tin 1 phút.
- **EN:** Short-term jobs near you — apply in 2 taps, post in 1 minute.

## Mô tả dài
**VI**
Việc Thời Vụ giúp người cần việc ngắn hạn và cơ sở cần người theo đợt gặp nhau nhanh nhất.
- Người tìm việc: xem việc gần mình (có khoảng cách), lọc việc gấp, ứng tuyển 2 lần chạm, biết ngay khi được nhận và gọi/nhắn Zalo cho nhà tuyển dụng. Miễn phí hoàn toàn.
- Nhà tuyển dụng: đăng tin trong 1 phút (tự điền theo tin trước), xem ứng viên, bấm Nhận là có số điện thoại. Tin tự đóng khi đủ người.
- Gói Pro 149.000đ/tháng: không giới hạn tin + nhãn ⚡ Gấp lên đầu danh sách.
- Số điện thoại chỉ hiện sau khi nhà tuyển dụng nhận — riêng tư cho cả hai bên.

**EN**
Việc Thời Vụ connects people looking for short-term work with businesses that need staff for a shift, a weekend or a season.
- Job seekers: see nearby jobs with distance, filter urgent ones, apply in two taps, and get the employer's number the moment you're accepted. Always free.
- Employers: post in a minute (the form fills from your last post), review applicants, tap Accept to get their number. Posts close automatically when full.
- Pro ($7/month): unlimited posts and the ⚡ Urgent badge that pins your post to the top.
- Phone numbers stay private until the employer accepts.

## Product Hunt
- **Tagline:** Find short-term work nearby, hire for a shift in one minute
- **Topics:** Hiring, Jobs, Productivity, Vietnam
- **First comment:** "Hi PH! In Vietnam, seasonal and shift work is still found through crowded Facebook/Zalo groups — posts get buried and nobody knows which are still open. Việc Thời Vụ shows nearby open jobs with distance, lets seekers apply in two taps, and gives employers a one-tap Accept that reveals the phone number. Try the demo buttons — no signup needed. Feedback very welcome!"

## Google Play (đóng gói TWA)
- **Tên:** Việc Thời Vụ – Tìm việc gần bạn
- **Danh mục:** Kinh doanh (Business) · **Độ tuổi:** 18+ (tuyển dụng)
- **Cách đóng gói:** app đã là PWA (manifest + service worker). Khi có tên miền (BAN_APP.md B3):
  1. Mở https://www.pwabuilder.com, nhập link app → **Package for stores → Android**.
  2. Tải gói `.aab` + file `assetlinks.json`; gửi file này cho Claude để đặt vào `public/.well-known/`.
  3. Tải `.aab` lên Google Play Console (B4), dán mô tả ở trên, đính ảnh trong `anh/`.

## Zalo Mini App
Code đã sẵn (`app-config.json`, tự dùng bộ định tuyến trong bộ nhớ khi chạy trong Zalo). Cần Henry làm Z1–Z3
trong `QUY_TRINH.md` (tạo Mini App, lấy App ID) rồi nhắn Claude để bật đăng nhập Zalo và đóng gói.
