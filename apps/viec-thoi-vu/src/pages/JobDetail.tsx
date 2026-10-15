import { useState } from 'react'
import { Pay } from '../components/JobCard'
import { Btn, ErrorBox, Fld, Tag } from '../components/ui'
import { api } from '../lib/api'
import { errorCode } from '../lib/errors'
import { dateRange } from '../lib/format'
import { fmtKm } from '../lib/geo'
import { tap } from '../lib/haptics'
import { useI18n } from '../lib/i18n'
import { report } from '../lib/sentry'
import { useSession } from '../lib/session'
import type { AppStatus, Job } from '../lib/types'

/** Job detail: a page on phones, the right-hand column on tablet/desktop. */
export function JobDetail({ job, distance, mine, onApplied, onBack }: {
  job: Job
  distance?: number | null
  mine: AppStatus | null
  onApplied(): void
  onBack?: () => void
}) {
  const { t, locale } = useI18n()
  const { profile, askAuth } = useSession()
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const left = job.slots - job.filled
  const full = left <= 0 || job.status !== 'open'
  const isEmployer = profile?.role === 'employer'

  const send = async () => {
    setBusy(true)
    setError(null)
    try {
      await api.apply(job.id, msg)
      onApplied()
    } catch (e) {
      if (errorCode(e) === 'UNKNOWN') report(e, { where: 'apply', job: job.id })
      setError(e)
    } finally {
      setBusy(false)
    }
  }

  const onApply = () => {
    tap()
    if (!profile) return askAuth({ role: 'seeker', onDone: (p) => { if (p.role === 'seeker') void send() } })
    void send()
  }

  return (
    <>
      <div className="dscroll fade-in" key={job.id}>
        {onBack && <button type="button" className="back" onClick={onBack}>{t('backJobs')}</button>}
        <div className="card">
          <div className="hrow"><h2 style={{ fontSize: 20 }}>{job.title}</h2>{job.is_urgent && <Tag tone="urgent">{t('urgent')}</Tag>}</div>
          <div style={{ marginTop: 8 }}><Pay job={job} xl /></div>
        </div>
        <div className="card info">
          <div>📅 <span><b>{dateRange(job.start_date, job.end_date)}</b>{job.shift_note && <><br />{job.shift_note}</>}</span></div>
          <div>📍 <span><b>{job.address}, {job.city}</b>{distance != null && <><br />{fmtKm(distance, locale)}</>}</span></div>
          <div>👥 <span>{left > 0 ? t('slotsOf', { left, total: job.slots }) : t('full')}</span></div>
          {job.business_name && <div>🏪 <span>{job.business_name}</span></div>}
        </div>
        {job.description && <div className="card"><b>{t('about')}</b><p style={{ marginTop: 6, whiteSpace: 'pre-line' }}>{job.description}</p></div>}
        {!full && !mine && !isEmployer && (
          <Fld label={t('messageOpt')} htmlFor="msg"><textarea id="msg" className="inp" maxLength={300} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={t('messagePh')} /></Fld>
        )}
        {isEmployer && <div className="notice info">{t('employerCantApply')}</div>}
        {error != null && <ErrorBox error={error} where="JobDetail.apply" />}
      </div>
      {!isEmployer && (
        <div className="cta">
          {mine ? <Btn block disabled>{mine === 'withdrawn' ? t('stwithdrawn') : t('applied')}</Btn>
            : full ? <Btn block disabled>{t('full')}</Btn>
            : <Btn block onClick={onApply} disabled={busy}>{busy ? '…' : t('applyNow')}</Btn>}
        </div>
      )}
    </>
  )
}
