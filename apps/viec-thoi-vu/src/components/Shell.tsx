import type { ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { LOGO } from '../lib/capy'
import { needsAction } from '../lib/hires'
import { useI18n, type TKey } from '../lib/i18n'
import { useSaved } from '../lib/saved'
import { useSession } from '../lib/session'
import { Ic, type IconName } from './Ic'
import { Avatar, Btn } from './ui'

/** Title shown in the desktop top bar for the page at `path`. */
function pageTitle(path: string): TKey {
  if (path.startsWith('/app/da-luu')) return 'savedTitle'
  if (path.startsWith('/app/da-ung-tuyen') || path.startsWith('/app/cham-cong')) return 'navShifts'
  if (path.startsWith('/app/thu-nhap')) return 'navIncome'
  if (path.startsWith('/app/tai-khoan')) return 'navAccount'
  if (path.startsWith('/app/dang-tin')) return 'postTitle'
  if (path.startsWith('/app/thong-bao')) return 'notifTitle'
  if (path.startsWith('/app/ca-lam')) return 'navEmpShifts'
  if (path.startsWith('/app/chi-phi')) return 'navSpend'
  if (path.startsWith('/app/ung-vien') || path.startsWith('/app/tin')) return 'navHiring'
  if (path.startsWith('/app/bang-gia')) return 'pricing'
  if (path.startsWith('/app/quan-tri')) return 'navAdmin'
  return 'navJobs'
}

interface Item { to: string; ico: IconName; label: string; end?: boolean; match?: string[]; badge?: number; cart?: boolean }

/** Phone: bottom bar · tablet: left rail · desktop (≥1280px): top bar. Visibility is pure CSS. */
export function Shell({ children }: { children: ReactNode }) {
  const { t, locale, setLocale } = useI18n()
  const { profile, askAuth } = useSession()
  const { pathname } = useLocation()
  const nav = useNavigate()

  // shifts the shop still has to confirm → red number on "Ca làm"
  const [toConfirm, setToConfirm] = useState(0)
  const employer = profile?.role === 'employer'
  useEffect(() => {
    if (!employer) { setToConfirm(0); return }
    let live = true
    api.myHires().then((l) => { if (live) setToConfirm(needsAction(l)) }).catch(() => undefined)
    return () => { live = false }
  }, [employer, pathname])

  // unread notifications → red number on the bell (refreshed when you move around, every minute, and when one is opened)
  const [unread, setUnread] = useState(0)
  const saved = useSaved()
  const refreshUnread = useCallback(() => {
    if (!profile) { setUnread(0); return }
    api.unreadCount().then(setUnread).catch(() => undefined)
  }, [profile?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    refreshUnread()
    const timer = setInterval(refreshUnread, 60_000)
    window.addEventListener('vtv-notif', refreshUnread)
    return () => { clearInterval(timer); window.removeEventListener('vtv-notif', refreshUnread) }
  }, [refreshUnread, pathname])
  const bell = (cls: string) => profile && (
    <button type="button" className={'bell ' + cls} aria-label={t('notifBell')} onClick={() => nav('/app/thong-bao')}>
      <Ic n="bell" size={20} />{unread > 0 && <i className="bellbadge">{unread > 9 ? '9+' : unread}</i>}
    </button>
  )

  const items: Item[] = profile?.role === 'employer'
    ? [
        { to: '/app/tin-cua-toi', ico: 'store', label: t('navHiring'), match: ['/app/tin', '/app/dang-tin', '/app/ung-vien'] },
        { to: '/app/ca-lam', ico: 'clipboard', label: t('navEmpShifts'), badge: toConfirm },
        { to: '/app/chi-phi', ico: 'wallet', label: t('navSpend') },
        { to: '/app/tai-khoan', ico: 'user', label: t('navAccount'), match: ['/app/bang-gia'] },
      ]
    : profile
      ? [
          { to: '/app', ico: 'briefcase', label: t('navJobs'), end: true, match: ['/app/viec'] },
          { to: '/app/cham-cong', ico: 'clipboard', label: t('navShifts'), match: ['/app/da-ung-tuyen'] },
          { to: '/app/da-luu', ico: 'cart', label: t('savedTab'), badge: saved.ids.length, cart: true },
          { to: '/app/thu-nhap', ico: 'wallet', label: t('navIncome') },
          { to: '/app/tai-khoan', ico: 'user', label: t('navAccount'), match: ['/app/bang-gia'] },
        ]
      : [
          { to: '/app', ico: 'briefcase', label: t('navJobs'), end: true, match: ['/app/viec'] },
          { to: '/app/da-ung-tuyen', ico: 'clipboard', label: t('navApplied') },
          { to: '/app/da-luu', ico: 'cart', label: t('savedTab'), badge: saved.ids.length, cart: true },
          { to: '/app/tai-khoan', ico: 'user', label: t('navAccount'), match: ['/app/bang-gia'] },
        ]
  if (profile?.is_admin) items.push({ to: '/app/quan-tri', ico: 'sparkles', label: t('navAdmin') })
  const isOn = (i: Item) => (i.end ? pathname === i.to : pathname.startsWith(i.to)) || !!i.match?.some((m) => pathname.startsWith(m))

  const Items = () => (
    <>
      {items.map((i) => (
        <NavLink key={i.to} to={i.to} end={i.end} className={isOn(i) ? 'on' : ''} aria-current={isOn(i) ? 'page' : undefined}>
          <span className="ic" data-cart={i.cart || undefined}><Ic n={i.ico} size={22} />{!!i.badge && <i className={'navbadge' + (i.cart ? ' cart' : '')} aria-label={String(i.badge)}>{i.badge > 99 ? '99+' : i.badge}</i>}</span>{i.label}
        </NavLink>
      ))}
    </>
  )

  const today = new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-GB', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date())
  const hire = () => askAuth({ role: 'employer', onDone: (p) => nav(p.role === 'employer' ? '/app/dang-tin' : '/app') })

  return (
    <div className="app">
      {/* desktop (≥1024px): page title + today on top, the menu and who is signed in on the left */}
      <header className="top">
        <div className="toptitle">{t(pageTitle(pathname))}</div>
        <div className="right">
          <span className="today">{today}</span>
          {profile?.role === 'employer'
            ? <Btn sm onClick={() => nav('/app/dang-tin')}>{t('postJob')}</Btn>
            : !profile && <Btn v="ghost" sm onClick={hire}>{t('iNeedStaff')}</Btn>}
          {bell('inbar')}
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
      {bell('fab')}
      <main className="main">{children}</main>
      <nav className="bnav" aria-label="Chính"><Items /></nav>
    </div>
  )
}
