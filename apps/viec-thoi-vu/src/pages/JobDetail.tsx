import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Dock } from '../components/Dock'
import { ErrorBox } from '../components/ErrorBox'
import { PayLine } from '../components/JobCard'
import { CardSkeleton } from '../components/Skeleton'
import { SuccessScreen } from '../components/SuccessScreen'
import { Topbar } from '../components/Topbar'
import { api } from '../lib/api'
import { errorCode } from '../lib/errors'
import { dateRange } from '../lib/format'
import { tap } from '../lib/haptics'
import { useI18n } from '../lib/i18n'
import { report } from '../lib/sentry'
import { useSession } from '../lib/session'
import type { AppStatus, Job } from '../lib/types'

export default function JobDetail() {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const { t } = useI18n()
  const { profile, askAuth } = useSession()
  const [job, setJob] = useState<Job | null | undefined>(undefined)
  const [loadErr, setLoadErr] = useState<unknown>(null)
  const [mine, setMine] = useState<AppStatus | null>(null)
  const [showMsg, setShowMsg] = useState(false)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [done, setDone] = useState(false)

  const load = () => {
    setLoadErr(null)
    api.getJob(id).then(setJob).catch(setLoadErr)
  }
  useEffect(load, [id])
  useEffect(() => {
    if (profile?.role === 'seeker') api.myApplicationStatus().then((m) => setMine(m[id] ?? null)).catch(() => undefined)
  }, [profile, id])

  const send = async () => {
    setBusy(true)
    setError(null)
    try {
      await api.apply(id, msg)
      setDone(true)
    } catch (e) {
      if (errorCode(e) === 'ALREADY_APPLIED') setMine('pending')
      if (errorCode(e) === 'UNKNOWN') report(e, { where: 'apply', job: id })
      setError(e)
    } finally {
      setBusy(false)
    }
  }

  const onApply = () => {
    tap()
    if (!profile) return askAuth({ role: 'seeker', onDone: (p) => (p.role === 'seeker' ? send() : undefined) })
    send()
  }

  if (done) {
    return (
      <SuccessScreen title={t('appliedTitle')} text={t('appliedText')}>
        <button className="btn primary block" onClick={() => nav('/app')}>{t('moreJobs')}</button>
        <button className="btn ghost block" onClick={() => nav('/app/da-ung-tuyen')}>{t('seeApplied')}</button>
      </SuccessScreen>
    )
  }

  if (loadErr) return <div className="page-enter"><Topbar title="" back /><ErrorBox error={loadErr} where="JobDetail.load" onRetry={load} /></div>
  if (job === undefined) return <div><Topbar title="" back /><CardSkeleton count={2} /></div>
  if (job === null) {
    return (
      <div className="page-enter">
        <Topbar title="" back />
        <div className="empty"><div className="big">🔍</div>{t('notFound')}</div>
      </div>
    )
  }

  const left = job.slots - job.filled
  const full = left <= 0 || job.status !== 'open'
  const isEmployer = profile?.role === 'employer'

  return (
    <div className="page-enter">
      <Topbar title="" back />
      <section className="card">
        <div className="row between" style={{ alignItems: 'flex-start' }}>
          <h2 className="grow" style={{ fontSize: 21 }}>{job.title}</h2>
          {job.is_urgent && <span className="badge urgent">{t('urgent')}</span>}
        </div>
        <PayLine job={job} big />
      </section>

      <section className="card">
        <div className="info-row"><span className="ico">📅</span><div><div className="muted small">{t('time')}</div>{dateRange(job.start_date, job.end_date)}{job.shift_note ? ` · ${job.shift_note}` : ''}</div></div>
        <div className="info-row"><span className="ico">📍</span><div><div className="muted small">{t('place')}</div>{job.address}, {job.city}</div></div>
        <div className="info-row"><span className="ico">👥</span><div><div className="muted small">{t('slots')}</div>{left > 0 ? t('slotsOf', { left, total: job.slots }) : t('full')}</div></div>
        {job.business_name && <div className="info-row"><span className="ico">🏪</span><div><div className="muted small">{t('business')}</div>{job.business_name}</div></div>}
      </section>

      {job.description && (
        <section className="card">
          <h3 className="bold" style={{ fontSize: 15 }}>{t('about')}</h3>
          <p className="mt-8" style={{ whiteSpace: 'pre-line', color: '#374151' }}>{job.description}</p>
        </section>
      )}

      {!full && !mine && !isEmployer && (
        <div className="mt-12">
          {!showMsg ? (
            <button className="btn ghost small" style={{ paddingLeft: 0 }} onClick={() => setShowMsg(true)}>+ {t('messageOpt')}</button>
          ) : (
            <div className="field">
              <label htmlFor="msg">{t('messageOpt')}</label>
              <textarea id="msg" className="textarea" maxLength={300} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={t('messagePh')} />
            </div>
          )}
        </div>
      )}
      {isEmployer && <div className="notice info mt-12">{t('employerCantApply')}</div>}
      {error != null && <div className="mt-12"><ErrorBox error={error} where="JobDetail.apply" /></div>}

      {!isEmployer && (
        <Dock>
          {mine ? (
            <button className="btn block" disabled>{mine === 'withdrawn' ? t('stwithdrawn') : t('applied')}</button>
          ) : full ? (
            <button className="btn block" disabled>{t('full')}</button>
          ) : (
            <button className="btn primary block" onClick={onApply} disabled={busy}>{busy ? '…' : t('applyNow')}</button>
          )}
        </Dock>
      )}
    </div>
  )
}
