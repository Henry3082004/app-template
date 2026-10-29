# PROGRESS — Việc Thời Vụ

## Trạng thái: Bản Capy + responsive (15/10/2026)

- Giao diện theo design system Claude Design "Việc Thời Vụ" (nâu Capy): `src/ds/tokens/*` + `src/ds/app.css`; linh vật `public/capy/`.
- Responsive: điện thoại / tablet / tablet ngang / máy tính (Shell: thanh đáy · thanh bên · thanh trên; danh sách–chi tiết cạnh nhau).
- Kiểm tra: Playwright 17 bước × 4 cỡ khung trên bản mock — không lỗi, không cuộn ngang.
- **Lưu ý bản quyền:** 6 hình Capy do Claude Design tạo từ ảnh tham khảo; trước khi bán thật nên thay bằng hình vẽ gốc của riêng bạn.

### Lịch sử: Bản đầu (xanh dương)

**Link:** https://viec-thoi-vu.vercel.app (Vercel project `viec-thoi-vu`, tự build từ `main` khi Claude gọi deploy) · **Database:** Supabase `niscqjczfvipxxgdslqs` · **Lỗi:** Sentry `sago-k5/javascript-react`, lọc tag `app:viec-thoi-vu`

### Đã xong
- Database: bảng profiles/contacts/jobs/applications, RLS từng dòng, giới hạn gói Miễn phí (2 tin) và nhãn Gấp chỉ Pro kiểm tra trong database; hàm `decide_application`, `withdraw_application`, `mark_applications_seen`; edge function `signup` (đăng ký bằng SĐT + mật khẩu).
- Giao diện dùng design system (`src/ds/`: tokens.css + bundle.css, nguồn: Claude Design). Sửa màu/kiểu ở tokens.json rồi sinh lại tokens.css.
- Zalo Mini App: gói sẵn ở `zalo/` (xem `zalo/HUONG_DAN.md`); Mini App ID 2847107362388346804; chờ bạn khai API Domains + chạy `zmp deploy` trên máy tính.
- Giao diện web (React + Vite, tiếng Việt/Anh): Việc làm (lọc, tìm, sắp theo khoảng cách), Chi tiết + Ứng tuyển, bảng đăng nhập trượt lên (có nút dùng thử), Đã ứng tuyển (rút đơn, SĐT khi được nhận), Tin của tôi, Đăng tin (tự điền theo tin trước), Ứng viên (Nhận/Từ chối, gọi/nhắn Zalo), Bảng giá, Tài khoản.
- Landing `/`, trang pháp lý `/dieu-khoan` `/bao-mat` `/hoan-tien`, PWA (manifest, icon, service worker), `ban/`.
- Kiểm tra: Playwright 23 bước trên bản mock (`npm run build:mock`) — không lỗi console.

### Cách chạy
- `npm install` → `npm run dev` (dùng Supabase thật) · `npm run build:mock && npx vite preview --mode mock` (dữ liệu giả, không cần mạng).
- **Kiểm tra trước mỗi lần đưa lên:** `npm test` = kiểm tra kiểu + ESLint + mọi class CSS có thật + 26 bài test trình duyệt (điện thoại + máy tính bảng). Database: `supabase/tests/run.sh` (cần Postgres cục bộ).
- Tài khoản dùng thử: người tìm việc `0900000001` / `demo-tim-viec`; nhà tuyển dụng `0900000002` / `demo-tuyen-dung`.

### Lưu ý kỹ thuật
- Môi trường cloud của Claude không gọi được `*.supabase.co`, nên test UI chạy trên mock API (`src/lib/mockApi.ts`) mô phỏng đúng luật của database; luật database được test riêng bằng SQL.
- Sentry: tổ chức không cho thành viên tạo project mới → dùng chung project, gắn tag `app`.
- Còn sót 1 tài khoản test `84912345678` (Người Thử) trong Supabase — xóa khi tiện.

