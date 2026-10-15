import type { ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LOGO } from '../lib/capy'
import { useI18n } from '../lib/i18n'
import { useSession } from '../lib/session'
import { Avatar, Btn } from './ui'

interface Item { to: string; ico: string; label: string; end?: boolean; match?: string[] }

/** Phone: bottom bar · tablet: left rail · desktop (≥1280px): top bar. Visibility is pure CSS. */
export function Shell({ children }: { children: ReactNode }) {
  const { t, locale, setLocale } = useI18n()
  const { profile, askAuth } = useSession()
  const { pathname } = useLocation()
  const nav = useNavigate()

  const items: Item[] = profile?.role === 'employer'
    ? [
        { to: '/app/tin-cua-toi', ico: '🏪', label: t('navMyJobs'), match: ['/app/tin', '/app/dang-tin'] },
        { to: '/app/tai-khoan', ico: '👤', label: t('navAccount'), match: ['/app/bang-gia'] },
      ]
    : [
        { to: '/app', ico: '💼', label: t('navJobs'), end: true, match: ['/app/viec'] },
        { to: '/app/da-ung-tuyen', ico: '📋', label: t('navApplied') },
        { to: '/app/tai-khoan', ico: '👤', label: t('navAccount'), match: ['/app/bang-gia'] },
      ]
  const isOn = (i: Item) => (i.end ? pathname === i.to : pathname.startsWith(i.to)) || !!i.match?.some((m) => pathname.startsWith(m))

  const Items = () => (
    <>
      {items.map((i) => (
        <NavLink key={i.to} to={i.to} end={i.end} className={isOn(i) ? 'on' : ''} aria-current={isOn(i) ? 'page' : undefined}>
          <span className="ic" aria-hidden="true">{i.ico}</span>{i.label}
        </NavLink>
      ))}
    </>
  )

  const hire = () => askAuth({ role: 'employer', onDone: (p) => nav(p.role === 'employer' ? '/app/dang-tin' : '/app') })

  return (
    <div className="app">
      <header className="top">
        <Link to="/" className="logo"><img src={LOGO} alt="" />{t('appName')}</Link>
        <nav aria-label="Chính"><Items /></nav>
        <div className="right">
          {profile?.role === 'employer'
            ? <Btn sm onClick={() => nav('/app/dang-tin')}>{t('postJob')}</Btn>
            : !profile && <Btn v="ghost" sm onClick={hire}>{t('iNeedStaff')}</Btn>}
          <div className="lang">
            <button type="button" className={locale === 'vi' ? 'on' : ''} onClick={() => setLocale('vi')}>VI</button>
            <button type="button" className={locale === 'en' ? 'on' : ''} onClick={() => setLocale('en')}>EN</button>
          </div>
          {profile
            ? <Link to="/app/tai-khoan" aria-label={t('navAccount')}><Avatar name={profile.business_name || profile.full_name} /></Link>
            : <Btn sm onClick={() => askAuth({ role: 'seeker' })}>{t('signIn')}</Btn>}
        </div>
      </header>
      <nav className="rail" aria-label="Chính">
        <Link to="/" className="logo"><img src={LOGO} alt="" /><span>{t('appName')}</span></Link>
        <Items />
      </nav>
      <main className="main">{children}</main>
      <nav className="bnav" aria-label="Chính"><Items /></nav>
    </div>
  )
}
