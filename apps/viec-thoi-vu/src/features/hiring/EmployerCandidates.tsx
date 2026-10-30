import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { HireTabs } from './HireTabs'
import { Ic } from '../../components/Ic'
import { Btn, Empty, ErrorBox, Skel } from '../../components/ui'
import { WorkerFacts } from '../account/WorkerFields'
import { CandHead } from './CandHead'
import { CompareBar, CompareCands, MAX_COMPARE, PickCand } from './CompareCands'
import { AcceptedDialog, type AcceptedInfo } from '../jobs/Applicants'
import { api } from '../../lib/api'
import { dateRange, today } from '../../lib/format'
import { tap } from '../../lib/haptics'
import { pendingOf, useHires } from '../../lib/hires'
import { useAppConfig } from '../../lib/config'
import { useI18n } from '../../lib/i18n'
import { useSession } from '../../lib/session'
import { useAction } from '../../lib/useAction'
import type { Hire, Reputation } from '../../lib/types'

/** "Ứng viên": everyone waiting for an answer, from all my open posts in one place. */
export default function EmployerCandidates() {
  const { t } = useI18n()
  const { profile, ready } = useSession()
  const { list, error, reload } = useHires()
  const [jobId, setJobId] = useState('all')
  const [reps, setReps] = useState<Record<string, Reputation>>({})
  const act = useAction()
  const [chosen, setChosen] = useState<string[]>([])
  const [comparing, setComparing] = useState(false)
  const cfg = useAppConfig()
  const [accepted, setAccepted] = useState<AcceptedInfo | null>(null)

  const pending = pendingOf(list)
  useEffect(() => {
    const ids = pending.map((h) => h.seeker_id)
    if (ids.length) api.reputations(ids, 'seeker').then(setReps).catch(() => undefined)
  }, [list]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return <div className="pg"><Skel n={2} /></div>
  if (profile?.role !== 'employer') return <Navigate to="/app" replace />

  const jobs = [...new Map(pending.map((h) => [h.job.id, h.job])).values()]
  const shown = pending.filter((h) => jobId === 'all' || h.job.id === jobId)

  const pick = (id: string) => setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= MAX_COMPARE ? c : [...c, id]))
  const decide = (h: Hire, d: 'accepted' | 'rejected') => {
    tap()
    return act.run(h.id, async () => {
      const r = await api.decide(h.id, d)
      if (d === 'accepted') setAccepted({ name: h.full_name, phone: r.phone, fund: cfg && cfg.payment_mode !== 'off' && h.job.end_date >= today() ? { app: { ...h, status: 'accepted' }, job: h.job } : undefined })
      setComparing(false); setChosen((c) => c.filter((x) => x !== h.id))
      reload()
    })
  }

  return (
    <div className="page-scroll"><div className="pg wide">
      <h1 className="ptitle">{t('navHiring')}</h1>
      <HireTabs pending={pending.length} />
      {error != null && <ErrorBox error={error} where="Candidates.load" onRetry={reload} />}
      {act.error != null && <ErrorBox error={act.error} where="Candidates.action" />}
      {!list && !error && <Skel n={2} />}
      {jobs.length > 1 && (
        <select className="inp" aria-label={t('candFilter')} value={jobId} onChange={(e) => setJobId(e.target.value)} style={{ maxWidth: 360 }}>
          <option value="all">{t('candAll')}</option>
          {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
      )}
      {list && shown.length === 0 && <Empty pose="empty" title={t('noCandidates')} sub={t('noCandidatesSub')} />}
      {shown.length > 1 && <CompareBar n={chosen.length} onOpen={() => setComparing(true)} />}
      <div className="g2">
        {shown.map((a) => (
          <div key={a.id} className="card cand">
            <CandHead name={a.full_name} avatar={a.avatar_path} rep={reps[a.seeker_id]} sub={<><Ic n="briefcase" size={14} /> {a.job.title} · {dateRange(a.job.start_date, a.job.end_date)}</>} />
            <WorkerFacts w={a} />
            {a.message && <div className="tag" style={{ borderRadius: 12, whiteSpace: 'normal' }}><Ic n="message" size={14} /> “{a.message}”</div>}
            <div className="acts">
              <PickCand on={chosen.includes(a.id)} disabled={chosen.length >= MAX_COMPARE} onChange={() => pick(a.id)} />
              <Btn v="ghost" disabled={act.busy === a.id} onClick={() => decide(a, 'rejected')}>{t('reject')}</Btn>
              <Btn disabled={act.busy === a.id} onClick={() => decide(a, 'accepted')}>{t('accept')}</Btn>
            </div>
          </div>
        ))}
      </div>
      {comparing && <CompareCands people={chosen.map((id) => pending.find((h) => h.id === id)!).filter(Boolean)} reps={reps} busy={act.busy} onDecide={decide} onClose={() => setComparing(false)} />}
      {accepted && <AcceptedDialog accepted={accepted} onFunded={reload} onClose={() => setAccepted(null)} />}
    </div></div>
  )
}