### Việc tiếp theo
- [ ] Thanh toán thật (cần tài khoản PayOS/SePay + Lemon Squeezy — BAN_APP.md B1, B2).
- [ ] Email hỗ trợ công khai cho trang pháp lý (`VITE_SUPPORT_EMAIL`).
- [ ] Bật "Leaked password protection" trong Supabase Dashboard → Auth.
- [ ] Zalo App ID (Z1) → đăng nhập Zalo.

- Gọn thẻ việc làm, căn giữa nhãn thanh bên tablet; nối Git để Vercel tự deploy.

- Đã nối GitHub với Vercel (deploy tự động).

## Uy tín + giữ tiền (nhánh `escrow-reputation`, CHƯA gộp vào main)
- Migration 1 `20261016_escrow_reputation.sql`: đánh giá hai chiều, giữ tiền (chế độ thử), ẩn SĐT quán đến khi nạp tiền, tự hoàn/trả công.
- Migration 2 `20261017_admin_payouts.sql`: quản trị xử lý tranh chấp, sổ chuyển tiền THỦ CÔNG, tài khoản nhận tiền của người làm.
- Kiểm thử DB cục bộ: `supabase/tests/` (40 phép kiểm tra, kết thúc `ALL SCENARIOS PASSED`).
- Thứ tự đưa lên: áp dụng migration 1 → 2 trên Supabase → đặt quản trị: `update public.profiles set is_admin = true where id = '<id của bạn>';` → gộp nhánh vào main.
- CHƯA làm: nhận tiền thật qua cổng thanh toán, tự động chuyển tiền. Cần giấy phép/đối tác (xem QUY_TRINH). `payment_mode` luôn là `test`.

## 18/10/2026 — Chạy thật, MIỄN PHÍ
- `payment_mode = off`, `billing = off` (bảng app_settings). Nhận người → hiện SĐT ngay; quán vẫn xác nhận ca + hai bên đánh giá → dữ liệu uy tín có từ ngày đầu. Không giới hạn số tin.
- Bản chính thức tắt nút "Dùng thử" (VITE_DEMO=0). Nút "Sao chép gửi Claude" chỉ hiện cho quản trị.
- Đã đóng việc mẫu, khóa tài khoản dùng thử.
- Bật lại tiền / gói trả phí: xem đầu file `supabase/migrations/20261018_free_mode.sql`.
- Chưa làm: đăng nhập bằng Zalo (chờ Henry xin quyền SĐT + App Secret).

## Deploy Zalo bằng GitHub (từ 18/10/2026)
- Phiên đăng nhập Zalo chỉ sống ~24h và sandbox của Claude không đăng nhập được (WebSocket bị chặn), nên deploy Zalo chạy trên GitHub: Actions → "Deploy Zalo Mini App" → Run workflow (chọn development/testing).
- Mỗi lần cần quét 1 mã QR bằng Zalo: workflow đẩy `qr.png` lên nhánh tạm `zalo-qr` (xóa sau khi xong). Claude lấy ảnh và gửi cho Henry.
- Không cần secret nào. Kết quả (zdev-…) nằm ở cuối nhật ký bước "Wait for result".

## Đăng nhập bằng Zalo (18/10/2026)
- Hàm Supabase `zalo-login` (supabase/functions/zalo-login/index.ts) đã deploy. Cần secret `ZALO_APP_SECRET` (Supabase → Edge Functions → Secrets). Chưa có secret thì hàm trả ZALO_NOT_CONFIGURED và app báo "dùng mật khẩu tạm".
- Quyền Zalo cần xin: "Thông báo xin người dùng cấp quyền truy cập số điện thoại" (scope.userPhonenumber, mục 100).
- Trong Zalo, hộp đăng nhập mặc định là "Tiếp tục với Zalo" (có giải thích lý do xin SĐT — chính sách Zalo yêu cầu), mật khẩu là phương án dự phòng.
- Số điện thoại KHÔNG lấy từ máy khách: app chỉ gửi 2 token của Zalo, máy chủ hỏi Zalo (graph.zalo.me/v2.0/me/info) ra số.
- Chưa thử với Zalo thật (cần quyền được duyệt + secret). Đã thử: tạo phiên từ token (Supabase thật), khóa tài khoản, dùng lại token, và toàn bộ giao diện (mock).

