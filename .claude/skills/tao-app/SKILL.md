---
name: tao-app
description: Tạo trọn một app mới từ vài câu trả lời. Chỉ hỏi người viết app là gì, ai dùng / dùng để làm gì, và chọn màu sắc + phong cách; Claude tự quyết mọi thứ còn lại theo mặc định tốt nhất, ghi APP_SPEC.md, viết DESIGN_PROMPT.md (prompt để người viết tự gửi Claude Design), build, tự kiểm tra, rồi gửi link web app chạy được cùng prompt thiết kế — không dừng giữa chừng chờ duyệt. Dùng khi người dùng gõ /tao-app, hoặc nói muốn tạo/làm/build một app mới.
---

# /tao-app — Trả lời vài câu, nhận link app

Người viết app chỉ trả lời những điều **chỉ họ mới biết**. Mọi thứ khác Claude tự quyết và làm
liền một mạch tới khi có **link web app chạy được**. Không dừng giữa chừng xin duyệt spec hay thiết
kế — người viết xem link rồi yêu cầu sửa sau.

## Cấu trúc repo (đọc trước)

Repo này là **repo chung cho mọi app** của người viết (môi trường cloud không cho Claude tạo repo
GitHub mới). Phần gốc chứa quy tắc chung (skill này, `CLAUDE.md`, `QUY_TRINH.md`, `BAN_APP.md`,
`TU_SUA_LOI.md`, `APP_SPEC.template.md`). **Mỗi app là một thư mục `apps/<slug>/`** (slug: tên app
không dấu, chữ thường, nối bằng gạch ngang, vd `apps/viec-thoi-vu/`). Mọi file của một app — code,
`APP_SPEC.md`, `DESIGN_PROMPT.md`, `PROGRESS.md`, thư mục `ban/` — nằm trong thư mục của app đó.
Không sửa thư mục của app khác khi đang làm một app. Khi deploy, trỏ thư mục gốc build (base
directory) của Netlify/Railway/Render vào `apps/<slug>/`.

## Bước 1 — Hỏi (lượt 1: câu 1–2; lượt 2: câu 3–4 bằng nút bấm, lựa chọn hợp với app vừa mô tả)

