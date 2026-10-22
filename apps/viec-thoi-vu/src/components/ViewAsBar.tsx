import { useNavigate } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import { useSession } from '../lib/session'
import { Ic } from './Ic'

/** While an admin looks at the app as a normal user, this pill is always on screen with the way back. */
export function ViewAsBar() {
  const { t } = useI18n()
  const nav = useNavigate()
  const { viewAsUser, setViewAsUser } = useSession()
  if (!viewAsUser) return null
  return (
    <aside className="viewbar" aria-label={t('viewAsOn')}>
      <Ic n="eye" size={16} /><span>{t('viewAsOn')}</span>
      <button type="button" onClick={() => { setViewAsUser(false); nav('/app/tai-khoan') }}>{t('viewAsBack')}</button>
    </aside>
  )
}
