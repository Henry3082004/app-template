import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import { LandingBar, LandingFooter } from './Landing'

type Doc = { title: string; updated: string; sections: [string, string[]][] }
type Kind = 'terms' | 'privacy' | 'refund'

// Set VITE_SUPPORT_EMAIL once Henry picks a public support address.
const CONTACT = (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined) || 'support (sắp cập nhật / coming soon)'

const docs: Record<'vi' | 'en', Record<Kind, Doc>> = {
  vi: {
    terms: {
      title: 'Điều khoản sử dụng', updated: 'Cập nhật: 18/10/2026',
      sections: [
        ['1. Dịch vụ', ['Việc Thời Vụ là nền tảng kết nối người tìm việc thời vụ với nhà tuyển dụng. Chúng tôi không phải bên tuyển dụng và không tham gia vào thỏa thuận lao động giữa hai bên.']],
        ['2. Tài khoản', ['Bạn đăng ký bằng số điện thoại và mật khẩu, chịu trách nhiệm giữ bí mật mật khẩu và thông tin bạn cung cấp phải đúng sự thật.', 'Mỗi tài khoản chọn một vai trò: người tìm việc hoặc nhà tuyển dụng.']],
        ['3. Đăng tin', ['Tin tuyển phải mô tả đúng công việc, mức lương và thời gian. Cấm tin lừa đảo, thu phí người lao động, đa cấp, nội dung trái pháp luật hoặc phân biệt đối xử.', 'Chúng tôi có quyền ẩn tin hoặc khóa tài khoản vi phạm mà không cần báo trước.']],
        ['4. Gói trả phí', ['Hiện tại ứng dụng miễn phí hoàn toàn; các quy định dưới đây chỉ áp dụng khi chúng tôi bật gói trả phí và sẽ được thông báo trước.', 'Gói Pro dành cho nhà tuyển dụng, tính theo tháng hoặc năm, tự gia hạn cho đến khi bạn hủy. Giá hiển thị tại trang Bảng giá. Người tìm việc luôn miễn phí.']],
        ['5. Giữ tiền công (chưa áp dụng)', ['Hiện tại ứng dụng chưa thu, giữ hay chuyển bất kỳ khoản tiền nào; hai bên tự thỏa thuận và trả công trực tiếp. Nhà tuyển dụng vẫn xác nhận ca làm (hoàn thành, đến muộn, vắng) để tính uy tín. Phần dưới đây mô tả cách giữ tiền khi tính năng được bật.', 'Khi nhà tuyển dụng nạp tiền giữ chỗ, tiền công của ca được giữ và chỉ chuyển cho người làm khi ca được xác nhận hoàn thành, hoặc tự động sau 2 ngày kể từ ngày kết thúc nếu nhà tuyển dụng không xác nhận. Nếu người làm vắng và xác nhận vắng (hoặc không phản hồi trong 48 giờ), tiền được hoàn lại cho nhà tuyển dụng. Khi hai bên không đồng ý, tiền được tạm giữ và chúng tôi xem xét để quyết định. Phí nền tảng được trừ vào phần người làm nhận và hiện rõ trước khi nạp. Hiện tính năng này đang ở chế độ thử, chưa có tiền thật được thu hay chuyển.']],
        ['6. Đánh giá và uy tín', ['Sau mỗi ca hoàn thành, hai bên có thể đánh giá nhau. Đánh giá chỉ hiện khi cả hai đã đánh giá hoặc sau 7 ngày. Uy tín được tính từ các ca làm qua ứng dụng trong 12 tháng gần nhất; mỗi đối tác chỉ tính một đánh giá, ca có giá trị nhỏ không được tính.', 'Đánh giá phải trung thực và dựa trên ca làm thật. Cấm đánh giá giả, tạo nhiều tài khoản hoặc thông đồng để nâng hay hạ uy tín. Chúng tôi có quyền ẩn đánh giá, điều chỉnh uy tín hoặc khóa tài khoản vi phạm.', 'Người được đánh giá không thấy ai là người viết từng đánh giá cụ thể.']],
        ['7. Giới hạn trách nhiệm', ['Chúng tôi không đảm bảo tuyển được người hoặc tìm được việc, và không chịu trách nhiệm về tranh chấp tiền lương, an toàn lao động giữa hai bên. Hãy trao đổi rõ điều kiện trước khi bắt đầu làm.']],
        ['8. Liên hệ', [`Email: ${CONTACT}`]],
      ],
    },
    privacy: {
      title: 'Chính sách bảo mật', updated: 'Cập nhật: 18/10/2026',
      sections: [
        ['1. Dữ liệu chúng tôi thu thập', ['Số điện thoại, tên, giới thiệu ngắn (người tìm việc); tên cơ sở, địa chỉ (nhà tuyển dụng); tin tuyển và đơn ứng tuyển. Vị trí chỉ dùng trên máy bạn để sắp xếp việc theo khoảng cách, không gửi lên máy chủ.']],
        ['2. Ai thấy số điện thoại của bạn', ['Số điện thoại của người tìm việc hiện cho nhà tuyển dụng khi họ bấm Nhận đơn. Số điện thoại của nhà tuyển dụng chỉ hiện cho người làm sau khi tiền công của ca đã được giữ. Tên và giới thiệu ngắn của người tìm việc chỉ hiện cho nhà tuyển dụng mà bạn đã ứng tuyển.']],
        ['2a. Dữ liệu uy tín', ['Chúng tôi lưu lịch sử ca làm (hoàn thành, đúng giờ, đến muộn, vắng), số sao, nhãn và nhận xét. Ai cũng xem được số liệu tổng hợp (số ca, tỉ lệ đúng giờ, số sao trung bình). Nhận xét chi tiết chỉ người được đánh giá xem được và không kèm tên người viết. Dữ liệu này dùng để vận hành và giữ an toàn cho ứng dụng; chúng tôi không bán hay chia sẻ cho bên thứ ba.']],
        ['2b. Tài khoản nhận tiền', ['Nếu bạn nhập tài khoản ngân hàng để nhận tiền công, chỉ bạn và quản trị viên xem được, và chỉ dùng để chuyển tiền công cho bạn.']],
        ['3. Lưu trữ', ['Dữ liệu được lưu tại Supabase (máy chủ Singapore) và được bảo vệ bằng phân quyền theo từng dòng dữ liệu. Thông tin lỗi kỹ thuật (không kèm nội dung cá nhân) được gửi tới Sentry để sửa lỗi.']],
        ['4. Quyền của bạn', [`Bạn có thể sửa hồ sơ trong mục Tài khoản. Muốn xóa tài khoản và toàn bộ dữ liệu, gửi email tới ${CONTACT} kèm số điện thoại đã đăng ký; chúng tôi xử lý trong 7 ngày.`]],
        ['5. Chia sẻ', ['Chúng tôi không bán dữ liệu của bạn. Dữ liệu thanh toán do cổng thanh toán (PayOS/SePay/Lemon Squeezy) xử lý, chúng tôi không lưu số thẻ.']],
      ],
    },
    refund: {
      title: 'Chính sách hoàn tiền', updated: 'Cập nhật: 18/10/2026',
      sections: [
        ['1. Hoàn tiền trong 7 ngày', ['Nếu bạn không hài lòng với gói Pro, gửi yêu cầu trong vòng 7 ngày kể từ lần thanh toán đầu tiên để được hoàn 100%.']],
        ['2. Sau 7 ngày', ['Bạn có thể hủy gia hạn bất cứ lúc nào; gói vẫn dùng được đến hết kỳ đã trả. Không hoàn tiền phần thời gian còn lại, trừ khi dịch vụ gặp sự cố kéo dài do lỗi của chúng tôi.']],
        ['3. Cách yêu cầu', [`Gửi email tới ${CONTACT} kèm số điện thoại tài khoản và mã giao dịch. Tiền hoàn về đúng phương thức đã thanh toán trong 5–10 ngày làm việc.`]],
      ],
    },
  },
  en: {
    terms: {
      title: 'Terms of Service', updated: 'Updated: Oct 18, 2026',
      sections: [
        ['1. The service', ['Việc Thời Vụ connects people looking for short-term work with employers. We are not the employer and are not a party to any work agreement between users.']],
        ['2. Accounts', ['You sign up with a phone number and password, keep your password private, and provide truthful information.', 'Each account has one role: job seeker or employer.']],
        ['3. Job posts', ['Posts must accurately describe the work, pay and schedule. Scams, charging workers fees, MLM, illegal or discriminatory content are prohibited.', 'We may hide posts or suspend accounts that break these rules without notice.']],
        ['4. Paid plans', ['The app is currently completely free; the terms below apply only once we turn on paid plans, which we will announce in advance.', 'The Pro plan is for employers, billed monthly or yearly, and renews until cancelled. Prices are shown on the Pricing page. Job seekers always use the service for free.']],
        ['5. Pay held in escrow (not active yet)', ['The app currently does not collect, hold or send any money; both sides agree and pay directly. Employers still confirm each shift (done, late, absent) for reputation. The rest of this section describes escrow once it is turned on.', 'When an employer deposits for a shift, the pay is held and only released to the worker once the shift is confirmed done, or automatically 2 days after the end date if the employer does not confirm. If the worker was absent and confirms it (or does not reply within 48 hours), the money is refunded to the employer. When both sides disagree, the money stays on hold while we review and decide. The platform fee is taken from the worker’s share and shown before depositing. This feature is currently in test mode: no real money is collected or sent.']],
        ['6. Reviews and reputation', ['After each completed shift both sides may review each other. Reviews appear only when both have reviewed, or after 7 days. Reputation is based on shifts done through the app in the last 12 months; each partner counts once and very small shifts are ignored.', 'Reviews must be honest and based on real shifts. Fake reviews, multiple accounts or collusion to raise or lower reputation are forbidden. We may hide reviews, adjust reputation or suspend accounts that break these rules.', 'The person reviewed does not see who wrote each individual review.']],
        ['7. Limitation of liability', ['We do not guarantee hiring or finding work and are not responsible for pay or workplace disputes between users. Agree on terms before starting work.']],
        ['8. Contact', [`Email: ${CONTACT}`]],
      ],
    },
    privacy: {
      title: 'Privacy Policy', updated: 'Updated: Oct 18, 2026',
      sections: [
        ['1. What we collect', ['Phone, name and short intro (seekers); business name and address (employers); job posts and applications. Your location is only used on your device to sort jobs by distance and is never sent to our servers.']],
        ['2. Who sees your phone number', ["A seeker's number is shown to the employer once they accept the application. The employer's number is shown to the worker only after the shift's pay is held. A seeker's name and intro are shown only to employers they applied to."]],
        ['2a. Reputation data', ['We store your shift history (completed, on time, late, absent), stars, labels and comments. Anyone can see the summary (shifts done, on-time rate, average stars). Detailed comments are visible only to the person reviewed, without the writer’s name. We use this data to run the app and keep it safe; we do not sell or share it with third parties.']],
        ['2b. Payout account', ['If you add a bank account to receive pay, only you and the administrator can see it, and it is used only to send you your pay.']],
        ['3. Storage', ['Data is stored with Supabase (Singapore) and protected by row-level access rules. Technical error reports (without personal content) are sent to Sentry so we can fix bugs.']],
        ['4. Your rights', [`Edit your profile under Account. To delete your account and all data, email ${CONTACT} with your registered phone number; we act within 7 days.`]],
        ['5. Sharing', ['We never sell your data. Payments are processed by the payment provider (PayOS/SePay/Lemon Squeezy); we do not store card numbers.']],
      ],
    },
    refund: {
      title: 'Refund Policy', updated: 'Updated: Oct 18, 2026',
      sections: [
        ['1. 7-day refund', ['Not happy with Pro? Request a refund within 7 days of your first payment for a full refund.']],
        ['2. After 7 days', ['Cancel renewal anytime; your plan stays active until the end of the paid period. Remaining time is not refunded unless the service had an extended outage caused by us.']],
        ['3. How to request', [`Email ${CONTACT} with your account phone number and transaction ID. Refunds go back to the original payment method within 5–10 business days.`]],
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
