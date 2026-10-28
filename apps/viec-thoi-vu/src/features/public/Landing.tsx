import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Ic, type IconName } from '../../components/Ic'
import { JobCard } from '../jobs/JobCard'
import { capy, LOGO } from '../../lib/capy'
import { useAppConfig } from '../../lib/config'
import { useI18n } from '../../lib/i18n'
import { seedJobs } from '../../lib/seed'
import type { Job } from '../../lib/types'
import { PricingCards } from './Pricing'

const preview: Job[] = seedJobs.slice(0, 3).map((j) => ({ ...j, filled: 0, status: 'open', created_at: '' }))

const copy = {
  vi: {
    h1a: 'Việc thời vụ gần bạn —', h1b: 'tìm nhanh, nhận việc trong ngày',
    lead: 'Xem việc quanh bạn, ứng tuyển một chạm. Cần người? Đăng tin chỉ mất 1 phút. 🙌',
    cta1: 'Tìm việc ngay', cta2: 'Đăng tin tuyển', open: 'Mở app', nav: ['Lợi ích', 'Bảng giá', 'Hỏi đáp'],
    seekers: 'Cho người tìm việc', employers: 'Cho nhà tuyển dụng',
    s: [['pin', 'Việc gần bạn', 'Sắp xếp theo khoảng cách, thấy ngay lương và ca.'], ['zap', 'Ứng tuyển một chạm', 'Không cần CV, chỉ tên và số điện thoại.'], ['phone', 'Liên hệ trực tiếp', 'Được nhận là có số chủ việc, gọi hoặc nhắn Zalo luôn.']],
    e: [['sparkles', 'Đăng tin 1 phút', 'Tin sau điền sẵn theo tin trước.'], ['users', 'Chọn người dễ dàng', 'Xem lời nhắn, nhận hoặc từ chối bằng một nút.'], ['target', 'Đúng đợt, đúng ca', 'Đặt số chỗ theo từng đợt cần người; đủ người tin tự đóng.']],
    priceTitle: 'Bảng giá đơn giản', priceSub: 'Người tìm việc luôn miễn phí.',
    faqTitle: 'Câu hỏi thường gặp',
    faq: [['Tôi có cần đăng nhập để xem việc không?', 'Không. Bạn chỉ đăng ký khi bấm Ứng tuyển.'], ['Ứng tuyển có mất phí không?', 'Người tìm việc luôn miễn phí.'], ['Bao lâu thì nhà tuyển dụng liên hệ?', 'Thường trong ngày. Khi được nhận, bạn thấy số điện thoại để gọi hoặc nhắn Zalo.'], ['Có mất phí không?', 'Hiện tại Việc Thời Vụ miễn phí hoàn toàn cho cả người tìm việc và nhà tuyển dụng.'], ['Tôi có dùng được trong Zalo không?', 'Có, Việc Thời Vụ chạy cả trên web và trong Zalo Mini App.']],
    bandT: 'Sẵn sàng tìm việc đầu tiên?', bandS: 'Mở app và xem việc quanh bạn ngay hôm nay.',
    terms: 'Điều khoản', privacy: 'Bảo mật', refund: 'Hoàn tiền',
  },
  en: {
    h1a: 'Short-term jobs near you —', h1b: 'find fast, start today',
    lead: 'See jobs around you and apply in one tap. Need people? Post in 1 minute. 🙌',
    cta1: 'Find a job', cta2: 'Post a job', open: 'Open app', nav: ['Benefits', 'Pricing', 'FAQ'],
    seekers: 'For job seekers', employers: 'For employers',
    s: [['pin', 'Jobs near you', 'Sorted by distance, with pay and shift at a glance.'], ['zap', 'Apply in one tap', 'No CV — just your name and phone number.'], ['phone', 'Direct contact', "Once you're accepted you get the employer's number to call or message."]],
    e: [['sparkles', 'Post in 1 minute', 'New posts are pre-filled from the last one.'], ['users', 'Choose people easily', 'Read messages, accept or decline with one button.'], ['target', 'Right shift, right time', 'Set spots per round; posts close automatically when full.']],
    priceTitle: 'Simple pricing', priceSub: 'Always free for job seekers.',
    faqTitle: 'FAQ',
    faq: [['Do I need to sign in to browse jobs?', 'No. You only sign up when you tap Apply.'], ['Does applying cost anything?', 'Job seekers always use it for free.'], ['How soon will employers get in touch?', "Usually the same day. Once you're accepted you'll see their phone number."], ['Does it cost anything?', 'Right now Việc Thời Vụ is completely free for both job seekers and employers.'], ['Does it work in Zalo?', 'Yes — on the web and as a Zalo Mini App.']],
    bandT: 'Ready for your first job?', bandS: 'Open the app and see jobs around you today.',
    terms: 'Terms', privacy: 'Privacy', refund: 'Refunds',
  },
}

