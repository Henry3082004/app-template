import { Ic } from './Ic'
import { Avatar, Empty, ErrorBox, Skel } from './ui'
import { regularsOf, useHires } from '../lib/hires'
import { useI18n } from '../lib/i18n'
import { telHref, zaloHref } from '../lib/phone'
import { avatarUrl } from '../lib/worker'

/** "Nhân viên quen": workers who already did a shift here — invite them again with one tap (call or Zalo). */
export function Regulars() {
  const { t } = useI18n()
  const { list, error, reload } = useHires()
  const regulars = regularsOf(list)
  return (
    <div className="stack">
      {error != null && <ErrorBox error={error} where="Regulars.load" onRetry={reload} />}
      {!list && !error && <Skel n={1} />}
      {list && regulars.length === 0 && <Empty pose="empty" title={t('regularsEmpty')} sub={t('regularsEmptySub')} />}
      {regulars.map((r) => (
        <div key={r.seeker_id} className="tx">
          <div className="row" style={{ gap: 12 }}>
            <Avatar name={r.name} src={avatarUrl(r.hire.avatar_path)} size={44} />
            <div><b>{r.name}</b><span className="muted small" style={{ display: 'block' }}>{t('shiftsN', { n: r.shifts })}</span></div>
          </div>
          {r.hire.phone && (
            <div className="acts">
              <a className="btn btn-primary sm" href={zaloHref(r.hire.phone)} target="_blank" rel="noreferrer"><Ic n="message" size={16} /> {t('inviteAgain')}</a>
              <a className="btn btn-ghost sm" href={telHref(r.hire.phone)} aria-label={t('call')}><Ic n="phone" size={16} /></a>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
