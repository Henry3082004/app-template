import type { ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LOGO } from '../lib/capy'
import { useI18n, type TKey } from '../lib/i18n'
import { useSession } from '../lib/session'
import { Ic, type IconName } from './Ic'
import { Avatar, Btn } from './ui'

/** Title shown in the desktop top bar for the page at `path`. */
function pageTitle(path: string): TKey {
  if (path.startsWith('/app/da-ung-tuyen') || path.startsWith('/app/cham-cong')) return 'navShifts'
  if (path.startsWith('/app/thu-nhap')) return 'navIncome'
  if (path.startsWith('/app/tai-khoan')) return 'navAccount'
  if (path.startsWith('/app/dang-tin')) return 'postTitle'
  if (path.startsWith('/app/tin')) return 'navMyJobs'
  if (path.startsWith('/app/bang-gia')) return 'pricing'
  if (path.startsWith('/app/quan-tri')) return 'navAdmin'
  return 'navJobs'
}

interface Item { to: string; ico: IconName; label: string; end?: boolean; match?: string[] }

/** Phone: bottom bar · tablet: left rail · desktop (≥1280px): top bar. Visibility is pure CSS. */
export function Shell({ children }: { children: ReactNode }) {
  const { t, locale, setLocale } = useI18n()
  const { profile, askAuth } = useSession()
  const { pathname } = useLocation()
  const nav = useNavigate()

  const items: Item[] = profile?.role === 'employer'
    ? [
        { to: '/app/tin-cua-toi', ico: 'store', label: t('navMyJobs'), match: ['/app/tin', '/app/dang-tin'] },
        { to: '/app/tai-khoan', ico: 'user', label: t('navAccount'), match: ['/app/bang-gia'] },
      ]
    : profile
      ? [
          { to: '/app', ico: 'briefcase', label: t('navJobs'), end: true, match: ['/app/viec'] },
          { to: '/app/cham-cong', ico: 'clipboard', label: t('navShifts'), match: ['/app/da-ung-tuyen'] },
          { to: '/app/thu-nhap', ico: 'wallet', label: t('navIncome') },
          { to: '/app/tai-khoan', ico: 'user', label: t('navAccount'), match: ['/app/bang-gia'] },
        ]
      : [
          { to: '/app', ico: 'briefcase', label: t('navJobs'), end: true, match: ['/app/viec'] },
          { to: '/app/da-ung-tuyen', ico: 'clipboard', label: t('navApplied') },
          { to: '/app/tai-khoan', ico: 'user', label: t('navAccount'), match: ['/app/bang-gia'] },
        ]
  if (profile?.is_admin) items.push({ to: '/app/quan-tri', ico: 'sparkles', label: t('navAdmin') })
  const isOn = (i: Item) => (i.end ? pathname === i.to : pathname.startsWith(i.to)) || !!i.match?.some((m) => pathname.startsWith(m))

  const Items = () => (
    <>
      {items.map((i) => (
        <NavLink key={i.to} to={i.to} end={i.end} className={isOn(i) ? 'on' : ''} aria-current={isOn(i) ? 'page' : undefined}>
          <span className="ic"><Ic n={i.ico} size={22} /></span>{i.label}
        </NavLink>
      ))}
    </>
  )

  const today = new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
  const hire = () => askAuth({ role: 'employer', onDone: (p) => nav(p.role === 'employer' ? '/app/dang-tin' : '/app') })

  return (
    <div className="app">
      {/* desktop (≥1024px): page title + today on top, the menu and who is signed in on the left */}
      <header className="top">
        <div className="toptitle">{t(pageTitle(pathname))}</div>
        <div className="right">
          <span className="today">{t('today')}, {today}</span>
          {profile?.role === 'employer'
            ? <Btn sm onClick={() => nav('/app/dang-tin')}>{t('postJob')}</Btn>
            : !profile && <Btn v="ghost" sm onClick={hire}>{t('iNeedStaff')}</Btn>}
          <div className="lang">
            <button type="button" className={locale === 'vi' ? 'on' : ''} onClick={() => setLocale('vi')}>VI</button>
            <button type="button" className={locale === 'en' ? 'on' : ''} onClick={() => setLocale('en')}>EN</button>
          </div>
        </div>
      </header>
      <nav className="rail" aria-label="Chính">
        <Link to="/" className="logo"><img src={LOGO} alt="" /><span>{t('appName')}</span></Link>
        <div className="navlabel">{t('menuMain')}</div>
        <Items />
        <div className="me">
          {profile
            ? (
              <Link to="/app/tai-khoan" className="mecard">
                <Avatar square={profile.role === 'employer'} name={profile.business_name || profile.full_name} />
                <span><b>{profile.role === 'employer' ? profile.business_name || profile.full_name : profile.full_name}</b><small>{t(profile.role === 'employer' ? 'roleCardEmployer' : 'roleCardSeeker')}</small></span>
              </Link>
            )
            : <Btn block onClick={() => askAuth({ role: 'seeker' })}>{t('signIn')}</Btn>}
        </div>
      </nav>
      <main className="main">{children}</main>
      <nav className="bnav" aria-label="Chính"><Items /></nav>
    </div>
  )
}