## Đăng nhập nhiều cách (18/10/2026)
- Người Việt: Zalo (số điện thoại do Zalo xác minh). Người nước ngoài: Google + tự nhập số điện thoại (CHƯA xác minh, `contacts.verified = false`).
- Web bản chính thức không còn đăng ký bằng mật khẩu (chỉ bản demo/mock). Hộp đăng nhập web: thẻ "Bạn ở Việt Nam? → Mở trong Zalo" + thẻ Google (chỉ hiện khi `app_settings.google_login = 'on'`).
- Bật Google: cấu hình Google Cloud + Supabase (xem hướng dẫn trong chat), rồi `update public.app_settings set value = 'on' where key = 'google_login';`
- Số điện thoại đã xác minh là duy nhất (index một phần); số tự nhập không chiếm được chỗ của số đã xác minh.
- CHƯA làm: đăng nhập Zalo trên web (OAuth). Zalo web thường chỉ trả mã Zalo + tên, KHÔNG có số điện thoại → cần quyết định cách gộp tài khoản. Cần App ID/Secret của Zalo App có bật "Đăng nhập Zalo".

## 18/10/2026 — Đợt dọn code lớn (không đổi giao diện)
- Lưới an toàn: `npm test` (xem "Cách chạy"); test trong `e2e/` gồm luồng tìm việc, đăng tin, giữ tiền, vắng mặt, tranh chấp + quản trị, chế độ miễn phí, đăng nhập Zalo/Google, hộp đăng nhập bản chính thức, và bản build thật với Supabase giả lập.
- Sửa lỗi tìm được nhờ test: đổi ngôn ngữ rồi đăng xuất ngay → giao diện bị "đăng nhập lại"; màn hình báo lỗi dùng class CSS không tồn tại.
- `components/Escrow.tsx` tách thành `components/escrow/`; `supabaseApi.ts` gom xử lý lỗi lặp lại; bỏ 27 câu chữ và 2 style không dùng.
- Trang Quản trị: thẻ "Sức khoẻ app" + nút "Gửi lỗi thử" (Sentry đã nhận, có monitor gửi email). Google login đã Publish (xác minh tên miền bằng file `public/google15bb4cb2df076218.html` — đừng xoá).

## 19/10/2026 — Hồ sơ người tìm việc cho quán chọn người
- Sau lần đăng nhập đầu: màn hình "Giúp quán biết về bạn" (ảnh – không bắt buộc, năm sinh, việc đã từng làm, giờ rảnh – được bỏ trống), có "Để sau"; bỏ qua thì lần đầu Ứng tuyển nhắc lại một lần rồi gửi đơn tiếp. Sửa ở Tài khoản.
- Quán thấy ảnh, tuổi, kinh nghiệm, giờ rảnh trên thẻ ứng viên (chỉ quán được ứng tuyển mới đọc được — RLS `profiles_read`).
- Ảnh: Supabase Storage bucket `avatars`, cắt vuông 320px JPEG trên máy trước khi tải lên. Test: `e2e/worker-profile.spec.ts`, `supabase/tests/60_seeker_profile.sql`.

## 19/10/2026 — Một tài khoản, hai vai trò
- Lần đầu đăng nhập: "Bạn đến đây để…" (2 thẻ, chọn sẵn theo nút vừa bấm). Sau đó ở Tài khoản → "Tạo thêm hồ sơ tuyển người / tìm việc", có cả hai thì chuyển qua lại bằng 1 nút.
- DB: `profiles.role` = vai trò đang dùng, `profiles.roles` = vai trò sở hữu; RPC `add_role`, `switch_role`; uy tín theo phía `role_reputations(p_users, p_as)`; đánh giá lấy phía từ ca làm (không theo vai trò đang dùng); không ứng tuyển tin của chính mình.
- Thông tin người tìm việc chuyển sang bảng riêng `worker_profiles` (chỉ chủ và quán được ứng tuyển đọc được) — để hồ sơ quán công khai không lộ thông tin cá nhân.
- Test: `supabase/tests/70_dual_role.sql`, `e2e/roles.spec.ts`.

