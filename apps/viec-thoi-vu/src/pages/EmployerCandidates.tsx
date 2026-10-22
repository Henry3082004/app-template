import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { HireTabs } from '../components/HireTabs'
import { Ic } from '../components/Ic'
import { Rep } from '../components/escrow'
import { Avatar, Btn, Empty, ErrorBox, Skel } from '../components/ui'
import { WorkerFacts } from '../components/WorkerFields'
import { AcceptedDialog } from './Applicants'
import { api } from '../lib/api'
import { dateRange } from '../lib/format'
import { tap } from '../lib/haptics'
import { useHires } from '../lib/hires'
import { useI18n } from '../lib/i18n'
import { useSession } from '../lib/session'
import type { Hire, Reputation } from '../lib/types'
import { avatarUrl } from '../lib/worker'

/** "Ứng viên": everyone waiting for an answer, from all my open posts in one place. */
export default function EmployerCandidates() {
  const { t } = useI18n()
  const { profile, ready } = useSession()
  const { list, error, reload } = useHires()
  const [jobId, setJobId] = useState('all')
  const [reps, setReps] = useState<Record<string, Reputation>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [actErr, setActErr] = useState<unknown>(null)
  const [accepted, setAccepted] = useState<{ name: string; phone: string | null } | null>(null)

  const pending = (list ?? []).filter((h) => h.status === 'pending' && h.job.status === 'open')
  useEffect(() => {
    const ids = pending.map((h) => h.seeker_id)
    if (ids.length) api.reputations(ids, 'seeker').then(setReps).catch(() => undefined)
  }, [list]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return <div className="pg"><Skel n={2} /></div>
  if (profile?.role !== 'employer') return <Navigate to="/app" replace />

  const jobs = [...new Map(pending.map((h) => [h.job.id, h.job])).values()]
  const shown = pending.filter((h) => jobId === 'all' || h.job.id === jobId)

  const decide = async (h: Hire, d: 'accepted' | 'rejected') => {
    tap(); setBusy(h.id); setActErr(null)
    try {
      const r = await api.decide(h.id, d)
      if (d === 'accepted') setAccepted({ name: h.full_name, phone: r.phone })
      reload()
    } catch (e) { setActErr(e) } finally { setBusy(null) }
  }

  return (
    <div className="page-scroll"><div className="pg wide">
      <h1 className="ptitle">{t('navHiring')}</h1>
      <HireTabs pending={pending.length} />
      {error != null && <ErrorBox error={error} where="Candidates.load" onRetry={reload} />}
      {actErr != null && <ErrorBox error={actErr} where="Candidates.action" />}
      {!list && !error && <Skel n={2} />}
      {jobs.length > 1 && (
        <select className="inp" aria-label={t('candFilter')} value={jobId} onChange={(e) => setJobId(e.target.value)} style={{ maxWidth: 360 }}>
          <option value="all">{t('candAll')}</option>
          {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
      )}
      {list && shown.length === 0 && <Empty pose="empty" title={t('noCandidates')} sub={t('noCandidatesSub')} />}
      <div className="g2">
        {shown.map((a) => (
          <div key={a.id} className="card cand">
            <div className="row">
              <Avatar name={a.full_name} src={avatarUrl(a.avatar_path)} size={52} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <b>{a.full_name}</b>
                <div className="sub" style={{ fontSize: 14 }}><Ic n="briefcase" size={14} /> {a.job.title} · {dateRange(a.job.start_date, a.job.end_date)}</div>
              </div>
            </div>
            <WorkerFacts w={a} />
            <Rep rep={reps[a.seeker_id]} />
            {a.message && <div className="tag" style={{ borderRadius: 12, whiteSpace: 'normal' }}><Ic n="message" size={14} /> “{a.message}”</div>}
            <div className="acts">
              <Btn v="ghost" disabled={busy === a.id} onClick={() => decide(a, 'rejected')}>{t('reject')}</Btn>
              <Btn disabled={busy === a.id} onClick={() => decide(a, 'accepted')}>{t('accept')}</Btn>
            </div>
          </div>
        ))}
      </div>
      {accepted && <AcceptedDialog accepted={accepted} onClose={() => setAccepted(null)} />}
    </div></div>
  )
}
