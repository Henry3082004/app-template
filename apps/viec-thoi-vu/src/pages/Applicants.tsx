import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { ErrorBox } from '../components/ErrorBox'
import { CardSkeleton } from '../components/Skeleton'
import { SuccessScreen } from '../components/SuccessScreen'
import { Topbar } from '../components/Topbar'
import { api } from '../lib/api'
import { dateRange, initials } from '../lib/format'
import { tap } from '../lib/haptics'
import { useI18n, type TKey } from '../lib/i18n'
import { displayPhone, telHref, zaloHref } from '../lib/phone'
import { useSession } from '../lib/session'
import type { Applicant, Job } from '../lib/types'

function Contact({ phone }: { phone: string }) {
  const { t } = useI18n()
  return (
    <div className="notice info mt-12">
      <div className="phone-big">{displayPhone(phone)}</div>
      <div className="two mt-8">
        <a className="btn primary small" href={telHref(phone)}>📞 {t('call')}</a>
        <a className="btn secondary small" href={zaloHref(phone)} target="_blank" rel="noreferrer">💬 {t('zalo')}</a>
      </div>
    </div>
  )
}

export default function Applicants() {
  const { id = '' } = useParams()
  const { t } = useI18n()
  const { profile, ready } = useSession()
  const [job, setJob] = useState<Job | null>(null)
  const [list, setList] = useState<Applicant[] | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [actErr, setActErr] = useState<unknown>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [accepted, setAccepted] = useState<{ name: string; phone: string | null } | null>(null)

  const load = () => {
    setError(null)
    Promise.all([api.getJob(id), api.applicantsFor(id)])
      .then(([j, a]) => { setJob(j); setList(a) })
      .catch(setError)
  }
  useEffect(() => { if (profile?.role === 'employer') load() }, [profile, id])

  if (!ready) return <CardSkeleton />
  if (profile?.role !== 'employer') return <Navigate to="/app" replace />

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
    if (!job) return
    if (job.status === 'open' && !confirm(t('closeConfirm'))) return
    setActErr(null)
    try { await api.setJobStatus(job.id, job.status === 'open' ? 'closed' : 'open'); load() } catch (e) { setActErr(e) }
  }

  if (accepted) {
    return (
      <SuccessScreen title={t('acceptedTitle', { name: accepted.name.split(' ').slice(-1)[0] })} text={t('acceptedText')}>
        {accepted.phone && (
          <>
            <div className="phone-big">{displayPhone(accepted.phone)}</div>
            <a className="btn primary block" href={telHref(accepted.phone)}>📞 {t('call')}</a>
            <a className="btn secondary block" href={zaloHref(accepted.phone)} target="_blank" rel="noreferrer">💬 {t('zalo')}</a>
          </>
        )}
        <button className="btn ghost block" onClick={() => setAccepted(null)}>{t('done')}</button>
      </SuccessScreen>
    )
  }

  return (
    <div className="page-enter">
      <Topbar title={job?.title ?? t('applicantsTitle')} back="/app/tin-cua-toi" />
      {job && (
        <div className="row between" style={{ marginTop: -8, marginBottom: 12 }}>
          <span className="muted small">📅 {dateRange(job.start_date, job.end_date)} · 👥 {t('filledOf', { filled: job.filled, slots: job.slots })}</span>
          {job.status === 'closed' && <span className="badge gray">{t('closed')}</span>}
        </div>
      )}
      {error != null && <ErrorBox error={error} where="Applicants.load" onRetry={load} />}
      {actErr != null && <div style={{ marginBottom: 12 }}><ErrorBox error={actErr} where="Applicants.action" /></div>}
      {!list && !error && <CardSkeleton count={2} />}
      {list && list.length === 0 && <div className="empty"><div className="big">⏳</div>{t('noApplicants')}</div>}
      {list?.map((a) => (
        <article className="card" key={a.id}>
          <div className="row" style={{ alignItems: 'flex-start', gap: 12 }}>
            <div className="avatar">{initials(a.full_name)}</div>
            <div className="grow">
              <div className="row between">
                <h3 className="job-title">{a.full_name}</h3>
                {a.status !== 'pending' && <span className={a.status === 'accepted' ? 'badge ok' : 'badge gray'}>{t(`st${a.status}` as TKey)}</span>}
              </div>
              {a.bio && <p className="muted small">{a.bio}</p>}
              {a.message && <p className="mt-8">“{a.message}”</p>}
            </div>
          </div>
          {a.status === 'accepted' && a.phone && <Contact phone={a.phone} />}
          {a.status === 'pending' && job?.status === 'open' && (
            <div className="two mt-12">
              <button className="btn secondary" disabled={busyId === a.id} onClick={() => decide(a, 'rejected')}>{t('reject')}</button>
              <button className="btn primary" disabled={busyId === a.id} onClick={() => decide(a, 'accepted')}>{t('accept')}</button>
            </div>
          )}
        </article>
      ))}
      {job && (
        <div className="center mt-24">
          <button className={job.status === 'open' ? 'btn danger-text' : 'btn ghost'} onClick={toggle}>
            {job.status === 'open' ? t('closeJob') : t('reopenJob')}
          </button>
        </div>
      )}
    </div>
  )
}
