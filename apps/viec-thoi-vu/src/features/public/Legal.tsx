import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../../lib/i18n'
import { LandingBar, LandingFooter } from './Landing'

type Doc = { title: string; updated: string; sections: [string, string[]][] }
type Kind = 'terms' | 'privacy' | 'refund'

// Public contact (override with VITE_SUPPORT_EMAIL if a dedicated support address is created later).
const CONTACT = (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined) || 'khang3082004@gmail.com'
// The operator, as printed on the business registration certificate.
const COMPANY = 'CÔNG TY TNHH 1TV SAGO SOFTWARE'
const TAX_ID = '0319664968'
const ADDRESS = 'Số 860/6A Xô Viết Nghệ Tĩnh, Phường Thạnh Mỹ Tây, Thành phố Hồ Chí Minh, Việt Nam'
const OPERATOR_VI = `${COMPANY} (mã số doanh nghiệp ${TAX_ID}), trụ sở: ${ADDRESS}.`
const OPERATOR_EN = `${COMPANY} (enterprise code ${TAX_ID}), registered office: ${ADDRESS}.`

const docs: Record<'vi' | 'en', Record<Kind, Doc>> = {
  vi: {
    terms: {
      title: 'Điều khoản sử dụng', updated: 'Cập nhật: 28/10/2026',
      sections: [
        ['1. Dịch vụ và đơn vị vận hành', [`Việc Thời Vụ là nền tảng kết nối người tìm việc thời vụ với nhà tuyển dụng, do ${OPERATOR_VI}`, 'Chúng tôi không phải bên tuyển dụng và không tham gia vào thỏa thuận lao động giữa hai bên.']],
        ['2. Tài khoản', ['Bạn phải từ đủ 16 tuổi trở lên để dùng Việc Thời Vụ. Người dưới 16 tuổi không được tạo tài khoản.', 'Bạn đăng nhập bằng Zalo (trong Zalo Mini App) hoặc bằng Google (trên web); không dùng mật khẩu riêng của chúng tôi. Bạn chịu trách nhiệm về tài khoản Zalo/Google của mình và thông tin bạn cung cấp phải đúng sự thật.', 'Mỗi tài khoản có thể dùng vai trò người tìm việc, nhà tuyển dụng hoặc cả hai, và chuyển qua lại trong mục Hồ sơ.']],
        ['3. Đăng tin', ['Tin tuyển phải mô tả đúng công việc, mức lương và thời gian. Cấm tin lừa đảo, thu phí người lao động, đa cấp, nội dung trái pháp luật hoặc phân biệt đối xử.', 'Chúng tôi có quyền ẩn tin hoặc khóa tài khoản vi phạm mà không cần báo trước.']],
        ['4. Gói trả phí', ['Hiện tại ứng dụng miễn phí hoàn toàn; các quy định dưới đây chỉ áp dụng khi chúng tôi bật gói trả phí và sẽ được thông báo trước.', 'Gói Pro dành cho nhà tuyển dụng, tính theo tháng hoặc năm, tự gia hạn cho đến khi bạn hủy. Giá hiển thị tại trang Bảng giá. Người tìm việc luôn miễn phí.']],
        ['5. Trả công và giữ tiền công', ['Hiện tại ứng dụng chưa thu, giữ hay chuyển bất kỳ khoản tiền nào; hai bên tự thỏa thuận và trả công trực tiếp (thường là tiền mặt). Số tiền hiển thị trong mục Thu nhập và Chi phí là số ước tính theo mức lương trong tin. Nhà tuyển dụng xác nhận ca làm (hoàn thành, đến muộn, vắng) để tính uy tín, và có thể ghi nhận đã trả tiền mặt.', 'Khi tính năng giữ tiền được bật: nhà tuyển dụng nạp tiền giữ chỗ, tiền công của ca được giữ và chỉ chuyển cho người làm khi ca được xác nhận hoàn thành, hoặc tự động sau 2 ngày kể từ ngày kết thúc nếu nhà tuyển dụng không xác nhận. Nếu người làm vắng và xác nhận vắng (hoặc không phản hồi trong 48 giờ), tiền được hoàn lại cho nhà tuyển dụng. Khi hai bên không đồng ý, tiền được tạm giữ và chúng tôi xem xét để quyết định. Phí nền tảng được trừ vào phần người làm nhận và hiện rõ trước khi nạp. Hiện tính năng này đang ở chế độ thử, chưa có tiền thật được thu hay chuyển.']],
        ['6. Đánh giá và uy tín', ['Sau mỗi ca hoàn thành, hai bên có thể đánh giá nhau. Đánh giá chỉ hiện khi cả hai đã đánh giá hoặc sau 7 ngày. Uy tín được tính từ các ca làm qua ứng dụng trong 12 tháng gần nhất; mỗi đối tác chỉ tính một đánh giá, ca có giá trị nhỏ không được tính.', 'Đánh giá phải trung thực và dựa trên ca làm thật. Cấm đánh giá giả, tạo nhiều tài khoản hoặc thông đồng để nâng hay hạ uy tín. Chúng tôi có quyền ẩn đánh giá, điều chỉnh uy tín hoặc khóa tài khoản vi phạm.', 'Người được đánh giá không thấy ai là người viết từng đánh giá cụ thể.']],
        ['7. Giới hạn trách nhiệm', ['Chúng tôi không đảm bảo tuyển được người hoặc tìm được việc, và không chịu trách nhiệm về tranh chấp tiền lương, an toàn lao động giữa hai bên. Hãy trao đổi rõ điều kiện trước khi bắt đầu làm.']],
        ['7a. Tin nhắn, chấm công và báo cáo', ['Tin nhắn chỉ dùng để hẹn công việc; cấm dùng để lừa đảo, thu tiền, quấy rối hoặc gửi nội dung trái pháp luật. Nút "Tôi đã đến" và "Tôi đã làm xong" chỉ là báo của người làm; quán vẫn là bên xác nhận ca làm. Bạn có thể báo cáo người vi phạm, chúng tôi xem xét và có quyền ẩn tin, khóa tài khoản vi phạm.']],
        ['8. Dữ liệu cá nhân', ['Cách chúng tôi thu thập và sử dụng dữ liệu được nêu trong Chính sách bảo mật.']],
        ['9. Liên hệ', [`${COMPANY} — Email: ${CONTACT}`]],
      ],
    },
    privacy: {
      title: 'Chính sách bảo mật', updated: 'Cập nhật: 28/10/2026',
      sections: [
        ['1. Đơn vị xử lý dữ liệu', [OPERATOR_VI, `Liên hệ về dữ liệu cá nhân: ${CONTACT}`]],
        ['2. Dữ liệu chúng tôi thu thập và để làm gì', [
          'Đăng nhập bằng Zalo: số điện thoại Zalo đã xác thực (Zalo hỏi bạn trước khi chia sẻ) và tên hiển thị. Dùng để tạo tài khoản, đăng nhập không cần mật khẩu và xác thực bạn là người thật.',
          'Đăng nhập bằng Google (web): địa chỉ email và tên. Dùng để tạo tài khoản và đăng nhập.',
          'Người tìm việc: tên, giới thiệu ngắn, năm sinh, kinh nghiệm, giờ rảnh, ảnh đại diện (tùy chọn). Dùng để nhà tuyển dụng xem hồ sơ khi bạn ứng tuyển.',
          'Nhà tuyển dụng: tên cơ sở, địa chỉ, thành phố, logo (tùy chọn). Dùng để hiển thị trên tin tuyển.',
          'Hoạt động trong ứng dụng: tin tuyển, đơn ứng tuyển, xác nhận ca làm (hoàn thành, đến muộn, vắng), đánh giá. Dùng để vận hành dịch vụ, tính uy tín và giải quyết tranh chấp.',
          'Gợi ý việc phù hợp (câu hỏi nhanh): một mã thiết bị ngẫu nhiên và các câu trả lời bạn chọn (mục đích sử dụng, thành phố, loại việc, giờ rảnh, kinh nghiệm). Dùng để gợi ý việc phù hợp; khi bạn đăng nhập, các câu trả lời được gắn vào tài khoản.',
          'Vị trí: dùng trên thiết bị của bạn để sắp xếp việc theo khoảng cách (không gửi đi). Chỉ khi bạn bấm "Tôi đã đến" và cho phép, vị trí được gửi để tính khoảng cách tới quán; chúng tôi lưu số mét, không lưu tọa độ.',
          'Chấm công: thời điểm bạn báo đã đến, đã làm xong và việc bạn xác nhận đã nhận tiền mặt. Dùng để quán và bạn theo dõi ca làm.',
          'Tin nhắn: nội dung tin nhắn giữa quán và người làm trong ca đã được nhận. Chỉ hai bên thấy, dùng để hai bên hẹn việc.',
          'Thông báo trong ứng dụng: các thông báo gửi cho bạn (có đơn mới, kết quả duyệt, nhắc ca làm, tin nhắn, lời mời). Dùng để nhắc việc và báo tình trạng ca.',
          'Báo cáo: nội dung bạn báo cáo về một người đã làm việc với bạn. Chỉ quản trị viên xem; người bị báo cáo không biết ai báo.',
          'Hồ sơ hiển thị cho quán: chỉ khi bạn tự bật "Cho quán tìm thấy tôi" (mặc định tắt), quán thấy tên rút gọn, khu vực, tuổi, kinh nghiệm, giờ rảnh, ảnh và uy tín của bạn. Quán không thấy số điện thoại; số chỉ được chia sẻ khi bạn nhận việc. Bạn tắt được bất cứ lúc nào.',
          'Việc đã lưu: danh sách việc bạn bấm lưu. Chưa đăng nhập thì chỉ lưu trên máy của bạn; đã đăng nhập thì lưu trong tài khoản, chỉ bạn xem được, bạn bỏ lưu bất cứ lúc nào.',
          'Lời mời làm lại và yêu cầu xóa tài khoản (kèm lý do bạn ghi, nếu có).',
          'Kỹ thuật: ngôn ngữ và một số lựa chọn lưu ngay trên thiết bị; thông tin lỗi kỹ thuật (không kèm nội dung cá nhân) gửi tới Sentry để sửa lỗi.',
        ]],
        ['3. Ai thấy dữ liệu của bạn', ['Số điện thoại của người tìm việc hiện cho nhà tuyển dụng khi họ bấm Nhận đơn của bạn. Số điện thoại của nhà tuyển dụng hiện cho người làm sau khi được nhận; khi tính năng giữ tiền được bật thì chỉ hiện sau khi tiền công của ca đã được giữ.', 'Tên, giới thiệu, năm sinh, kinh nghiệm, giờ rảnh và ảnh của người tìm việc chỉ hiện cho nhà tuyển dụng mà bạn đã ứng tuyển. Tên cơ sở, địa chỉ và logo của nhà tuyển dụng hiện công khai trên tin tuyển.', 'Tin nhắn chỉ hai bên của ca làm xem được. Quán thấy thời điểm và khoảng cách bạn báo đã đến. Khi có báo cáo hoặc tranh chấp, quản trị viên có thể xem tin nhắn liên quan để giải quyết.']],
        ['3a. Dữ liệu uy tín', ['Chúng tôi lưu lịch sử ca làm (hoàn thành, đúng giờ, đến muộn, vắng), số sao, nhãn và nhận xét. Ai cũng xem được số liệu tổng hợp (số ca, tỉ lệ đúng giờ, số sao trung bình). Nhận xét chi tiết chỉ người được đánh giá xem được và không kèm tên người viết. Dữ liệu này dùng để vận hành và giữ an toàn cho ứng dụng; chúng tôi không bán hay chia sẻ cho bên thứ ba.']],
        ['3b. Tài khoản nhận tiền', ['Nếu bạn nhập tài khoản ngân hàng để nhận tiền công, chỉ bạn và quản trị viên xem được, và chỉ dùng để chuyển tiền công cho bạn.']],
        ['4. Lưu trữ và chuyển dữ liệu ra nước ngoài', ['Dữ liệu được lưu tại Supabase (máy chủ Singapore) và được bảo vệ bằng phân quyền theo từng dòng dữ liệu. Trang web được phát hành qua Vercel. Thông tin lỗi kỹ thuật được xử lý bởi Sentry. Đăng nhập do Zalo hoặc Google cung cấp. Vì vậy dữ liệu của bạn có thể được xử lý ở ngoài lãnh thổ Việt Nam; chúng tôi chỉ dùng các nhà cung cấp này để vận hành dịch vụ.']],
        ['5. Thời gian lưu trữ', ['Chúng tôi giữ dữ liệu trong thời gian tài khoản còn hoạt động. Khi bạn yêu cầu xóa, chúng tôi xử lý trong 7 ngày; một số dữ liệu có thể được giữ thêm khi pháp luật yêu cầu hoặc để giải quyết tranh chấp đang diễn ra.']],
        ['6. Quyền của bạn', [`Theo Nghị định 13/2023/NĐ-CP, bạn có quyền được biết, đồng ý hoặc rút lại đồng ý, truy cập, chỉnh sửa, yêu cầu xóa, hạn chế hoặc phản đối việc xử lý dữ liệu của mình, và khiếu nại. Bạn có thể sửa hồ sơ trong mục Hồ sơ, và gửi yêu cầu xóa tài khoản cùng toàn bộ dữ liệu ngay trong Hồ sơ → Xóa tài khoản. Các yêu cầu khác gửi email tới ${CONTACT} kèm tài khoản Zalo hoặc Google đã dùng; chúng tôi phản hồi trong 7 ngày.`]],
        ['7. Chia sẻ', ['Chúng tôi không bán dữ liệu của bạn và không dùng cho quảng cáo của bên thứ ba. Dữ liệu chỉ chia sẻ với nhà cung cấp hạ tầng nêu ở mục 4, với nhà tuyển dụng hoặc người tìm việc theo mục 3, hoặc khi cơ quan nhà nước có thẩm quyền yêu cầu theo pháp luật.', 'Hiện ứng dụng chưa thu tiền. Khi thanh toán được bật, dữ liệu thanh toán do cổng thanh toán (PayOS/SePay/Lemon Squeezy) xử lý; chúng tôi không lưu số thẻ.']],
        ['8. Đồng ý và thay đổi chính sách', ['Khi bạn bấm đăng nhập bằng Zalo hoặc Google và đồng ý chia sẻ thông tin, bạn đồng ý để chúng tôi xử lý dữ liệu như trên. Nếu bạn từ chối chia sẻ số điện thoại, bạn vẫn xem được việc làm nhưng không tạo được tài khoản. Khi chính sách thay đổi, chúng tôi cập nhật ngày ở đầu trang này và thông báo trong ứng dụng nếu thay đổi quan trọng.']],
      ],
    },
    refund: {
      title: 'Chính sách hoàn tiền', updated: 'Cập nhật: 28/10/2026',
      sections: [
        ['1. Hiện chưa thu phí', ['Ứng dụng hiện miễn phí và chưa thu tiền của ai, nên chưa có khoản nào để hoàn. Các mục dưới đây chỉ áp dụng khi chúng tôi bật gói trả phí.']],
        ['2. Hoàn tiền trong 7 ngày', ['Nếu bạn không hài lòng với gói Pro, gửi yêu cầu trong vòng 7 ngày kể từ lần thanh toán đầu tiên để được hoàn 100%.']],
        ['3. Sau 7 ngày', ['Bạn có thể hủy gia hạn bất cứ lúc nào; gói vẫn dùng được đến hết kỳ đã trả. Không hoàn tiền phần thời gian còn lại, trừ khi dịch vụ gặp sự cố kéo dài do lỗi của chúng tôi.']],
        ['4. Cách yêu cầu', [`Gửi email tới ${CONTACT} kèm tài khoản và mã giao dịch. Tiền hoàn về đúng phương thức đã thanh toán trong 5–10 ngày làm việc. Đơn vị vận hành: ${OPERATOR_VI}`]],
      ],
    },
  },
  en: {
    terms: {
      title: 'Terms of Service', updated: 'Updated: Oct 28, 2026',
      sections: [
        ['1. The service and who runs it', [`Việc Thời Vụ connects people looking for short-term work with employers. It is operated by ${OPERATOR_EN}`, 'We are not the employer and are not a party to any work agreement between users.']],
        ['2. Accounts', ['You must be at least 16 years old to use Việc Thời Vụ. People under 16 may not create an account.', 'You sign in with Zalo (inside the Zalo Mini App) or with Google (on the web); we do not use a separate password. You are responsible for your Zalo/Google account, and the information you provide must be truthful.', 'An account can use the job seeker role, the employer role or both, and switch between them under Profile.']],
        ['3. Job posts', ['Posts must accurately describe the work, pay and schedule. Scams, charging workers fees, MLM, illegal or discriminatory content are prohibited.', 'We may hide posts or suspend accounts that break these rules without notice.']],
        ['4. Paid plans', ['The app is currently completely free; the terms below apply only once we turn on paid plans, which we will announce in advance.', 'The Pro plan is for employers, billed monthly or yearly, and renews until cancelled. Prices are shown on the Pricing page. Job seekers always use the service for free.']],
        ['5. Pay and held pay', ['The app currently does not collect, hold or send any money; both sides agree and pay directly (usually in cash). Amounts shown under Income and Spending are estimates based on the pay in each post. Employers confirm each shift (done, late, absent) for reputation and may record a cash payment.', 'Once holding pay is turned on: when an employer deposits for a shift, the pay is held and only released to the worker once the shift is confirmed done, or automatically 2 days after the end date if the employer does not confirm. If the worker was absent and confirms it (or does not reply within 48 hours), the money is refunded to the employer. When both sides disagree, the money stays on hold while we review and decide. The platform fee is taken from the worker’s share and shown before depositing. This feature is currently in test mode: no real money is collected or sent.']],
        ['6. Reviews and reputation', ['After each completed shift both sides may review each other. Reviews appear only when both have reviewed, or after 7 days. Reputation is based on shifts done through the app in the last 12 months; each partner counts once and very small shifts are ignored.', 'Reviews must be honest and based on real shifts. Fake reviews, multiple accounts or collusion to raise or lower reputation are forbidden. We may hide reviews, adjust reputation or suspend accounts that break these rules.', 'The person reviewed does not see who wrote each individual review.']],
        ['7. Limitation of liability', ['We do not guarantee hiring or finding work and are not responsible for pay or workplace disputes between users. Agree on terms before starting work.']],
        ['7a. Messages, attendance and reports', ['Messages are only for agreeing on the work; using them for scams, collecting money, harassment or illegal content is forbidden. "I\'m here" and "I\'m done" are only the worker\'s own notes; the shop still confirms the shift. You can report someone who breaks the rules; we review it and may hide posts or suspend accounts.']],
        ['8. Personal data', ['How we collect and use data is described in the Privacy Policy.']],
        ['9. Contact', [`${COMPANY} — Email: ${CONTACT}`]],
      ],
    },
    privacy: {
      title: 'Privacy Policy', updated: 'Updated: Oct 28, 2026',
      sections: [
        ['1. Who processes your data', [OPERATOR_EN, `Contact about personal data: ${CONTACT}`]],
        ['2. What we collect and why', [
          'Sign-in with Zalo: your verified Zalo phone number (Zalo asks you before sharing it) and display name. Used to create your account, sign you in without a password and confirm you are a real person.',
          'Sign-in with Google (web): your email address and name. Used to create your account and sign you in.',
          'Job seekers: name, short intro, birth year, experience, free time, profile photo (optional). Used so employers can see your profile when you apply.',
          'Employers: business name, address, city, logo (optional). Shown on job posts.',
          'Activity in the app: job posts, applications, shift confirmations (done, late, absent), reviews. Used to run the service, compute reputation and resolve disputes.',
          'Job suggestions (quick questions): a random device ID and the answers you pick (purpose, city, kind of work, free time, experience). Used to suggest jobs; when you sign in, the answers are attached to your account.',
          'Location: used on your device to sort jobs by distance (not sent anywhere). Only when you tap "I\'m here" and allow it, the location is sent to work out the distance to the shop; we store the number of metres, not the coordinates.',
          'Attendance: when you say you arrived, when you say you finished, and when you confirm receiving cash. Used so the shop and you can follow the shift.',
          'Messages: the messages between the shop and the worker on an accepted shift. Only the two of you see them; they are used to agree on the work.',
          'In-app notifications: the notifications sent to you (new applications, decisions, shift reminders, messages, invitations). Used to remind you and report where a shift stands.',
          'Reports: what you report about a person you worked with. Only the admin sees it; the person reported is not told who sent it.',
          'Visibility to shops: only if you switch on "Let shops find me" (off by default), shops see your shortened name, area, age, experience, free times, photo and reputation. Shops do not see your phone number; it is shared only when you accept a job. You can switch it off at any time.',
          'Saved jobs: the jobs you save. Before you sign in they are kept only on your device; after sign-in they are kept in your account, visible only to you, and you can remove them at any time.',
          'Invitations to come back, and account-deletion requests (with the reason you wrote, if any).',
          'Technical: language and a few choices are stored on your device; technical error reports (without personal content) go to Sentry so we can fix bugs.',
        ]],
        ['3. Who sees your data', ["A seeker's phone number is shown to an employer once that employer accepts the application. An employer's phone number is shown to the worker once accepted; when holding pay is turned on, only after the shift's pay is held.", "A seeker's name, intro, birth year, experience, free time and photo are shown only to employers they applied to. An employer's business name, address and logo are public on its job posts.", 'Messages are visible only to the two sides of the shift. The shop sees when and how far from the shop you said you arrived. When there is a report or a dispute, the admin may read the related messages to settle it.']],
        ['3a. Reputation data', ['We store your shift history (completed, on time, late, absent), stars, labels and comments. Anyone can see the summary (shifts done, on-time rate, average stars). Detailed comments are visible only to the person reviewed, without the writer’s name. We use this data to run the app and keep it safe; we do not sell or share it with third parties.']],
        ['3b. Payout account', ['If you add a bank account to receive pay, only you and the administrator can see it, and it is used only to send you your pay.']],
        ['4. Storage and transfers abroad', ['Data is stored with Supabase (Singapore) and protected by row-level access rules. The website is delivered through Vercel. Technical error reports are processed by Sentry. Sign-in is provided by Zalo or Google. So your data may be processed outside Vietnam; we use these providers only to run the service.']],
        ['5. How long we keep it', ['We keep your data while your account is active. When you ask us to delete it we act within 7 days; some data may be kept longer when the law requires it or to settle an ongoing dispute.']],
        ['6. Your rights', [`Under Vietnam’s Decree 13/2023/ND-CP you may be informed, consent or withdraw consent, access, correct, request deletion of, restrict or object to the processing of your data, and complain. Edit your profile under Profile, and send a request to delete your account and all data right there (Profile → Delete account). For anything else email ${CONTACT} with the Zalo or Google account you used; we reply within 7 days.`]],
        ['7. Sharing', ['We never sell your data and do not use it for third-party advertising. We share it only with the infrastructure providers in section 4, with the employer or job seeker as described in section 3, or when a competent authority requires it by law.', 'The app does not collect money yet. Once payments are turned on, payment data is processed by the payment provider (PayOS/SePay/Lemon Squeezy); we do not store card numbers.']],
        ['8. Consent and changes', ['By signing in with Zalo or Google and agreeing to share your information you agree that we process data as described. If you decline to share your phone number you can still browse jobs but cannot create an account. When this policy changes we update the date at the top and tell you in the app for important changes.']],
      ],
    },
    refund: {
      title: 'Refund Policy', updated: 'Updated: Oct 28, 2026',
      sections: [
        ['1. No fees yet', ['The app is currently free and takes no money from anyone, so there is nothing to refund yet. The sections below apply only once we turn on paid plans.']],
        ['2. 7-day refund', ['Not happy with Pro? Request a refund within 7 days of your first payment for a full refund.']],
        ['3. After 7 days', ['Cancel renewal anytime; your plan stays active until the end of the paid period. Remaining time is not refunded unless the service had an extended outage caused by us.']],
        ['4. How to request', [`Email ${CONTACT} with your account and transaction ID. Refunds go back to the original payment method within 5–10 business days. Operator: ${OPERATOR_EN}`]],
      ],
    },
  },
}

export default function Legal({ kind }: { kind: Kind }) {
  const { locale } = useI18n()
  const d = docs[locale][kind]
  useEffect(() => { document.title = `${d.title} — Việc Thời Vụ`; window.scrollTo(0, 0) }, [d.title])
  return (
    <div className="landing">
      <LandingBar />
      <article className="legal">
        <Link to="/app">← Việc Thời Vụ</Link>
        <h1>{d.title}</h1>
        <p className="muted small">{d.updated}</p>
        {d.sections.map(([h, ps]) => (
          <section key={h}>
            <h2>{h}</h2>
            {ps.map((p) => <p key={p}>{p}</p>)}
          </section>
        ))}
      </article>
      <LandingFooter />
    </div>
  )
}