export function LandingBar() {
  const { locale, setLocale, t } = useI18n()
  const cfg = useAppConfig()
  const c = copy[locale]
  return (
    <header className="bar">
      <Link to="/" className="logo"><img src={LOGO} alt="" />{t('appName')}</Link>
      <nav><a href="/gioi-thieu#loi-ich">{c.nav[0]}</a>{cfg?.billing === 'on' && <a href="/gioi-thieu#bang-gia">{c.nav[1]}</a>}<a href="/gioi-thieu#hoi-dap">{c.nav[2]}</a></nav>
      <span className="sp" />
      <div className="lang">
        <button type="button" className={locale === 'vi' ? 'on' : ''} onClick={() => setLocale('vi')}>VI</button>
        <button type="button" className={locale === 'en' ? 'on' : ''} onClick={() => setLocale('en')}>EN</button>
      </div>
      <Link className="btn btn-primary sm" to="/app">{c.open}</Link>
    </header>
  )
}

export function LandingFooter() {
  const { locale, t } = useI18n()
  const c = copy[locale]
  return (
    <footer>
      <div className="wrap">
        <div className="logo"><img src={LOGO} alt="" />{t('appName')}</div>
        <div className="links"><Link to="/dieu-khoan">{c.terms}</Link><Link to="/bao-mat">{c.privacy}</Link><Link to="/hoan-tien">{c.refund}</Link></div>
        <div>© 2026 Việc Thời Vụ</div>
      </div>
    </footer>
  )
}

export default function Landing() {
  const { locale } = useI18n()
  const cfg = useAppConfig()
  const nav = useNavigate()
  const c = copy[locale]
  useEffect(() => { document.title = locale === 'vi' ? 'Việc Thời Vụ — tìm việc thời vụ gần bạn' : 'Việc Thời Vụ — short-term jobs near you' }, [locale])
  return (
    <div className="landing">
      <LandingBar />
      <div className="hero-bg"><div className="wrap hero">
        <div>
          <h1>{c.h1a} <span style={{ color: 'var(--p)' }}>{c.h1b}</span></h1>
          <p>{c.lead}</p>
          <div className="cta2"><Link className="btn btn-primary" to="/app">{c.cta1}</Link><Link className="btn btn-ghost" to="/app?tuyen=1">{c.cta2}</Link></div>
        </div>
        <div className="pwrap">
          <img className="mascot" src={capy('wave')} alt="" />
          <div className="phoneframe" aria-hidden="true">
            <div className="logo" style={{ fontSize: 13 }}><img src={LOGO} alt="" style={{ width: 24, height: 24, borderRadius: 8 }} />Việc Thời Vụ</div>
            <div className="sk"><Ic n="search" size={13} /> …</div>
            {preview.map((j) => <JobCard key={j.id} job={j} onOpen={() => nav('/app')} />)}
          </div>
        </div>
      </div></div>

      <section id="loi-ich"><div className="wrap"><div className="two3">
        {[{ h: c.seekers, items: c.s }, { h: c.employers, items: c.e }].map((col) => (
          <div key={col.h}><h3>{col.h}</h3><div className="ben">{col.items.map(([e, b, s]) => <div className="card" key={b}><span className="e"><Ic n={e as IconName} size={22} /></span><div><b>{b}</b><span className="t">{s}</span></div></div>)}</div></div>
        ))}
      </div></div></section>

      {cfg?.billing === 'on' && <section id="bang-gia" style={{ background: '#fff' }}><div className="wrap">
        <h2 style={{ textAlign: 'center', marginBottom: 6 }}>{c.priceTitle}</h2><p className="sub" style={{ textAlign: 'center', marginBottom: 20 }}>{c.priceSub}</p>
        <div className="pr"><PricingCards onPro={() => nav('/app/bang-gia')} /></div>
      </div></section>}

      <section id="hoi-dap"><div className="wrap">
        <h2 style={{ textAlign: 'center' }}>{c.faqTitle}</h2>
        <div className="faq">{c.faq.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
      </div></section>

      <section style={{ paddingTop: 0 }}><div className="wrap"><div className="cband">
        <img src={capy('cheer')} alt="" />
        <h2 style={{ marginBottom: 8 }}>{c.bandT}</h2><div>{c.bandS}</div>
        <Link className="btn" to="/app">{c.cta1}</Link>
      </div></div></section>
      <LandingFooter />
    </div>
  )
}
