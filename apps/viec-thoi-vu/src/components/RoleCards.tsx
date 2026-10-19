import { tap } from '../lib/haptics'
import { useI18n } from '../lib/i18n'
import type { Role } from '../lib/types'
import { Ic } from './Ic'

/** "You're here to…" — two big choices, pre-selected from the button the person pressed. */
export function RoleCards({ value, onChange }: { value: Role; onChange(r: Role): void }) {
  const { t } = useI18n()
  const card = (r: Role, icon: 'briefcase' | 'store', title: 'roleCardSeeker' | 'roleCardEmployer', sub: 'roleCardSeekerSub' | 'roleCardEmployerSub') => (
    <button type="button" role="radio" aria-checked={value === r} className={'rolecard' + (value === r ? ' on' : '')} onClick={() => { tap(); onChange(r) }}>
      <Ic n={icon} size={26} /><b>{t(title)}</b><span>{t(sub)}</span>
    </button>
  )
  return (
    <div className="rolecards" role="radiogroup" aria-label={t('roleQuestion')}>
      {card('seeker', 'briefcase', 'roleCardSeeker', 'roleCardSeekerSub')}
      {card('employer', 'store', 'roleCardEmployer', 'roleCardEmployerSub')}
    </div>
  )
}