## 20/10/2026 — Zalo: domain + OA
- Đã xác thực URL `https://viec-thoi-vu.vercel.app/` trên Zalo (file `public/zalo_verifier…html` — KHÔNG xoá). Đã tạo OA "Việc làm 30s" và liên kết với Mini App.
- Webhook OA: để trống, làm SAU khi có quán đầu tiên dùng (hàm nhận sự kiện trên Supabase: theo dõi người quan tâm OA, gắn `user_id_by_app` với tài khoản, gửi tin báo việc mới).
- Đang chờ Zalo: xác thực doanh nghiệp, duyệt phiên bản Testing (bản cũ), quyền SĐT #100. Duyệt xong → deploy bản mới, gửi duyệt lại, bật `zalo_published`.
- Việc của Henry: đổi App Secret Zalo (đã lộ trong chat) rồi dán vào Supabase `ZALO_APP_SECRET`; hoàn thiện trang OA (ảnh, mô tả, tin chào); xem gói Supabase; tên miền riêng.
- 20/10/2026: Zalo "Đăng nhập Zalo" (tab Web) đã cấu hình: Home URL `https://viec-thoi-vu.vercel.app`, Callback URL `https://viec-thoi-vu.vercel.app/app`. Tab iOS/Android để trống (không dùng). Chưa viết code đăng nhập Zalo trên web (cần quyết cách nối tài khoản vì Zalo web thường không trả SĐT).

## 20/10/2026 — Logo, dữ liệu mẫu, trang chủ, banner
- Logo mới = đúng con capybara của app trên nền cam (`public/icon-*.png`, `favicon.svg`, `capy/logo*.png`, `og.png`; cache `?v=3`, `sw.js` `vtv-v4`).
- Dữ liệu mẫu chỉ admin thấy: cờ `profiles.is_sample` / `jobs.is_sample` (RLS ẩn với người thường, `admin_stats` bỏ qua), tab Admin → "Dữ liệu mẫu" (`admin_samples()`). 10 quán + 10 nhân viên + 10 tin + đơn; ảnh/logo vẽ SVG ở `public/sample/`. Cách xoá: xem `supabase/migrations/APPLIED.md`.
- Logo quán: `profiles.logo_path` (Tài khoản → thêm logo/ảnh quán), hiện trên thẻ việc + trang chi tiết.
- Mở link `/` vào thẳng danh sách việc (`/app`); trang giới thiệu chuyển sang `/gioi-thieu` (Google/Zalo cần trang chủ có link điều khoản). Footer "Giới thiệu · Điều khoản · Bảo mật" trong app. VIỆC CỦA HENRY: Google Cloud → màn hình đồng ý → "Trang chủ ứng dụng" đổi thành `https://viec-thoi-vu.vercel.app/gioi-thieu`.
- Nút "Cài app" (PWA: Android 1 chạm, iPhone có hướng dẫn; ẩn trong Zalo/app đã cài; "Để sau" ẩn 7 ngày).
- Banner chạy ngang đầu danh sách việc (đổi 3 giây, dừng khi chạm/rê chuột, vuốt được). Nội dung ở `src/lib/banners.ts` — nội dung đang là mẫu, Henry quyết định sau.
- Test: `e2e/install.spec.ts`, `e2e/banners.spec.ts`, `e2e/admin.spec.ts` (tab mẫu), `e2e/core.spec.ts` (link `/`).

## 20/10/2026 — Giao diện mới theo Claude Design
- Màu caramel–kem–sage (`src/ds/tokens/colors.css`), bóng nhẹ, nút bo 14, chip cao 44 (chọn = nền cam), ô nhập nền kem.
- Font tự host qua @fontsource: Nunito 800/900 (tiêu đề, giá, logo) + Be Vietnam Pro 400/500/600 (nội dung), chỉ bộ chữ Việt + Latin.
- Trang việc làm cùng một bố cục ở mọi cỡ màn hình: banner → thẻ tìm kiếm nổi (ô tìm, Khu vực, Lương, ngành) → lưới thẻ việc; từ 1024px có thêm khung chi tiết dính bên phải. Điện thoại/tablet dọc mở việc thành trang riêng.
- Thẻ việc: tên, giá, logo + tên quán + thành phố, hàng dưới (uy tín · ngày · số chỗ). Trang việc: hộp quán màu sage, các dòng thông tin có kẻ, nút "Ứng tuyển ngay" nổi.
- Banner: hỗ trợ ảnh nền (`photo` trong `src/lib/banners.ts`, file trong `public/banners/`, có lớp phủ tối cho chữ), capybara trong vòng tròn kem. CHƯA có ảnh thật (máy làm việc không tải được Unsplash/Pexels) — đang dùng nền màu.

