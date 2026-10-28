import { useEffect, useState } from 'react'
import { Ic } from './Ic'
import { InviteDialog } from './InviteDialog'
import { api } from '../lib/api'
import { Avatar, Btn, Empty, ErrorBox, Skel } from './ui'
import { regularsOf, useHires } from '../lib/hires'
import { useI18n } from '../lib/i18n'
import { telHref, zaloHref } from '../lib/phone'
import { avatarUrl } from '../lib/worker'

/** "Nhân viên quen": workers who already did a shift here — invite them again with one tap (call or Zalo). */
export function Regulars() {
  const { t } = useI18n()
  const { list, error, reload } = useHires()
  const regulars = regularsOf(list)
  const [inviting, setInviting] = useState<{ id: string; name: string } | null>(null)
  const [sent, setSent] = useState<{ job_id: string; worker_id: string }[]>([])
  useEffect(() => { api.mySentInvites().then(setSent).catch(() => undefined) }, [])
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
              <Btn sm onClick={() => setInviting({ id: r.seeker_id, name: r.name })}>{t('inviteInApp')}</Btn>
              <a className="btn btn-ghost sm" href={zaloHref(r.hire.phone)} target="_blank" rel="noreferrer"><Ic n="message" size={16} /> {t('inviteAgain')}</a>
              <a className="btn btn-ghost sm" href={telHref(r.hire.phone)} aria-label={t('call')}><Ic n="phone" size={16} /></a>
            </div>
          )}
        </div>
      ))}
      {inviting && (
        <InviteDialog workerId={inviting.id} name={inviting.name} invited={sent.filter((i) => i.worker_id === inviting.id).map((i) => i.job_id)}
          onInvited={(jobId) => setSent((cur) => [...cur, { job_id: jobId, worker_id: inviting.id }])} onClose={() => setInviting(null)} />
      )}
    </div>
  )
}
