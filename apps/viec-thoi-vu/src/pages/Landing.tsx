import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { JobCard } from '../components/JobCard'
import { useI18n } from '../lib/i18n'
import { seedJobs } from '../lib/seed'
import type { Job } from '../lib/types'
import { PricingCards } from './Pricing'

const preview: Job[] = seedJobs.slice(0, 3).map((j) => ({ ...j, filled: 0, status: 'open', created_at: '' }))

const copy = {
  vi: {
    h1a: 'Việc thời vụ gần bạn —', h1b: 'tìm nhanh, nhận việc trong ngày',
    lead: 'Người tìm việc lướt xem việc ngắn hạn gần nhà và ứng tuyển bằng 2 lần chạm. Cửa hàng, kho, nông trại, sự kiện đăng tin trong 1 phút và chọn người ngay.',
    cta1: 'Tìm việc ngay', cta2: 'Đăng tin tuyển',
    whyTitle: 'Gọn cho cả hai bên', whySub: 'Không cần CV, không chờ tin nhắn trôi trong nhóm.',
    seekers: 'Người tìm việc', employers: 'Nhà tuyển dụng',
    s: [['📍', 'Việc gần bạn trước', 'Bật vị trí là thấy việc gần nhất, kèm khoảng cách.'], ['⚡', 'Ứng tuyển 2 lần chạm', 'Chạm vào việc, bấm Ứng tuyển — xong.'], ['📞', 'Biết ngay khi được nhận', 'Được nhận là thấy số điện thoại để gọi hoặc nhắn Zalo.']],
    e: [['📝', 'Đăng tin 1 phút', 'Form tự điền theo tin trước, chỉ sửa ngày và số người.'], ['👥', 'Chọn người 1 chạm', 'Xem ứng viên, bấm Nhận, có số điện thoại ngay.'], ['✅', 'Tự đóng khi đủ người', 'Không còn bị gọi hỏi khi đã tuyển xong.']],
    priceTitle: 'Bảng giá', priceSub: 'Người tìm việc luôn miễn phí.',
    faqTitle: 'Câu hỏi thường gặp',
    faq: [['Người tìm việc có phải trả phí không?', 'Không. Người tìm việc dùng miễn phí hoàn toàn.'], ['Khi nào tôi thấy số điện thoại của bên kia?', 'Chỉ khi nhà tuyển dụng bấm Nhận. Trước đó số của hai bên được giữ kín.'], ['Gói Miễn phí có giới hạn gì?', 'Mỗi nhà tuyển dụng mở tối đa 2 tin cùng lúc. Gói Pro không giới hạn và có nhãn Gấp lên đầu danh sách.'], ['Có dùng trong Zalo được không?', 'Có — app chạy trên web và sắp có trên Zalo Mini App.']],
    terms: 'Điều khoản', privacy: 'Bảo mật', refund: 'Hoàn tiền',
  },
  en: {
    h1a: 'Short-term jobs near you —', h1b: 'find fast, start today',
    lead: 'Job seekers browse nearby short-term work and apply in 2 taps. Shops, warehouses, farms and events post in a minute and pick people right away.',
    cta1: 'Find a job', cta2: 'Post a job',
    whyTitle: 'Simple for both sides', whySub: 'No CVs, no messages lost in group chats.',
    seekers: 'Job seekers', employers: 'Employers',
    s: [['📍', 'Nearby jobs first', 'Share your location to see the closest jobs with distance.'], ['⚡', 'Apply in 2 taps', 'Tap a job, tap Apply — done.'], ['📞', 'Know when you are hired', "Once accepted you'll see the phone number to call or message."]],
    e: [['📝', 'Post in a minute', 'The form fills from your last post; just change dates and headcount.'], ['👥', 'Pick people in one tap', 'Review applicants, tap Accept, get their number instantly.'], ['✅', 'Auto-closes when full', 'No more calls after the spots are filled.']],
    priceTitle: 'Pricing', priceSub: 'Always free for job seekers.',
    faqTitle: 'FAQ',
    faq: [['Do job seekers pay?', 'No. It is completely free for job seekers.'], ['When do I see the other side’s phone number?', 'Only after the employer accepts. Until then both numbers stay private.'], ['What are the Free plan limits?', 'Employers can have up to 2 open posts at once. Pro is unlimited and adds the Urgent badge.'], ['Does it work in Zalo?', 'Yes — it runs on the web and is coming to Zalo Mini App.']],
    terms: 'Terms', privacy: 'Privacy', refund: 'Refunds',
  },
}

export function LegalFooter() {
  const { locale } = useI18n()
  const c = copy[locale]
  return (
    <footer className="l-foot">
      <span>© 2026 Việc Thời Vụ</span>
      <nav><Link to="/dieu-khoan">{c.terms}</Link><Link to="/bao-mat">{c.privacy}</Link><Link to="/hoan-tien">{c.refund}</Link></nav>
    </footer>
  )
}

export function LandingHeader() {
  const { locale, setLocale } = useI18n()
  return (
    <header className="l-head">
      <Link to="/" className="l-brand"><div className="logo">VT</div>Việc Thời Vụ</Link>
      <button className="l-lang" onClick={() => setLocale(locale === 'vi' ? 'en' : 'vi')}>{locale === 'vi' ? 'English' : 'Tiếng Việt'}</button>
    </header>
  )
}

export default function Landing() {
  const { locale } = useI18n()
  const nav = useNavigate()
  const c = copy[locale]
  useEffect(() => { document.title = locale === 'vi' ? 'Việc Thời Vụ — tìm việc thời vụ gần bạn' : 'Việc Thời Vụ — short-term jobs near you' }, [locale])
  return (
    <div className="landing">
      <div className="l-wrap">
        <LandingHeader />
        <section className="hero">
          <div>
            <h1>{c.h1a} <span>{c.h1b}</span></h1>
            <p className="lead">{c.lead}</p>
            <div className="ctas">
              <Link className="btn primary" to="/app">{c.cta1}</Link>
              <Link className="btn secondary" to="/app?tuyen=1">{c.cta2}</Link>
            </div>
          </div>
          <div className="phone-frame" aria-hidden="true">
            <div className="phone-screen">
              {preview.map((j) => <JobCard key={j.id} job={j} onOpen={() => nav('/app')} />)}
            </div>
          </div>
        </section>

        <section className="l-section">
          <h2>{c.whyTitle}</h2>
          <p className="sub">{c.whySub}</p>
          <div className="benefits">
            {[{ title: c.seekers, items: c.s }, { title: c.employers, items: c.e }].map((col) => (
              <div className="card benefit-col" key={col.title}>
                <h3>{col.title}</h3>
                {col.items.map(([ico, h, p]) => (
                  <div className="benefit" key={h}>
                    <div className="ico">{ico}</div>
                    <div><div className="bold">{h}</div><div className="muted small">{p}</div></div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="l-section">
          <h2>{c.priceTitle}</h2>
          <p className="sub">{c.priceSub}</p>
          <div className="pricing"><PricingCards onPro={() => nav('/app/bang-gia')} /></div>
        </section>

        <section className="l-section">
          <h2>{c.faqTitle}</h2>
          <div className="faq">
            {c.faq.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
          </div>
        </section>
        <LegalFooter />
      </div>
    </div>
  )
}