## 21/10/2026 — Capy hỏi nhanh
- Lần đầu mở app (chưa đăng nhập cũng được): Capy hỏi 5 câu chạm-là-xong — đến để làm gì, khu vực, loại việc, giờ rảnh, việc đã làm. Quán thì chỉ hỏi câu 1 rồi mời đăng tin.
- Mỗi câu chỉ hỏi 1 lần ("Bỏ qua"/"Để sau" cũng tính là xong). Thêm câu mới sau này (`src/lib/quiz.ts` + `private.clean_quiz`) → chỉ câu mới được hỏi.
- Lưu theo thiết bị (`localStorage vtv-quiz` + bảng `quiz_answers` qua `save_quiz`), đăng nhập thì gộp vào tài khoản (`my_quiz`). Không ai đọc trực tiếp được bảng.
- Dùng câu trả lời: việc hợp (cùng thành phố + loại việc) lên đầu và có nhãn "Hợp với bạn"; màn "Giúp quán biết về bạn" điền sẵn việc đã làm + giờ rảnh.
- Admin: Tài khoản → cuối trang "Làm thử bộ câu hỏi" (hỏi lại toàn bộ, làm bao nhiêu lần cũng được).
- Test: `supabase/tests/80_quiz.sql`, `e2e/quiz.spec.ts` (các test khác mặc định coi như đã trả lời — `quizSeen` trong fixtures).

## 21/10/2026 — Giao diện máy tính kiểu Portal + trang Hồ sơ mới
- Từ 1024px: menu bên trái (logo, "Menu chính", các mục, thẻ người đang đăng nhập ở cuối), thanh trên có tên trang + "Hôm nay, <thứ, ngày>" + VI/EN.
- Trang việc làm trên máy tính: thẻ "Xin chào <tên>" + số đơn đang chờ / được nhận / việc đang tuyển, rồi banner, thẻ tìm kiếm, "Việc làm cho bạn" dạng hàng (giá ở bên phải). Từ 1280px còn có khung chi tiết dính bên phải; 1024–1279 mở việc thành trang riêng.
- Trang Tài khoản (mọi cỡ): thẻ đầu (ảnh, tên, SĐT + nhãn "đã/chưa xác thực" — Zalo = đã xác thực, chỉ số uy tín), các hàng bấm để mở (Thông tin cá nhân, Đánh giá về bạn, Vai trò, Tài khoản nhận tiền, Ngôn ngữ, Hỗ trợ & điều khoản), khung "Công cụ admin & kiểm thử" (chỉ admin: làm thử bộ câu hỏi, mở Quản trị), nút Đăng xuất đỏ.

## 22/10/2026 — Admin xem như người dùng thường
- Tài khoản admin → Tài khoản → "Công cụ admin": nút "Chuyển sang bản người dùng thường" (lưu trên máy này): ẩn menu Quản trị, công cụ admin, tin mẫu; có nút nổi "Về quản trị" ở dưới màn hình. Test: `e2e/admin.spec.ts`.

