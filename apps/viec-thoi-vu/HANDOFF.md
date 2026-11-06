# Bàn giao phiên làm việc (cập nhật 04/11/2026)

Đọc file này trước khi làm. Không chứa khóa hay mật khẩu nào, và không bao giờ được thêm vào đây.

## Ứng dụng
- **Capi** (tên cũ "Việc Thời Vụ"): việc làm thời vụ theo ca. Chủ: Trương Minh Khang (Henry), Founder, CÔNG TY TNHH 1TV SAGO SOFTWARE.
- Web: capiviec.vn (mới, đang chờ DNS và cấu hình) và viec-thoi-vu.vercel.app. Zalo Mini App APP_ID 2847107362388346804 (đã duyệt 100%). Zalo OA "Capi - Việc làm parttime 30s".
- Code: `apps/viec-thoi-vu`, repo Henry3082004/app-template, nhánh `main`, Vercel tự deploy. Supabase project `niscqjczfvipxxgdslqs`. Vercel project `prj_veoWYQPASeny4e3fQdX1EoTEiYto`.
- Stack: Vite + React 18 + TypeScript + TanStack Query; Supabase (RLS, hàm SECURITY DEFINER, edge function Deno).

## Môi trường của phiên mới (đọc trước khi làm)
- Phiên mới có thể chỉ mở repo App-creator. Code Capi ở repo **Henry3082004/app-template**: dùng công cụ `add_repo` (owner Henry3082004, repo app-template, access push), clone, rồi `register_repo_root`. Làm trên nhánh `main` (Vercel tự deploy).
- Công cụ kết nối của tài khoản (Supabase, Vercel, Google Sheets, Google Drive, GitHub) thường có sẵn. Việc đầu tiên: thử một lệnh nhỏ (ví dụ liệt kê dự án Supabase) để chắc chắn chúng chạy; nếu thiếu, báo Henry bật trong cài đặt kết nối, đừng tìm đường vòng.
- Container mới là sạch: Postgres cục bộ, file tạm và script phụ trợ cũ KHÔNG còn. Chỉ chạy test cơ sở dữ liệu khi thật cần (phải cài lại Postgres 16); áp migration lên bản thật bằng công cụ Supabase. Cái gì chưa đẩy lên git là đã mất.
- Khóa bí mật không nằm trong phiên: `GOOGLE_SA_JSON` ở Edge Function Secrets của Supabase, khóa đồng bộ ở vault. Không cần và không được đòi Henry gửi chúng.

## Cách làm việc
- Trả lời Henry bằng tiếng Việt ngắn, dễ hiểu. Trước việc khó: nêu model, mức nỗ lực, thời gian, dung lượng phiên. Dùng Sonnet cho code thường, Opus chỉ cho kế hoạch và rà bảo mật, Haiku cho việc lặt vặt.
- Test giao diện: `npm test` (tsc, eslint, kiểm tra CSS, Playwright). Chạy `pkill -f "vite preview"` trước khi chạy lại, nếu không sẽ phục vụ bản cũ.
- Test cơ sở dữ liệu: khởi động Postgres cục bộ `su postgres -s /bin/bash -c "/usr/lib/postgresql/16/bin/pg_ctl -D /var/tmp/vtvpg/data -o '-p 5544 -k /var/tmp/vtvpg' -l /tmp/pg5544.log start"`, rồi `PSQL="psql -h /var/tmp/vtvpg -p 5544 -U postgres" supabase/tests/run.sh`. Mọi migration phải có test và dòng trong `supabase/migrations/APPLIED.md`, rồi áp dụng bằng công cụ Supabase.
- Deploy Zalo: workflow GitHub `zalo-deploy.yml` (env=testing). QR nằm ở nhánh `zalo-qr`, lấy bằng `git fetch origin +refs/heads/zalo-qr:refs/remotes/origin/zalo-qr`, hết hạn sau khoảng 2 phút. Zalo CHƯA deploy lại từ khi đổi tên Capi.

