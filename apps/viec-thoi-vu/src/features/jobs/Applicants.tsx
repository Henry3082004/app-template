import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ContactButtons } from '../../components/ContactButtons'
import { Ic } from '../../components/Ic'
import { EmployerPay } from '../shifts/escrow'
import { FundDialog } from '../shifts/escrow/dialogs'
import type { JobTerms } from '../shifts/escrow/shared'
import { CandHead } from '../hiring/CandHead'
import { CompareBar, CompareCands, MAX_COMPARE, PickCand } from '../hiring/CompareCands'
import { Btn, Dialog, Empty, ErrorBox, Skel, Tag } from '../../components/ui'
import { WorkerFacts } from '../account/WorkerFields'
import { api } from '../../lib/api'
import { useAppConfig } from '../../lib/config'
import { capy } from '../../lib/capy'
import { dateRange, today } from '../../lib/format'
import { tap } from '../../lib/haptics'
import { useI18n, type TKey } from '../../lib/i18n'
import { displayPhone } from '../../lib/phone'
import { useAction } from '../../lib/useAction'
import type { Applicant, MyJob, Reputation } from '../../lib/types'

/** Applicants of one post: a page on phones, the right-hand column on tablet/desktop. */
export function Applicants({ job, onBack, onChanged }: { job: MyJob; onBack?: () => void; onChanged(): void }) {
  const { t } = useI18n()
  const nav = useNavigate()
  const [list, setList] = useState<Applicant[] | null>(null)
  const [reps, setReps] = useState<Record<string, Reputation>>({})
  const [error, setError] = useState<unknown>(null)
  const act = useAction()
  const [chosen, setChosen] = useState<string[]>([])
  const [comparing, setComparing] = useState(false)
  const cfg = useAppConfig()
  const [accepted, setAccepted] = useState<AcceptedInfo | null>(null)

  const load = () => {
    setError(null)
    api.sweep().catch(() => undefined)
      .then(() => api.applicantsFor(job.id))
      .then((a) => { setList(a); onChanged(); api.reputations(a.map((x) => x.seeker_id), 'seeker').then(setReps).catch(() => undefined) })
      .catch(setError)
  }
  useEffect(() => { setList(null); load() }, [job.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (id: string) => setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= MAX_COMPARE ? c : [...c, id]))
  const decide = (a: Applicant, d: 'accepted' | 'rejected') => {
    tap()
    return act.run(a.id, async () => {
      const r = await api.decide(a.id, d)
      if (d === 'accepted') setAccepted({ name: a.full_name, phone: r.phone, fund: cfg && cfg.payment_mode !== 'off' && job.end_date >= today() ? { app: { ...a, status: 'accepted' }, job } : undefined })
      setComparing(false)
      load()
    })
  }

  const toggle = async () => {
    if (job.status === 'open' && !confirm(t('closeConfirm'))) return
    await act.run('status', async () => { await api.setJobStatus(job.id, job.status === 'open' ? 'closed' : 'open'); onChanged() })
  }

  return (
    <div className="pcol">
      <div className="pg fade-in" key={job.id} style={{ flex: 1 }}>
        {onBack && <button type="button" className="back" onClick={onBack}>{t('backMine')}</button>}
        <div className="hrow" style={{ alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 className="ptitle" style={{ fontSize: 20 }}>{job.title}</h2>
            <div className="sub"><Ic n="calendar" size={14} /> {dateRange(job.start_date, job.end_date)} · <Ic n="users" size={14} /> {t('filledOf', { filled: job.filled, slots: job.slots })}</div>
          </div>
          {job.status === 'closed' && <Tag>{t('closed')}</Tag>}
        </div>
        {error != null && <ErrorBox error={error} where="Applicants.load" onRetry={load} />}
        {act.error != null && <div style={{ marginBottom: 12 }}><ErrorBox error={act.error} where="Applicants.action" /></div>}
        {!list && !error && <Skel n={2} />}
        {list && list.length === 0 && <Empty pose="empty" title={t('noApplicants')} />}
        {list && list.length > 1 && <CompareBar n={chosen.length} onOpen={() => setComparing(true)} />}
        <div className="g2">
          {list?.map((a) => (
            <div key={a.id} className="card cand">
              <CandHead name={a.full_name} avatar={a.avatar_path} rep={reps[a.seeker_id]} sub={a.bio}
                tag={a.status !== 'pending' && <Tag tone={a.status === 'accepted' ? 'ok' : ''}>{t(`st${a.status}` as TKey)}</Tag>} />
              <WorkerFacts w={a} />
              {a.message && <div className="tag" style={{ borderRadius: 12, whiteSpace: 'normal' }}><Ic n="message" size={14} /> “{a.message}”</div>}
              {(list?.length ?? 0) > 1 && <div className="acts"><PickCand on={chosen.includes(a.id)} disabled={chosen.length >= MAX_COMPARE} onChange={() => pick(a.id)} /></div>}
              {a.status === 'accepted' && a.phone && (
                <>
                  <div className="phone"><Ic n="phone" size={20} /> {displayPhone(a.phone)}</div>
                  <div className="acts"><ContactButtons phone={a.phone} /></div>
                </>
              )}
              {a.status === 'accepted' && <EmployerPay app={a} job={job} onChanged={load} />}
              {a.status === 'pending' && job.status === 'open' && (
                <div className="acts">
                  <Btn v="ghost" disabled={act.busy === a.id} onClick={() => decide(a, 'rejected')}>{t('reject')}</Btn>
                  <Btn disabled={act.busy === a.id} onClick={() => decide(a, 'accepted')}>{t('accept')}</Btn>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="center mt24 acts"><Btn v="text" onClick={() => nav(`/app/dang-tin?lai=${job.id}`)}>{t('repostJob')}</Btn><Btn v="text" onClick={toggle}>{job.status === 'open' ? t('closeJob') : t('reopenJob')}</Btn></div>
      </div>
      {comparing && list && <CompareCands people={chosen.map((id) => list.find((x) => x.id === id)!).filter(Boolean).map((x) => ({ ...x, job }))} reps={reps} busy={act.busy} onDecide={decide} onClose={() => setComparing(false)} />}
      {accepted && <AcceptedDialog accepted={accepted} onFunded={load} onClose={() => setAccepted(null)} />}
    </div>
  )
}

export type AcceptedInfo = { name: string; phone: string | null; fund?: { app: Applicant; job: JobTerms } }

/** "Đã nhận X" — the worker's phone right after accepting, and (when deposits are on) the next step: put the money on hold. */
export function AcceptedDialog({ accepted, onClose, onFunded }: { accepted: AcceptedInfo; onClose(): void; onFunded?(): void }) {
  const { t } = useI18n()
  const [paying, setPaying] = useState(false)
  if (paying && accepted.fund) return <FundDialog app={accepted.fund.app} job={accepted.fund.job} onClose={() => setPaying(false)} onDone={() => { onFunded?.(); onClose() }} />
  return (
    <Dialog full label={t('acceptedTitle', { name: accepted.name })} onClose={onClose}>
      <img className="capy sm hop" src={capy('cheer')} alt="" />
      <h2>{t('acceptedTitle', { name: accepted.name.replace(/\(.*?\)/g, '').trim().split(' ').slice(-1)[0] })}</h2>
      <div className="sub">{t('acceptedText')}</div>
      {accepted.phone && (
        <>
          <div className="phone">{displayPhone(accepted.phone)}</div>
          <div className="row" style={{ gap: 10, width: '100%' }}><ContactButtons phone={accepted.phone} block /></div>
        </>
      )}
      {accepted.fund && (
        <>
          <div className="notice warn" style={{ width: '100%', textAlign: 'left' }}>{t('fundWaitingEmp')}</div>
          <Btn block onClick={() => setPaying(true)}>{t('fundCta')}</Btn>
        </>
      )}
      <Btn v="text" onClick={onClose}>{t('done')}</Btn>
    </Dialog>
  )
}