## 22/10/2026 — 5 tab người tìm việc (theo mẫu Portal)
- Menu người tìm việc đã đăng nhập: Việc làm · Chấm công · Thu nhập · Hồ sơ (khách: Việc làm · Đã ứng tuyển · Hồ sơ; quán: Tin của tôi · Hồ sơ). "Tài khoản" đổi tên thành "Hồ sơ". (Có làm tab Trang chủ rồi bỏ theo yêu cầu của Henry — Rút tiền + Thu nhập nằm hết trong tab Thu nhập.)
- Việc làm `/app` (`/app/viec-lam` chuyển về `/app`); Chấm công `/app/cham-cong` (danh sách ca Hôm nay/Sắp tới/Đã xong + tab "Đơn ứng tuyển" = `/app/da-ung-tuyen`, KHÔNG có nút bấm giờ); Thu nhập `/app/thu-nhap` (thẻ tối "Số dư hiện tại", Rút tiền khóa "Sắp có", Giao dịch, Bảng kê lương theo tháng).
- Thu nhập tính từ các đơn đã `released` (`src/lib/earnings.ts`), không thêm bảng DB. App miễn phí → số tiền là ƯỚC TÍNH (giá công bố × 8 giờ/ngày) và ghi rõ; số dư = tiền đã về app chưa chuyển (0đ khi miễn phí).
- Hồ sơ thêm: Xác thực tài khoản, Cài đặt & Bảo mật (ngôn ngữ + cách đăng nhập), Hỗ trợ & HDSD (hỏi đáp), Tài khoản nhận tiền luôn hiện cho người tìm việc.
- Test: `e2e/tabs.spec.ts`. Chưa làm: tab Chấm công/Chi phí cho phía quán; luồng rút tiền thật.

## 22/10/2026 — 4 tab cho chủ quán
Tuyển người (Tin đăng | Ứng viên, đăng lại tin cũ) · Ca làm (Cần xác nhận / Hôm nay / Sắp tới / Đã xong, số đỏ trên menu, nút "Đã trả tiền mặt") · Chi phí (tháng này, tổng, theo ca, theo tháng) · Hồ sơ (+ "Nhân viên quen" có nút Mời làm lại). Dữ liệu từ `api.myHires()`; DB thêm `paid_cash_at` + `mark_paid_cash`.

## 28/10/2026 — Hợp tác hai bên (đợt 1 + 2)
- **Thông báo trong app:** chuông (góc trên phải) + trang `/app/thong-bao`. Sinh tự động từ trigger: có đơn mới, được nhận/từ chối, ca xác nhận, báo vắng, quán ghi trả tiền mặt, người làm xác nhận nhận tiền, người làm đã đến, tin nhắn mới, lời mời làm lại.
- **Chấm công thật:** người làm bấm "Tôi đã đến" (vị trí là tuỳ chọn, ghi khoảng cách tới quán) và "Tôi đã làm xong"; quán thấy ở tab Ca làm. Quán vẫn là bên xác nhận ca.
- **Tiền mặt hai chiều:** quán "Đã trả tiền mặt" → người làm "Tôi đã nhận tiền".
- **Xuất CSV** chi phí (tab Chi phí).
- **Nhắn tin** trong ca đã nhận (cập nhật mỗi 8 giây khi mở, chưa có thông báo đẩy ngoài app).
- **Báo cáo người dùng** (lý do, mô tả) → admin xem và đánh dấu đã xử lý ở trang Quản trị (tab Báo cáo).
- **Yêu cầu xóa tài khoản** trong Hồ sơ → admin xử lý tay trong 7 ngày (tab Yêu cầu xóa).
- **Mời làm lại trong app** cho Nhân viên quen (chỉ người đã làm xong ca cho quán).
- CHƯA làm: thanh toán/rút tiền thật, xác thực CCCD, thông báo đẩy ngoài app (cần OA Zalo), quán tự tìm người làm.

## 29/10/2026 — Chính sách + nhắc việc
- **Chính sách bảo mật / điều khoản** cập nhật cho chat, báo cáo, chấm công có vị trí (chỉ lưu số mét, không lưu tọa độ), thông báo, lời mời, xóa tài khoản ngay trong Hồ sơ.
- **Nhắc việc tự động** (pg_cron mỗi giờ): tối hôm trước và sáng ngày làm cho người làm; quán chưa xác nhận ca; nhắc đánh giá cho cả hai bên. Mỗi nhắc chỉ gửi một lần, bỏ qua tài khoản mẫu. Chỉ hiện trong app (chưa đẩy ra ngoài app).

