import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ContactButtons } from '../../components/ContactButtons'
import { Ic } from '../../components/Ic'
import { EmployerPay, Rep } from '../shifts/escrow'
import { PersonRow } from '../../components/PersonRow'
import { Btn, Dialog, Empty, ErrorBox, Skel, Tag } from '../../components/ui'
import { WorkerFacts } from '../account/WorkerFields'
import { api } from '../../lib/api'
import { capy } from '../../lib/capy'
import { dateRange } from '../../lib/format'
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
  const [accepted, setAccepted] = useState<{ name: string; phone: string | null } | null>(null)

  const load = () => {
    setError(null)
    api.sweep().catch(() => undefined)
      .then(() => api.applicantsFor(job.id))
      .then((a) => { setList(a); onChanged(); api.reputations(a.map((x) => x.seeker_id), 'seeker').then(setReps).catch(() => undefined) })
      .catch(setError)
  }
  useEffect(() => { setList(null); load() }, [job.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const decide = (a: Applicant, d: 'accepted' | 'rejected') => {
    tap()
    return act.run(a.id, async () => {
      const r = await api.decide(a.id, d)
      if (d === 'accepted') setAccepted({ name: a.full_name, phone: r.phone })
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
        <div className="g2">
          {list?.map((a) => (
            <div key={a.id} className="card cand">
              <PersonRow name={a.full_name} avatar={a.avatar_path} sub={a.bio}
                tag={a.status !== 'pending' && <Tag tone={a.status === 'accepted' ? 'ok' : ''}>{t(`st${a.status}` as TKey)}</Tag>} />
              <WorkerFacts w={a} />
              <Rep rep={reps[a.seeker_id]} />
              {a.message && <div className="tag" style={{ borderRadius: 12, whiteSpace: 'normal' }}><Ic n="message" size={14} /> “{a.message}”</div>}
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
      {accepted && <AcceptedDialog accepted={accepted} onClose={() => setAccepted(null)} />}
    </div>
  )
}

/** "Đã nhận X" — the worker's phone right after accepting. */
export function AcceptedDialog({ accepted, onClose }: { accepted: { name: string; phone: string | null }; onClose(): void }) {
  const { t } = useI18n()
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
      <Btn v="text" onClick={onClose}>{t('done')}</Btn>
    </Dialog>
  )
}
