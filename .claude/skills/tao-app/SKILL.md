---
name: tao-app
description: Bắt đầu một app mới. Hỏi người viết app lần lượt 6 nhóm câu hỏi (người dùng, luồng chính, bố cục & nút bấm, hình ảnh, cảm giác khi bấm, giọng giao tiếp), ghi kết quả vào APP_SPEC.md và chốt với người viết trước khi viết bất kỳ dòng code nào. Dùng khi người dùng gõ /tao-app, hoặc nói muốn tạo/làm/build một app mới mà repo chưa có APP_SPEC.md đã chốt.
---

# /tao-app — Hỏi đủ trước khi build

Mục tiêu: app làm ra đúng ý người viết ngay từ bản đầu. **Không viết code, không dựng khung
dự án cho tới khi APP_SPEC.md đã được người viết chốt.**

## Cách hỏi

- Hỏi **từng nhóm một**, theo đúng thứ tự bên dưới. Hết nhóm này mới sang nhóm sau.
- Mỗi lượt chỉ 2–4 câu. Dùng tool `AskUserQuestion` khi câu hỏi có lựa chọn rõ ràng (đưa gợi ý sẵn,
  lựa chọn khuyên dùng đặt đầu tiên và ghi "(Khuyên dùng)"); câu cần mô tả tự do thì hỏi bằng lời.
- Dựa vào câu trả lời trước để hỏi câu sau cho sát (vd: đã biết có 2 loại người dùng thì nhóm 2
  hỏi luồng chính cho **từng** loại).
- Nói tiếng Việt, ngắn gọn, không dùng thuật ngữ khó. Người viết không cần biết code.
- Câu trả lời mơ hồ ("đẹp là được", "tùy bạn") → đề xuất 2–3 phương án cụ thể để chọn, không tự đoán.
- Đầu mỗi nhóm nói rõ đang ở nhóm mấy/6 để người viết biết còn bao nhiêu.

## Nhóm 0 — Thông tin chung (hỏi nhanh trước)

- Tên app (tạm thời cũng được) và mô tả app trong **một câu**.
- Chạy trên đâu: web trên điện thoại, web trên máy tính, Zalo Mini App, app Android/iOS?
- Dùng để kinh doanh thế nào (bán thuê bao, thu phí giao dịch, miễn phí...)? — chỉ để hiểu ưu tiên.

## Nhóm 1/6 — Người dùng

- Có **mấy loại** người dùng? (vd: sinh viên + chủ shop; khách + nhân viên + quản lý)
- Với **mỗi loại**: họ là ai (tuổi, nghề, mức thạo công nghệ), dùng app **để đạt được điều gì**,
  dùng bao lâu một lần, trong hoàn cảnh nào (đang đi đường, ngồi văn phòng, vừa làm vừa xem...).
- Loại người dùng nào quan trọng nhất (app phải phục vụ tốt nhất cho ai trước)?

## Nhóm 2/6 — Luồng chính (từ lúc mở app tới lúc xong việc)

Với **từng** loại người dùng:
- Việc **quan trọng nhất** họ mở app để làm là gì? (chỉ 1–2 việc)
- Hiện họ đang làm việc đó bằng cách nào (giấy, Zalo, Excel...) và vướng ở đâu?
- Lần đầu mở app: phải đăng nhập/đăng ký ngay, hay được xem trước rồi mới đăng nhập?

Sau khi hỏi xong, **tự vẽ luồng** cho từng việc chính theo dạng `Mở app → ... → Xong` và đưa
người viết duyệt. Áp nguyên tắc:
- Việc chính hoàn thành trong **tối đa 3 lần chạm** sau khi mở app, nếu được.
- Màn hình đầu tiên sau đăng nhập phải là nơi làm việc chính, không phải trang giới thiệu.
- Chỉ hỏi người dùng thông tin khi thật sự cần, không bắt điền form dài ngay từ đầu.
- Mỗi màn hình chỉ có **một hành động chính**.

## Nhóm 3/6 — Bố cục và nút bấm

- Người dùng cầm máy **một tay hay hai tay**? Màn hình điện thoại, máy tính bảng hay máy tính?
- Thanh điều hướng: dưới đáy (dễ bấm bằng ngón cái, khuyên dùng cho điện thoại) hay menu bên cạnh?
- Những nút nào cần **luôn nhìn thấy**, nút nào giấu vào menu được?