## Quy tắc bắt buộc
- Không commit khóa, mật khẩu, file CCCD. Không commit `supabase/functions/zalo-oa-webhook/`.
- Không xin hay dán khóa/secret vào chat. Henry tự thêm secret trong dashboard (hoặc qua công cụ tạo secret, giá trị không qua AI).
- Thanh toán đang TẮT. Không bật thanh toán thật khi chưa có ý kiến luật sư và Henry xác nhận rõ.
- Chế độ xem của admin chỉ mở được tài khoản MẪU (`is_sample`), không bao giờ tài khoản khách thật (Luật 91/2025).
- Không ghi CCCD hay ngày sinh lên danh thiếp và tài liệu. Không đưa thông tin đăng nhập admin vào form Zalo.
- Khi một việc bị chặn (proxy từ chối, add_repo bị chặn): không tìm đường vòng.

## Việc đã xong gần đây
Giới hạn chống lạm dụng; phí dịch vụ + voucher 100% (không thu tiền); đổi tên Capi; đồng ý dữ liệu (Luật 91/2025); hướng dẫn lần đầu; chế độ xem của admin (người dùng mới / quán / người làm / admin); đăng nhập muộn nhất có thể; Capi AI soạn tin giúp quán; Google One Tap; Cloudflare Turnstile cho đăng ký bằng số điện thoại; gỡ cờ `viewAsUser` cũ; **nguồn số liệu kế toán** (xem dưới); 05/11/2026: sửa hướng dẫn lần đầu đè lên khung chat Capi (`Tour.tsx` chờ cả `.capyscrim`) và không hiện hướng dẫn người tìm việc cho khách đã trả lời "cần người" (commit `ac7542c` trên `main`; chưa xác nhận log deploy Vercel và chưa chạy Playwright).

## Kế toán tự động (mới)
- File Google Sheets "Capi – Kế toán (US GAAP)", id `1DyaDd3CFvGQixEBZk4qzoDmPBC5vwbWifZxVnro4zXA`: tab Guide, Journal, Chart of Accounts, Income Statement, Balance Sheet, Cash Flow, Metrics. Ngôn ngữ vùng en_US (công thức chỉ ghi đúng với vùng này). Chỉ để theo dõi nội bộ, không thay sổ sách thuế.
- Migration `20261117_accounting_feed.sql`: `acct_daily`, `acct_sync_key` (khóa trong vault), pg_cron `vtv-accounting-sync` chạy phút 20 mỗi giờ gọi edge function `accounting-sync` (verify_jwt tắt, tự kiểm khóa `x-sync-key`). Chỉ ghi số tổng, không dữ liệu cá nhân.
- Ghi vào tab Metrics (mỗi ngày một dòng) và Journal (bút toán `AUTO-YYYY-MM-DD`: Nợ 1100 / Có 4000 khi có phí phải thu; hiện là 0 vì voucher 100%). Tiền nhận thật vẫn nhập tay.
- **Đã chạy (04/11/2026):** sau khi bật Sheets API, gọi thử `accounting-sync` trả `ok:true, days:400`; tab Metrics có số liệu thật, `Metrics!I2` có giờ sync. Tab Journal chưa kiểm chứng vì chưa có phí phải thu. Trước đó từng lỗi `SHEETS_403` khi API chưa bật. Đoạn dưới là ghi chú lúc chưa nối:
- ~~**Chưa chạy:**~~ hàm trả `NOT_CONFIGURED` vì thiếu secret `GOOGLE_SA_JSON`. Henry đang tự làm: bật Google Sheets API (dự án 33844770263), tạo tài khoản dịch vụ `capi-accounting`, chia sẻ file cho e-mail đó (Người chỉnh sửa), thêm secret `GOOGLE_SA_JSON` vào Supabase. Khi Henry báo "xong": gọi thử hàm qua `net.http_post` trong SQL với khóa lấy từ vault (không in khóa ra), kiểm tra `net._http_response`, rồi xem tab Metrics có số liệu và ô `Metrics!I2` có giờ đồng bộ. Việc ghi vào Sheets CHƯA từng được kiểm chứng.