## 01/11/2026 — Quán tìm người
- Người làm bật "Cho quán tìm thấy tôi" trong Hồ sơ (mặc định TẮT). Quán vào Tuyển người → Tìm người: lọc khu vực, kinh nghiệm, giờ rảnh; thấy tên rút gọn, tuổi, khu vực, uy tín, không thấy số điện thoại. Mời vào tin bằng `invite_worker` (20/ngày). Số điện thoại chỉ hiện khi người làm nhận việc.
- Chính sách bảo mật có thêm mục "Hồ sơ hiển thị cho quán". 92 test đạt.

## 01/11/2026 — Sửa lỗ hổng bảo mật bảng contacts
- Rà bảo mật (skill Cloudflare, mức quick, chạy dở rồi dừng) phát hiện người dùng đăng nhập tự đặt được `contacts.verified`/`phone`. Đã thu hồi quyền ghi (migration 20261102), có test. Phần rà còn lại CHƯA chạy.

## 01/11/2026 — Refactor A + B + C (không đổi tính năng)
- A: thành phần dùng chung `ContactButtons`, `PersonRow`, hàm `useAction`, `pendingOf`; bỏ chữ và code thừa.
- B: `lib/supabaseApi.ts` và `lib/mockApi.ts` tách theo khu vực (`lib/supabase/*`, `lib/mock/*`); hợp đồng API ở `lib/apiTypes.ts`; chữ ở `lib/i18n/vi.ts` + `en.ts`.
- C: dữ liệu dùng chung qua TanStack Query (`lib/query.ts`: ca của quán, đơn của người làm, cấu hình, lời mời, công tắc tìm thấy); thư mục theo tính năng `src/features/{jobs,shifts,hiring,collab,account,admin,public}` (còn `src/components` cho phần giao diện chung); kiểu sinh từ cơ sở dữ liệu `lib/database.types.ts` (tên hàm RPC được kiểm tra khi build — chạy lại generate_typescript_types sau mỗi migration).
- 92 test đạt sau mỗi phần.

## 01/11/2026 — Banner trang chủ "sống"
- Kéo được bằng tay và bằng chuột, vòng lặp vô tận, tự chuyển mỗi 3 giây (không còn dừng khi rê chuột; dừng khi đang giữ/kéo, có nút ⏸ / ▶, tab ẩn, hoặc người dùng tắt hiệu ứng chuyển động). Chấm của slide hiện tại chạy thanh tiến độ 3 giây.
- Ba loại slide trộn xen kẽ: số liệu thật từ cơ sở dữ liệu (việc đang mở, tin mới 7 ngày, khu vực và ngành nhiều việc nhất, việc gấp, số người sẵn sàng; chỉ hiện khi từ 3 trở lên, không bịa số), tin tức có link ngoài (mở tab mới), mẹo cho người tìm việc / quán. Slide hợp với vai trò người đang đăng nhập được xếp lên trước.
- Tin tức đặt ở `app_settings.home_news`; hai tin đầu mới lấy từ tiêu đề tìm kiếm, CHƯA ai mở đọc kỹ: nên xem lại và thay bằng bài chọn lọc.
- 92 test đạt (có test kéo chuột, tạm dừng, vòng lặp, link tin tức).

## 01/11/2026 — Chữ và giao diện danh sách việc gọn, chuyên nghiệp hơn
- Bỏ giọng Capy và biểu tượng cảm xúc khỏi chữ (giữ hình Capy làm nhân vật): "Capy tìm được 14 việc nè 🍊" → "14 việc đang tuyển"; lời chào, thông báo gửi đơn, lỗi, câu hỏi nhanh... viết lại trung tính, lịch sự (vi + en).
- Bỏ nhãn phím "/" trong ô tìm kiếm; dòng ngày ở thanh trên chỉ còn "Thứ Năm, 29/10/2026"; ô lương ghi rõ "Từ 25.000đ / giờ"; danh sách chọn luôn nền sáng; "Mọi mức lương" thay "Không giới hạn".
- "Capy hỏi nhanh" đổi tên thành "Gợi ý việc phù hợp" (cả trong chính sách bảo mật). 92 test đạt.
