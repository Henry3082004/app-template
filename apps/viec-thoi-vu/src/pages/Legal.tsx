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
      title: 'Điều khoản sử dụng', updated: 'Cập nhật: 15/10/2026',
      sections: [
        ['1. Dịch vụ', ['Việc Thời Vụ là nền tảng kết nối người tìm việc thời vụ với nhà tuyển dụng. Chúng tôi không phải bên tuyển dụng và không tham gia vào thỏa thuận lao động giữa hai bên.']],
        ['2. Tài khoản', ['Bạn đăng ký bằng số điện thoại và mật khẩu, chịu trách nhiệm giữ bí mật mật khẩu và thông tin bạn cung cấp phải đúng sự thật.', 'Mỗi tài khoản chọn một vai trò: người tìm việc hoặc nhà tuyển dụng.']],
        ['3. Đăng tin', ['Tin tuyển phải mô tả đúng công việc, mức lương và thời gian. Cấm tin lừa đảo, thu phí người lao động, đa cấp, nội dung trái pháp luật hoặc phân biệt đối xử.', 'Chúng tôi có quyền ẩn tin hoặc khóa tài khoản vi phạm mà không cần báo trước.']],
        ['4. Gói trả phí', ['Gói Pro dành cho nhà tuyển dụng, tính theo tháng hoặc năm, tự gia hạn cho đến khi bạn hủy. Giá hiển thị tại trang Bảng giá. Người tìm việc luôn miễn phí.']],
        ['5. Giới hạn trách nhiệm', ['Chúng tôi không đảm bảo tuyển được người hoặc tìm được việc, và không chịu trách nhiệm về tranh chấp tiền lương, an toàn lao động giữa hai bên. Hãy trao đổi rõ điều kiện trước khi bắt đầu làm.']],
        ['6. Liên hệ', [`Email: ${CONTACT}`]],
      ],
    },
    privacy: {
      title: 'Chính sách bảo mật', updated: 'Cập nhật: 15/10/2026',
      sections: [
        ['1. Dữ liệu chúng tôi thu thập', ['Số điện thoại, tên, giới thiệu ngắn (người tìm việc); tên cơ sở, địa chỉ (nhà tuyển dụng); tin tuyển và đơn ứng tuyển. Vị trí chỉ dùng trên máy bạn để sắp xếp việc theo khoảng cách, không gửi lên máy chủ.']],
        ['2. Ai thấy số điện thoại của bạn', ['Số điện thoại chỉ hiện cho bên kia khi nhà tuyển dụng đã bấm Nhận đơn của bạn. Tên và giới thiệu ngắn của người tìm việc chỉ hiện cho nhà tuyển dụng mà bạn đã ứng tuyển.']],
        ['3. Lưu trữ', ['Dữ liệu được lưu tại Supabase (máy chủ Singapore) và được bảo vệ bằng phân quyền theo từng dòng dữ liệu. Thông tin lỗi kỹ thuật (không kèm nội dung cá nhân) được gửi tới Sentry để sửa lỗi.']],
        ['4. Quyền của bạn', [`Bạn có thể sửa hồ sơ trong mục Tài khoản. Muốn xóa tài khoản và toàn bộ dữ liệu, gửi email tới ${CONTACT} kèm số điện thoại đã đăng ký; chúng tôi xử lý trong 7 ngày.`]],
        ['5. Chia sẻ', ['Chúng tôi không bán dữ liệu của bạn. Dữ liệu thanh toán do cổng thanh toán (PayOS/SePay/Lemon Squeezy) xử lý, chúng tôi không lưu số thẻ.']],
      ],
    },
    refund: {
      title: 'Chính sách hoàn tiền', updated: 'Cập nhật: 15/10/2026',
      sections: [
        ['1. Hoàn tiền trong 7 ngày', ['Nếu bạn không hài lòng với gói Pro, gửi yêu cầu trong vòng 7 ngày kể từ lần thanh toán đầu tiên để được hoàn 100%.']],
        ['2. Sau 7 ngày', ['Bạn có thể hủy gia hạn bất cứ lúc nào; gói vẫn dùng được đến hết kỳ đã trả. Không hoàn tiền phần thời gian còn lại, trừ khi dịch vụ gặp sự cố kéo dài do lỗi của chúng tôi.']],
        ['3. Cách yêu cầu', [`Gửi email tới ${CONTACT} kèm số điện thoại tài khoản và mã giao dịch. Tiền hoàn về đúng phương thức đã thanh toán trong 5–10 ngày làm việc.`]],
      ],
    },
  },
  en: {
    terms: {
      title: 'Terms of Service', updated: 'Updated: Oct 15, 2026',
      sections: [
        ['1. The service', ['Việc Thời Vụ connects people looking for short-term work with employers. We are not the employer and are not a party to any work agreement between users.']],
        ['2. Accounts', ['You sign up with a phone number and password, keep your password private, and provide truthful information.', 'Each account has one role: job seeker or employer.']],
        ['3. Job posts', ['Posts must accurately describe the work, pay and schedule. Scams, charging workers fees, MLM, illegal or discriminatory content are prohibited.', 'We may hide posts or suspend accounts that break these rules without notice.']],
        ['4. Paid plans', ['The Pro plan is for employers, billed monthly or yearly, and renews until cancelled. Prices are shown on the Pricing page. Job seekers always use the service for free.']],
        ['5. Limitation of liability', ['We do not guarantee hiring or finding work and are not responsible for pay or workplace disputes between users. Agree on terms before starting work.']],
        ['6. Contact', [`Email: ${CONTACT}`]],
      ],
    },
    privacy: {
      title: 'Privacy Policy', updated: 'Updated: Oct 15, 2026',
      sections: [
        ['1. What we collect', ['Phone, name and short intro (seekers); business name and address (employers); job posts and applications. Your location is only used on your device to sort jobs by distance and is never sent to our servers.']],
        ['2. Who sees your phone number', ['Your number is shown to the other side only after the employer accepts your application. A seeker’s name and intro are only visible to employers they applied to.']],
        ['3. Storage', ['Data is stored with Supabase (Singapore) and protected by row-level access rules. Technical error reports (without personal content) are sent to Sentry so we can fix bugs.']],
        ['4. Your rights', [`Edit your profile under Account. To delete your account and all data, email ${CONTACT} with your registered phone number; we act within 7 days.`]],
        ['5. Sharing', ['We never sell your data. Payments are processed by the payment provider (PayOS/SePay/Lemon Squeezy); we do not store card numbers.']],
      ],
    },
    refund: {
      title: 'Refund Policy', updated: 'Updated: Oct 15, 2026',
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