Nguyên tắc mặc định (nói cho người viết biết, cho phép đổi):
- Nút hành động chính đặt ở **nửa dưới màn hình**, trong vùng ngón cái chạm tới; to, đủ dễ bấm
  (tối thiểu 44×44px), rộng hết chiều ngang nếu là hành động quan trọng nhất của màn hình.
- Hành động nguy hiểm (xóa, hủy, đăng xuất) để xa nút chính và luôn hỏi xác nhận.
- Thông tin quan trọng nhất (giá, trạng thái, thời gian) đặt trên cùng của mỗi thẻ/màn hình.

## Nhóm 4/6 — Hình ảnh

- Màu chủ đạo: đã có màu thương hiệu chưa? Nếu chưa, muốn cảm giác gì (tươi trẻ, tin cậy, sang
  trọng, vui nhộn) → đề xuất 2–3 bộ màu cụ thể để chọn.
- Phong cách: tối giản, nhiều hình ảnh, hay kiểu thẻ (card)? Bo góc nhiều hay vuông vức?
- Dùng ảnh thật, hình minh họa, hay chỉ icon? Có logo chưa?
- Có app nào người viết thích giao diện để tham khảo không? (tên app hoặc ảnh chụp màn hình)
- Có cần chế độ tối (dark mode) không?

## Nhóm 5/6 — Cảm giác khi bấm

- Khi bấm nút: có **rung nhẹ** (trên điện thoại) không? Nút có hiệu ứng lún/đổi màu khi nhấn không?
- Chuyển trang: trượt mượt, mờ dần, hay chuyển ngay không hiệu ứng (nhanh nhất)?
- Khi làm xong việc chính (đặt hàng, ứng tuyển...): báo thành công kiểu gì — dòng thông báo nhỏ,
  màn hình chúc mừng, hay hiệu ứng vui (pháo giấy...)?
- Khi đang tải: vòng xoay, khung xám chờ (skeleton), hay thanh tiến trình?

## Nhóm 6/6 — Giọng giao tiếp

- Xưng hô với người dùng: **bạn/mình**, anh/chị/em, quý khách, hay không xưng hô?
- Giọng: thân thiện vui vẻ, lịch sự trang trọng, hay ngắn gọn chuyên nghiệp?
  → đưa 2–3 câu ví dụ cùng một nội dung viết theo từng giọng để người viết chọn.
- Người dùng mới: có cần màn hình hướng dẫn lần đầu không, hay để họ tự khám phá kèm gợi ý nhỏ?
- Báo lỗi thế nào: chỉ nói lỗi, hay nói lỗi **kèm cách sửa**? (khuyên dùng: luôn kèm cách sửa,
  không bao giờ hiện thông báo kỹ thuật như "Error 500")
- Có từ ngữ nào **phải dùng** hoặc **cấm dùng** không?

## Sau khi hỏi xong

1. Điền đầy đủ `APP_SPEC.md` ở gốc repo theo mẫu `APP_SPEC.template.md` (chép mẫu ra rồi điền).
   Mục nào người viết chưa quyết thì ghi rõ "Chưa quyết — tạm dùng: ..." chứ không bỏ trống.
2. Tóm tắt lại cho người viết trong chat: số loại người dùng, việc chính của từng loại, luồng
   chính (số lần chạm), màu, giọng — ngắn gọn, dễ đọc.
3. Hỏi người viết chốt. Có chỉnh sửa → sửa APP_SPEC.md rồi tóm tắt lại.
4. Chốt xong → ghi ngày chốt vào APP_SPEC.md, commit, rồi mới lập kế hoạch build.
   Trước khi build, nêu model nên dùng, mức effort và thời gian ước tính.

## Trong lúc build

- Mọi màn hình, nút, màu, câu chữ phải khớp APP_SPEC.md. Muốn làm khác → hỏi người viết trước.
- Người viết đổi ý giữa chừng → cập nhật APP_SPEC.md trước, rồi mới sửa code.
- Mỗi màn hình làm xong: chụp màn hình (Playwright, kích thước điện thoại) và đối chiếu với spec:
  đếm số lần chạm của luồng chính, kiểm tra nút chính nằm nửa dưới màn hình, câu chữ đúng giọng.