## Việc đang chờ
1. ~~Hoàn tất nối Google~~ — XONG 04/11/2026. Còn lại: kiểm chứng tab Journal khi có ca hoàn thành có phí; xem log deploy Vercel của commit `ac7542c`; chạy Playwright cho bản sửa hướng dẫn lần đầu.
2. Tên miền capiviec.vn: kiểm tra Vercel đã nhận (`get_domain_config`), rồi chuyển hướng viec-thoi-vu.vercel.app sang capiviec.vn. Henry còn phải đặt Supabase Site URL `https://capiviec.vn` và Redirect `https://capiviec.vn/**`, thêm hostname vào Turnstile, thêm origin vào Google OAuth (đang làm).
3. Deploy Zalo để đưa bản Capi mới lên (khi Henry bảo).
4. Henry thử đăng ký bằng số điện thoại trên web thật để xác nhận Turnstile chạy.
5. Việc của Henry: quy tắc Vercel Firewall (300 yêu cầu/phút/IP, API trả 404), 2FA GitHub/Vercel/Supabase/Cloudflare/Google, "làm 2FA admin" khi cần, xoay khóa Gemini/ZaloPay/MoMo, đăng ký Bộ Công Thương (chọn "Nền tảng TMĐT trung gian"), hỏi luật sư (giấy phép dịch vụ việc làm, đánh giá tác động dữ liệu cá nhân, hồ sơ chuyển dữ liệu ra nước ngoài), in lại danh thiếp với capiviec.vn, đăng ký nhãn hiệu "Capi".
6. Tùy chọn: bản mô tả dữ liệu cho luật sư.

## Lưu ý kỹ thuật
- Chưa giải quyết: hướng dẫn lần đầu có thể hiện bước của người tìm việc khi admin ở chế độ "Chủ quán" mẫu (đã đăng nhập tài khoản quán mẫu). Đã sửa trường hợp khách chưa đăng nhập đã trả lời "cần người" (`Tour.tsx`, `guestShop`) nhưng chưa tìm ra nguyên nhân của trường hợp quán mẫu; cần ảnh chụp kèm địa chỉ trang để điều tra.
- Làm 2FA admin khi cần (đã ghi ở mục việc của Henry).
- Gói Supabase Free tự tạm dừng nếu 7 ngày không hoạt động; chưa kiểm tra dự án đang gói nào.
- Không bật CAPTCHA toàn cục của Supabase (có thể làm hỏng đăng nhập Zalo và Google).
- `scripts/check-css-classes.mjs` kiểm cả dấu ngoặc `{}` cân bằng; từng có lỗi CSS dang dở làm hỏng giao diện điện thoại.


## Bản sửa sale 05/11/2026 (đã gộp vào main 06/11/2026)
Web phone: QR mở Mini App; tablet/desktop: Google/email; bỏ form phone/password trên web thật. Có lựa chọn trả trực tiếp sau ca qua choose_direct_pay. Ảnh giữ nguyên JPEG 320px → Storage, bucket thật max 300000 byte, 2 ảnh/31054 byte; chưa load test/quota. Migration 20261118_direct_pay ĐÃ áp dụng lên Supabase thật 06/11/2026 (Henry cho phép) và PR #1 đã gộp vào main. payment_mode vẫn `off`: KHÔNG bật tiền thật (chế độ `live` chưa xây, cần ý kiến luật sư và Henry xác nhận). Web thật đã bỏ đăng ký/đăng nhập số điện thoại+mật khẩu (người cũ chỉ vào qua Zalo Mini App hoặc Google). Zalo: phiên bản 13 đã deploy môi trường Testing 06/11/2026 (Live hiện là bản 11); Henry cần thử QR rồi bấm Submit for review trong trang quản trị Zalo, đợi duyệt, rồi công bố. Còn lại: 10 bài e2e lỗi có sẵn trên main (collab, employer, escrow, tabs, commitments) vì ca mẫu trong `src/lib/seed.ts` có ngày cố định đã hết hạn (j3 hết 03/11); thử dời ngày mẫu theo hôm nay làm hỏng thêm test khác (employer/tabs chế độ free) nên đã hoàn tác, cần sửa cùng với test.