1. **App là gì?** Mô tả một câu, kèm tên tạm nếu có.
2. **Ai dùng app?** Có mấy loại người dùng; mỗi loại **dùng app để làm gì** (1–2 việc chính).
3. **Màu sắc và phong cách?** Hỏi bằng `AskUserQuestion` sau khi đã biết app là gì, gồm 2 câu, mỗi câu
   2–3 lựa chọn cụ thể hợp với app đó (đề xuất hợp nhất đặt đầu, ghi "(Recommended)"):
   - **Màu chủ đạo:** mỗi lựa chọn ghi tên màu + mã hex + cảm giác nó tạo ra (vd "Xanh lá dịu
     #4CAF7D — tươi mát, thư giãn"). Ưu tiên tông dịu, dễ chịu; tránh màu quá chói/gắt.
   - **Phong cách:** biến thể trong khuôn khổ phong cách nền (xem "Hình ảnh" bên dưới), vd "Mềm mại,
     nhiều khoảng trắng" / "Ấm áp, có hình minh họa" / "Gọn gàng, chuyên nghiệp".
   Người viết có màu/thương hiệu sẵn thì họ ghi ở ô Other.
4. **Chạy ở đâu?** Hỏi chung lượt với câu 3, 3 lựa chọn: **"Web" (Recommended)** — mở bằng trình
   duyệt, ra link ngay; **"Zalo Mini App"** — chạy trong Zalo, có thêm bản web để xem trước;
   **"Cả hai"** — cùng một app, chạy cả web lẫn trong Zalo. Nói ngắn trong mô tả lựa chọn rằng Zalo
   Mini App cần người viết tự đăng ký tài khoản Zalo Developer (xem Bước 4, loại Z).
5. **Có bán app này không?** Hỏi chung lượt với câu 3–4, lựa chọn: **"Bán cả Việt Nam và quốc tế"
   (Recommended)**, **"Chỉ Việt Nam"**, **"Chỉ quốc tế"**, **"Chưa bán"**. Khác "Chưa bán" → làm thêm
   Bước 7 (đóng gói để bán). Chọn "Chưa bán" thì sau này người viết nhắn "đóng gói bán app này" là
   chạy Bước 7.

Không hỏi về luồng, bố cục, giọng, giá bán.

Sau khi có câu trả lời, nói ngắn gọn: loại app (nhẹ/đầy đủ — xem Bước 4), model + effort + thời
gian ước tính, rồi làm luôn.

## Bước 2 — Tự quyết và ghi APP_SPEC.md

Tạo thư mục `apps/<slug>/`. Chép `APP_SPEC.template.md` thành `apps/<slug>/APP_SPEC.md` và điền đầy đủ. Mục 0–1 lấy từ câu trả lời; các mục
còn lại suy ra từ mục đích app và người dùng theo các mặc định dưới đây. Có lý do rõ ràng để làm
khác (vd: công cụ văn phòng dùng trên máy tính) thì làm khác và ghi lý do vào spec.

**Bản đồ việc (suy ngược từ việc chính — làm trước khi vẽ luồng):**
Người viết chỉ nói việc chính. Với **từng việc chính của từng loại người dùng**, tự đi qua checklist:
- **Trước:** để làm được việc này cần sẵn có gì (hồ sơ, tin đăng, sản phẩm, danh mục, địa chỉ...)? Ai
  tạo ra nó — chính người này hay **loại người dùng khác**? (vd: sinh viên ứng tuyển → cần tin tuyển
  dụng → chủ shop phải đăng tin → chủ shop phải có hồ sơ shop.) Lặp lại cho tới khi hết thứ cần có.
- **Trong:** cần tìm, lọc, chọn, so sánh gì để ra quyết định?
- **Sau:** xem lại, sửa, hủy, theo dõi trạng thái, nhận thông báo, đánh giá, lịch sử?
- **Tài khoản:** đăng nhập, đăng xuất, sửa thông tin cá nhân.
- **Quản lý:** có cần người duyệt nội dung / xử lý vi phạm / xem thống kê không? (thường để sau)
- **Dữ liệu mẫu:** app mới chưa có dữ liệu thì màn hình đầu có trống trơn không? → cần dữ liệu mẫu
  hoặc màn hình trống hướng dẫn bước đầu tiên.

Ghi kết quả vào mục "Bản đồ việc" của APP_SPEC.md: mỗi việc phụ ghi **thuộc ai**, **phục vụ việc chính
nào**, và **làm ở bản đầu** hay **để sau** (bản đầu chỉ giữ việc phụ mà thiếu thì việc chính không làm
được). Liệt kê bản đồ việc trong bản tóm tắt gửi người viết để họ bổ sung nếu thiếu.

**Luồng chính:**
- Việc chính hoàn thành với **ít lần chạm nhất có thể**; màn hình đầu tiên là nơi làm việc chính.
- Việc phụ không được chặn đường việc chính: chỉ yêu cầu đúng lúc cần (vd: chỉ bắt tạo hồ sơ khi bấm
  ứng tuyển lần đầu, và chỉ hỏi vài trường tối thiểu — phần còn lại điền sau).
- Cho xem trước, chỉ đăng nhập khi thật sự cần (vd: lúc gửi/lưu dữ liệu).
- Chỉ hỏi người dùng thông tin khi cần, form ngắn, tự điền sẵn những gì đã biết.

**Bố cục và nút bấm:**
- Mặc định dùng một tay trên điện thoại: thanh điều hướng dưới đáy; nút chính ở nửa dưới, to (≥48px),
  rộng hết chiều ngang; mỗi màn hình một hành động chính.
- Đăng xuất và hành động nguy hiểm (xóa, hủy) để xa nút chính, luôn hỏi xác nhận.
- Thông tin quan trọng nhất (giá, thời gian, trạng thái) đặt nổi bật trên cùng mỗi thẻ.

**Hình ảnh — phong cách nền của mọi app (người viết đã chọn, luôn áp dụng):**
- **Nhẹ nhàng, dễ chịu, đơn giản mà đầy đủ.** Nhìn vào thấy thoải mái, không rối mắt, nhưng mọi thông
  tin và nút cần cho việc chính đều có mặt — không giấu thứ quan trọng để trông "tối giản".
- **Bo tròn góc rõ ràng:** thẻ ~16–20px, nút dạng viên thuốc (bo tròn hết), ô nhập ~12px, ảnh đại diện tròn.
- Nhiều khoảng trắng, chữ dễ đọc (cỡ chữ thân ≥15px), phân cấp rõ bằng cỡ/đậm chữ thay vì nhiều màu.
- Màu dịu: màu chủ đạo theo lựa chọn ở Bước 1, kèm một tông nhạt của nó làm nền nhấn; nền trang sáng
  ấm/trung tính, thẻ trắng, bóng đổ rất nhẹ; đỏ dịu cho lỗi/gấp. Tránh tương phản gắt, viền đậm, màu
  bão hòa mạnh. Vẫn đảm bảo chữ đủ tương phản để đọc dễ.
- Chuyển động mềm, ngắn; không hiệu ứng lòe loẹt.
- Không dark mode ở bản đầu. Icon nhỏ dùng emoji (không phụ thuộc font/CDN bên ngoài). Logo tạm: ô
  vuông bo tròn chữ viết tắt.
- Phong cách người viết chọn ở Bước 1 chỉ là biến thể trong khuôn khổ trên, không phá các điểm trên.

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
"Để sau". Câu 5 là "Chưa bán" → chưa thu tiền, chưa thanh toán trong app (trừ khi đó chính là việc
chính). Có bán → app tối thiểu là loại B (thanh toán cần nơi lưu tài khoản và nhận webhook; loại A trên
claude.ai không bán được), và Bước 7 lo phần thanh toán.

## Bước 3 — Viết prompt thiết kế (chỉ viết, không tự vẽ)

Viết `DESIGN_PROMPT.md` trong thư mục app: prompt hoàn chỉnh, tự đứng được, để người viết **tự** copy dán
vào Claude Design nếu muốn thiết kế đẹp hơn. Claude không tự tạo thiết kế trên canvas. Gồm: mô tả app
và người dùng; khung hình (vd điện thoại 390×844) và nguyên tắc bố cục; phong cách (mã màu, bo góc,
icon); **danh sách từng màn hình** theo từng loại người dùng bám đúng luồng chính, mỗi màn ghi nội
dung, nút chính và câu chữ mẫu đúng giọng; các trạng thái (đang tải, trống, lỗi, thành công, gợi ý lần
đầu); ghi chú tương tác; phần cần bàn giao (màn hình + trang thành phần). Dữ liệu mẫu thực tế, đúng
ngôn ngữ app. Không thêm gì spec không có. Không chờ người viết — sang Bước 4 ngay.

## Bước 4 — Build và đăng

Phân loại app rồi chọn nơi chạy (connector đã kết nối: Railway, Render, Supabase, Vercel, Netlify, Sentry):

| Loại | Khi nào | Chạy ở đâu |
|---|---|---|
| **A. Nhẹ** | Dùng cá nhân/nhóm nhỏ, không cần tài khoản riêng từng người, không thanh toán | Tool **Artifact** trên claude.ai |
| **B. Có dữ liệu + đăng nhập** | Nhiều người dùng có tài khoản, dữ liệu lưu lâu dài, logic đơn giản (thêm/sửa/xem/lọc) | **Supabase** (database + đăng nhập + lưu file) + giao diện trên **Vercel** |
| **C. Cần server thật** | Logic nghiệp vụ phức tạp, tích hợp bên thứ ba (Zalo, thanh toán), xử lý định kỳ | Server trên **Railway**, hết chỗ → **Render**; database **Supabase** Postgres; giao diện **Vercel** |

Chọn loại **đơn giản nhất** đáp ứng được việc chính. Phân vân giữa B và C → chọn B.

- **Loại A:** theo đúng hướng dẫn của tool Artifact (nạp skill thiết kế artifact trước khi viết trang;
  dữ liệu dùng chung giữa người xem → capability `db` qua skill `artifact-capabilities`, không dùng
  localStorage cho dữ liệu chính). Mặc định private — nhắc người viết tự chia sẻ.
- **Loại B:** tạo project Supabase riêng cho app (gói miễn phí giới hạn số project → hết chỗ thì dùng
  chung project với schema riêng cho app). Bật Row Level Security cho mọi bảng, kiểm tra
  `get_advisors` trước khi gửi link. Frontend gọi Supabase bằng publishable key, deploy lên Vercel.

**Deploy web lên Vercel (đã kiểm chứng với Việc Thời Vụ):** commit + push `apps/<slug>/` lên `main`, rồi
`create_deployment` với `gitSource {type: github, org: Henry3082004, repo: app-template, ref: main, sha}`,
`projectSettings {framework: vite, rootDirectory: apps/<slug>, buildCommand: npm run build, outputDirectory: dist}`,
`target: production` → link `https://<slug>.vercel.app`. Kèm `vercel.json` (rewrite SPA). Biến `VITE_*` công khai để
trong `.env.production` (commit được vì chỉ là khóa công khai). Netlify cần liên kết Git thủ công nên không dùng.
Sandbox không mở được `*.vercel.app` / `*.supabase.co`: kiểm tra link thật bằng `net.http_get` (pg_net) qua
Supabase `execute_sql`; kiểm tra giao diện bằng bản mock (`build:mock`) + Playwright.
Sentry: tổ chức không cho tạo project mới → dùng chung project có sẵn, gắn tag `app:<slug>` (`initialScope`).
- **Loại C:** server dựng theo khung NestJS + Prisma + Dockerfile như Gig Việc. Thử Railway trước;
  không tạo được service (hết hạn mức) → Render (`create_web_service`).
- **Sentry (loại B và C, bắt buộc):** tạo project Sentry cho app (dùng connector Sentry), gắn SDK vào
  frontend (và server nếu có), đặt DSN qua biến môi trường. Gắn tên app + môi trường vào mỗi lỗi.
  Kiểm tra bằng cách cố tình gây một lỗi thử rồi tìm thấy nó trên Sentry trước khi gửi link. Ghi tên
  project Sentry vào APP_SPEC.md. Xem `TU_SUA_LOI.md` để bật lịch tự sửa lỗi.
- **Chi phí:** không bao giờ tạo tài nguyên tốn tiền khi chưa hỏi người viết. Tool báo có phí (vd
  Supabase `get_cost` khác 0) → dừng, báo số tiền và hỏi trước khi `confirm_cost`.
- Không tạo được ở mọi nơi → báo rõ lý do và việc người viết cần làm, đồng thời đăng bản demo giao
  diện bằng Artifact để vẫn có link xem ngay.
- Ghi nơi chạy, tên project/service và link vào APP_SPEC.md.

### Loại Z — Zalo Mini App (khi câu 4 chọn "Zalo Mini App" hoặc "Cả hai")

Zalo là **lớp giao diện thêm vào**, không thay A/B/C: phần dữ liệu/server vẫn chọn như trên, nhưng tối
thiểu là **B** (đăng nhập Zalo cần nơi lưu tài khoản; A trên claude.ai không chạy được trong Zalo).
Đăng nhập Zalo thật cần server/edge function đổi token Zalo → dùng C, hoặc B kèm Supabase Edge Function.

- Giao diện viết bằng React + `zmp-ui` + `zmp-sdk` (khung giống Gig Việc), dùng chung code cho bản web.
- Bài học từ Gig Việc, bắt buộc áp dụng:
  - `<ZMPRouter memoryRouter>` để chạy được cả trong Zalo lẫn dưới đường dẫn con trên web.
  - Không dùng `<Icon>` của zmp-ui (font icon tải từ CDN của Zalo, lỗi thì hiện chữ rác) → dùng emoji.
  - Không dùng class kiểu Tailwind nếu không cài Tailwind; tự định nghĩa class trong file CSS.
  - Gọi `getLocation`/`getAccessToken` của Zalo chỉ chạy được trong Zalo → luôn có phương án dự phòng
    cho bản web (geolocation của trình duyệt, nút "Đăng nhập demo").
- **Gửi ngay** link bản web (Vercel) để xem trước, có nút "Đăng nhập demo" thay cho đăng nhập Zalo.
- **Việc người viết phải tự làm** (cần danh tính thật, Claude không làm thay được) — liệt kê rõ trong
  tóm tắt và trong APP_SPEC.md mục "Quyết định còn mở":
  1. Đăng ký Zalo Developer + tạo Mini App → gửi Claude **App ID** và **App Secret**.
  2. Khai báo domain server/API vào danh sách domain được phép trong Zalo Developer Console.
  3. Deploy lên Zalo: chạy `zmp login` (quét mã QR bằng Zalo) + `zmp deploy` trên máy mình, hoặc tải
     bản build lên Zalo Mini App Studio. Claude chuẩn bị sẵn bản build và hướng dẫn từng lệnh.
- Có App ID/Secret → Claude đặt vào biến môi trường server, bật đăng nhập Zalo thật, kiểm tra lại.

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

## Bước 7 — Đóng gói để bán (khi câu 5 khác "Chưa bán", hoặc người viết yêu cầu sau)

Làm sau khi app đã chạy (Bước 6). Đọc `BAN_APP.md` để biết người viết đã thiết lập sẵn những tài
khoản nào (mục "Đã thiết lập"); thiếu tài khoản nào thì làm phần còn lại và ghi rõ việc người viết cần
làm. Ghi mọi quyết định vào APP_SPEC.md mục "7. Bán".

1. **Gói giá:** tự đề xuất gói Miễn phí (đủ dùng thử việc chính) + gói Trả phí (tháng / năm, giảm ~2
   tháng khi trả năm). Giá VND cho khách Việt, USD cho khách quốc tế, mức hợp với loại app và đối tượng.
   Ghi lý do chọn giá; người viết đổi được. Khóa tính năng theo gói ở **server/database** (Row Level
   Security hoặc kiểm tra phía server), không chỉ ẩn nút ở giao diện.
2. **Thanh toán** (theo thị trường đã chọn):
   - Việt Nam: cổng chuyển khoản QR tự xác nhận (PayOS hoặc SePay — theo cái người viết đã đăng ký).
   - Quốc tế: **Lemon Squeezy** (nền tảng thay người bán lo thuế/hóa đơn quốc tế).
   - Webhook thanh toán cập nhật gói của người dùng trong database (Supabase Edge Function ở loại B,
     endpoint server ở loại C). Kiểm tra chữ ký webhook. Người dùng tự hủy gói được.
   - **Chỉ dùng chế độ thử (test/sandbox).** Chạy thử trọn một lần mua → gói được nâng → hủy → gói hạ.
     Không tự bật chế độ thật (live): đó là việc người viết bật sau khi xem lại, vì nó thu tiền thật.
   - Khóa bí mật (API key, webhook secret) chỉ đặt trong biến môi trường, không bao giờ vào code/commit.
3. **Song ngữ** (khi có khách quốc tế): toàn bộ chữ trong app tách ra file ngôn ngữ vi/en, tự chọn theo
   ngôn ngữ trình duyệt, có nút đổi ngôn ngữ. Giọng tiếng Anh tương đương giọng tiếng Việt trong spec.
4. **Trang giới thiệu (landing page)** — cùng phong cách nền của app: câu giá trị chính, ảnh chụp màn
   hình thật, 3–6 tính năng, bảng giá, câu hỏi thường gặp, nút "Dùng thử miễn phí". Song ngữ nếu có
   khách quốc tế. Thẻ SEO cơ bản + ảnh chia sẻ mạng xã hội. Có tên miền → landing ở tên miền chính,
   app ở `app.`; chưa có → dùng domain `<slug>.vercel.app`.
5. **Trang bắt buộc:** Điều khoản sử dụng, Chính sách bảo mật, Chính sách hoàn tiền — viết theo đúng
   cách app thu thập dữ liệu và thu tiền; ghi chú người viết nên nhờ người am hiểu pháp lý xem lại.
6. **Bộ tài liệu đăng bán** trong thư mục `ban/` (vi + en khi có khách quốc tế):
   - mô tả ngắn (1 câu) và dài; danh sách tính năng; từ khóa;
   - ảnh chụp màn hình tự động bằng Playwright (điện thoại + máy tính) với dữ liệu mẫu đẹp;
   - video demo ngắn (quay luồng chính bằng Playwright);
   - nội dung đăng **Product Hunt** (tên, câu giới thiệu, mô tả, bình luận đầu tiên của người làm);
   - nội dung trang bán **AppSumo** (nếu có khách quốc tế) và **Google Play** (nếu đóng gói Android).
7. **Android (Google Play):** thêm manifest PWA + service worker để app cài được lên màn hình chính;
   chuẩn bị đóng gói thành app Android (Trusted Web Activity). Thử build file `.aab` nếu môi trường cho
   phép; không được thì để sẵn cấu hình và hướng dẫn từng lệnh. Nộp lên Play Console là việc người viết.
8. **Gửi người viết:** link landing page, link app, bảng giá đã chọn, thư mục `ban/`, và **danh sách
   việc người viết phải tự làm** (bật chế độ thanh toán thật, nộp Google Play, đăng Product Hunt...).

## Khi người viết yêu cầu sửa

Sửa APP_SPEC.md trước (và DESIGN_PROMPT.md nếu phần giao diện đổi), rồi sửa code, kiểm tra lại như
Bước 5, đăng lại cùng link. Có thiết kế từ Claude Design gửi lại → chỉnh app bám theo thiết kế đó
(là link Claude Design và app chạy trên Netlify → thử tool `import-claude-design-from-url` của Netlify
trước). Người dùng gặp lỗi → đọc lỗi trên Sentry (loại C) hoặc log Supabase (loại B) trước khi sửa.
