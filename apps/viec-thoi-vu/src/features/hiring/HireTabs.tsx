import { NavLink } from 'react-router-dom'
import { useI18n } from '../../lib/i18n'

/** Tuyển người = my posts and the people who applied to them (all posts in one list). */
export function HireTabs({ pending }: { pending?: number }) {
  const { t } = useI18n()
  return (
    <nav className="seg pills" aria-label={t('navHiring')}>
      <NavLink to="/app/tin-cua-toi" end className={({ isActive }) => (isActive ? 'on' : '')}>{t('hireJobsTab')}</NavLink>
      <NavLink to="/app/tim-nguoi" className={({ isActive }) => (isActive ? 'on' : '')}>{t('hireFindTab')}</NavLink>
      <NavLink to="/app/ung-vien" className={({ isActive }) => (isActive ? 'on' : '')}>{t('hireCandTab')}{!!pending && <span className="count" style={{ marginLeft: 6 }}>{pending}</span>}</NavLink>
    </nav>
  )
}
