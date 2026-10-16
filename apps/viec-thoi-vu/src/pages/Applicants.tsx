import { useEffect, useState } from 'react'
import { Ic } from '../components/Ic'
import { EmployerPay, Rep } from '../components/Escrow'
import { Avatar, Btn, Dialog, Empty, ErrorBox, Skel, Tag } from '../components/ui'
import { api } from '../lib/api'
import { capy } from '../lib/capy'
import { dateRange } from '../lib/format'
import { tap } from '../lib/haptics'
import { useI18n, type TKey } from '../lib/i18n'
import { displayPhone, telHref, zaloHref } from '../lib/phone'
import type { Applicant, MyJob, Reputation } from '../lib/types'

/** Applicants of one post: a page on phones, the right-hand column on tablet/desktop. */
export function Applicants({ job, onBack, onChanged }: { job: MyJob; onBack?: () => void; onChanged(): void }) {
  const { t } = useI18n()
  const [list, setList] = useState<Applicant[] | null>(null)
  const [reps, setReps] = useState<Record<string, Reputation>>({})
  const [error, setError] = useState<unknown>(null)
  const [actErr, setActErr] = useState<unknown>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [accepted, setAccepted] = useState<{ name: string; phone: string | null } | null>(null)

  const load = () => {
    setError(null)
    api.sweep().catch(() => undefined)
      .then(() => api.applicantsFor(job.id))
      .then((a) => { setList(a); onChanged(); api.reputations(a.map((x) => x.seeker_id)).then(setReps).catch(() => undefined) })
      .catch(setError)
  }
  useEffect(() => { setList(null); load() }, [job.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const decide = async (a: Applicant, d: 'accepted' | 'rejected') => {
    tap()
    setBusyId(a.id)
    setActErr(null)
    try {
      const r = await api.decide(a.id, d)
      if (d === 'accepted') setAccepted({ name: a.full_name, phone: r.phone })
      load()
    } catch (e) {
      setActErr(e)
    } finally {
      setBusyId(null)
    }
  }

  const toggle = async () => {
    if (job.status === 'open' && !confirm(t('closeConfirm'))) return
    setActErr(null)
    try { await api.setJobStatus(job.id, job.status === 'open' ? 'closed' : 'open'); onChanged() } catch (e) { setActErr(e) }
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
        {actErr != null && <div style={{ marginBottom: 12 }}><ErrorBox error={actErr} where="Applicants.action" /></div>}
        {!list && !error && <Skel n={2} />}
        {list && list.length === 0 && <Empty pose="empty" title={t('noApplicants')} />}
        <div className="g2">
          {list?.map((a) => (
            <div key={a.id} className="card cand">
              <div className="row">
                <Avatar name={a.full_name} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="hrow" style={{ alignItems: 'center' }}>
                    <b>{a.full_name}</b>
                    {a.status !== 'pending' && <Tag tone={a.status === 'accepted' ? 'ok' : ''}>{t(`st${a.status}` as TKey)}</Tag>}
                  </div>
                  {a.bio && <div className="sub" style={{ fontSize: 14 }}>{a.bio}</div>}
                </div>
              </div>
              <Rep rep={reps[a.seeker_id]} />
              {a.message && <div className="tag" style={{ borderRadius: 12, whiteSpace: 'normal' }}><Ic n="message" size={14} /> “{a.message}”</div>}
              {a.status === 'accepted' && a.phone && (
                <>
                  <div className="phone"><Ic n="phone" size={20} /> {displayPhone(a.phone)}</div>
                  <div className="acts">
                    <a className="btn btn-primary sm" href={telHref(a.phone)}>{<Ic n="phone" size={16} />} {t('call')}</a>
                    <a className="btn btn-ghost sm" href={zaloHref(a.phone)} target="_blank" rel="noreferrer">{<Ic n="message" size={16} />} {t('zalo')}</a>
                  </div>
                </>
              )}
              {a.status === 'accepted' && <EmployerPay app={a} job={job} onChanged={load} />}
              {a.status === 'pending' && job.status === 'open' && (
                <div className="acts">
                  <Btn v="ghost" disabled={busyId === a.id} onClick={() => decide(a, 'rejected')}>{t('reject')}</Btn>
                  <Btn disabled={busyId === a.id} onClick={() => decide(a, 'accepted')}>{t('accept')}</Btn>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="center mt24"><Btn v="text" onClick={toggle}>{job.status === 'open' ? t('closeJob') : t('reopenJob')}</Btn></div>
      </div>
      {accepted && (
        <Dialog full label={t('acceptedTitle', { name: accepted.name })} onClose={() => setAccepted(null)}>
          <img className="capy sm hop" src={capy('cheer')} alt="" />
          <h2>{t('acceptedTitle', { name: accepted.name.replace(/\(.*?\)/g, '').trim().split(' ').slice(-1)[0] })}</h2>
          <div className="sub">{t('acceptedText')}</div>
          {accepted.phone && (
            <>
              <div className="phone">{displayPhone(accepted.phone)}</div>
              <div className="row" style={{ gap: 10, width: '100%' }}>
                <a className="btn btn-primary block" href={telHref(accepted.phone)}>{<Ic n="phone" size={16} />} {t('call')}</a>
                <a className="btn btn-ghost block" href={zaloHref(accepted.phone)} target="_blank" rel="noreferrer">{<Ic n="message" size={16} />} {t('zalo')}</a>
              </div>
            </>
          )}
          <Btn v="text" onClick={() => setAccepted(null)}>{t('done')}</Btn>
        </Dialog>
      )}
    </div>
  )
}
