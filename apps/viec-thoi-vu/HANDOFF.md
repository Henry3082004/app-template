# Bàn giao phiên làm việc (cập nhật 04/11/2026)

Đọc file này trước khi làm. Không chứa khóa hay mật khẩu nào, và không bao giờ được thêm vào đây.

## Ứng dụng
- **Capi** (tên cũ "Việc Thời Vụ"): việc làm thời vụ theo ca. Chủ: Trương Minh Khang (Henry), Founder, CÔNG TY TNHH 1TV SAGO SOFTWARE.
- Web: capiviec.vn (mới, đang chờ DNS và cấu hình) và viec-thoi-vu.vercel.app. Zalo Mini App APP_ID 2847107362388346804 (đã duyệt 100%). Zalo OA "Capi - Việc làm parttime 30s".
- Code: `apps/viec-thoi-vu`, repo Henry3082004/app-template, nhánh `main`, Vercel tự deploy. Supabase project `niscqjczfvipxxgdslqs`. Vercel project `prj_veoWYQPASeny4e3fQdX1EoTEiYto`.
- Stack: Vite + React 18 + TypeScript + TanStack Query; Supabase (RLS, hàm SECURITY DEFINER, edge function Deno).

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
Giới hạn chống lạm dụng; phí dịch vụ + voucher 100% (không thu tiền); đổi tên Capi; đồng ý dữ liệu (Luật 91/2025); hướng dẫn lần đầu; chế độ xem của admin (người dùng mới / quán / người làm / admin); đăng nhập muộn nhất có thể; Capi AI soạn tin giúp quán; Google One Tap; Cloudflare Turnstile cho đăng ký bằng số điện thoại; gỡ cờ `viewAsUser` cũ; **nguồn số liệu kế toán** (xem dưới).

## Kế toán tự động (mới)
- File Google Sheets "Capi – Kế toán (US GAAP)", id `1DyaDd3CFvGQixEBZk4qzoDmPBC5vwbWifZxVnro4zXA`: tab Guide, Journal, Chart of Accounts, Income Statement, Balance Sheet, Cash Flow, Metrics. Ngôn ngữ vùng en_US (công thức chỉ ghi đúng với vùng này). Chỉ để theo dõi nội bộ, không thay sổ sách thuế.
- Migration `20261117_accounting_feed.sql`: `acct_daily`, `acct_sync_key` (khóa trong vault), pg_cron `vtv-accounting-sync` chạy phút 20 mỗi giờ gọi edge function `accounting-sync` (verify_jwt tắt, tự kiểm khóa `x-sync-key`). Chỉ ghi số tổng, không dữ liệu cá nhân.
- Ghi vào tab Metrics (mỗi ngày một dòng) và Journal (bút toán `AUTO-YYYY-MM-DD`: Nợ 1100 / Có 4000 khi có phí phải thu; hiện là 0 vì voucher 100%). Tiền nhận thật vẫn nhập tay.
- **Chưa chạy:** hàm trả `NOT_CONFIGURED` vì thiếu secret `GOOGLE_SA_JSON`. Henry đang tự làm: bật Google Sheets API (dự án 33844770263), tạo tài khoản dịch vụ `capi-accounting`, chia sẻ file cho e-mail đó (Người chỉnh sửa), thêm secret `GOOGLE_SA_JSON` vào Supabase. Khi Henry báo "xong": gọi thử hàm qua `net.http_post` trong SQL với khóa lấy từ vault (không in khóa ra), kiểm tra `net._http_response`, rồi xem tab Metrics có số liệu và ô `Metrics!I2` có giờ đồng bộ. Việc ghi vào Sheets CHƯA từng được kiểm chứng.

## Việc đang chờ
1. Hoàn tất nối Google (trên).
2. Tên miền capiviec.vn: kiểm tra Vercel đã nhận (`get_domain_config`), rồi chuyển hướng viec-thoi-vu.vercel.app sang capiviec.vn. Henry còn phải đặt Supabase Site URL `https://capiviec.vn` và Redirect `https://capiviec.vn/**`, thêm hostname vào Turnstile, thêm origin vào Google OAuth (đang làm).
3. Deploy Zalo để đưa bản Capi mới lên (khi Henry bảo).
4. Henry thử đăng ký bằng số điện thoại trên web thật để xác nhận Turnstile chạy.
5. Việc của Henry: quy tắc Vercel Firewall (300 yêu cầu/phút/IP, API trả 404), 2FA GitHub/Vercel/Supabase/Cloudflare/Google, "làm 2FA admin" khi cần, xoay khóa Gemini/ZaloPay/MoMo, đăng ký Bộ Công Thương (chọn "Nền tảng TMĐT trung gian"), hỏi luật sư (giấy phép dịch vụ việc làm, đánh giá tác động dữ liệu cá nhân, hồ sơ chuyển dữ liệu ra nước ngoài), in lại danh thiếp với capiviec.vn, đăng ký nhãn hiệu "Capi".
6. Tùy chọn: bản mô tả dữ liệu cho luật sư.

## Lưu ý kỹ thuật
- Gói Supabase Free tự tạm dừng nếu 7 ngày không hoạt động; chưa kiểm tra dự án đang gói nào.
- Không bật CAPTCHA toàn cục của Supabase (có thể làm hỏng đăng nhập Zalo và Google).
- `scripts/check-css-classes.mjs` kiểm cả dấu ngoặc `{}` cân bằng; từng có lỗi CSS dang dở làm hỏng giao diện điện thoại.
