import { NavLink } from 'react-router-dom'
import { useI18n } from '../../lib/i18n'

/** Chấm công and Đơn ứng tuyển are two views of the same thing: what I applied for and when I work. */
export function ShiftTabs() {
  const { t } = useI18n()
  return (
    <nav className="seg pills" aria-label={t('navShifts')}>
      <NavLink to="/app/cham-cong" end className={({ isActive }) => (isActive ? 'on' : '')}>{t('shiftsTab')}</NavLink>
      <NavLink to="/app/da-ung-tuyen" className={({ isActive }) => (isActive ? 'on' : '')}>{t('applicationsTab')}</NavLink>
    </nav>
  )
}
