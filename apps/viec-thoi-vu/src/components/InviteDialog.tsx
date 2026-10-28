import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useI18n } from '../lib/i18n'
import type { MyJob } from '../lib/types'
import { Btn, Dialog, ErrorBox, Skel } from './ui'

/** Invite a worker who already did a shift for this shop to one of its open posts (they get a notification with the job). */
export function InviteDialog({ workerId, name, fresh, invited, onInvited, onClose }: { workerId: string; name: string; fresh?: boolean; invited: string[]; onInvited(jobId: string): void; onClose(): void }) {
  const { t } = useI18n()
  const [jobs, setJobs] = useState<MyJob[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [ok, setOk] = useState(false)
  useEffect(() => { api.myJobs().then((l) => setJobs(l.filter((j) => j.status === 'open'))).catch(setError) }, [])
  const invite = async (j: MyJob) => {
    setBusy(j.id); setError(null)
    try { await api.inviteWorker(j.id, workerId); onInvited(j.id); setOk(true) } catch (e) { setError(e) } finally { setBusy(null) }
  }
  return (
    <Dialog label={t(fresh ? 'inviteTitleNew' : 'inviteTitle', { name })} onClose={onClose}>
      <h2 style={{ fontSize: 20 }}>{t(fresh ? 'inviteTitleNew' : 'inviteTitle', { name })}</h2>
      {ok && <div className="notice ok">{t('inviteOk', { name })}</div>}
      {!jobs && !error && <Skel n={1} />}
      {jobs && jobs.length === 0 && <div className="notice info">{t('inviteNoJobs')}</div>}
      {jobs && jobs.length > 0 && <div className="muted small">{t('invitePick')}</div>}
      <div className="stack">
        {jobs?.map((j) => (
          <div key={j.id} className="tx">
            <div><b>{j.title}</b></div>
            {invited.includes(j.id)
              ? <span className="muted small">{t('inviteSent')} ✓</span>
              : <Btn sm onClick={() => invite(j)} disabled={busy === j.id}>{t('inviteInApp')}</Btn>}
          </div>
        ))}
      </div>
      {error != null && <ErrorBox error={error} where="InviteDialog" />}
      <Btn v="text" block onClick={onClose}>{t('done')}</Btn>
    </Dialog>
  )
}
