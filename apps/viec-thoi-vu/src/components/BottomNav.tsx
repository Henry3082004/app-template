import { NavLink } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import { useSession } from '../lib/session'

export function BottomNav() {
  const { t } = useI18n()
  const { profile } = useSession()
  const items = profile?.role === 'employer'
    ? [{ to: '/app/tin-cua-toi', ico: '📋', label: t('navMyJobs') }, { to: '/app/tai-khoan', ico: '👤', label: t('navAccount') }]
    : [
        { to: '/app', ico: '🔎', label: t('navJobs'), end: true },
        { to: '/app/da-ung-tuyen', ico: '📨', label: t('navApplied') },
        { to: '/app/tai-khoan', ico: '👤', label: t('navAccount') },
      ]
  return (
    <nav className="nav">
      <div className="nav-inner">
        {items.map((i) => (
          <NavLink key={i.to} to={i.to} end={'end' in i ? i.end : false} className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="ico">{i.ico}</span>
            {i.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
