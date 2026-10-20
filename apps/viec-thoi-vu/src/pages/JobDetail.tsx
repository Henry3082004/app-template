import { useEffect, useState } from 'react'
import { Ic } from '../components/Ic'
import { Rep } from '../components/escrow'
import { Pay } from '../components/JobCard'
import { Avatar, Btn, ErrorBox, Fld, Tag } from '../components/ui'
import { api } from '../lib/api'
import { errorCode } from '../lib/errors'
import { dateRange } from '../lib/format'
import { fmtKm } from '../lib/geo'
import { tap } from '../lib/haptics'
import { useI18n } from '../lib/i18n'
import { report } from '../lib/sentry'
import { useSession } from '../lib/session'
import type { AppStatus, Job, Profile, Reputation } from '../lib/types'
import { avatarUrl, introNudgeDue } from '../lib/worker'

/** Job detail: a page on phones, the right-hand column on tablet/desktop. */
export function JobDetail({ job, distance, mine, onApplied, onBack }: {
  job: Job
  distance?: number | null
  mine: AppStatus | null
  onApplied(): void
  onBack?: () => void
}) {
  const { t, locale } = useI18n()
  const { profile, setProfile, askAuth, askIntro } = useSession()
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [rep, setRep] = useState<Reputation>()
  const left = job.slots - job.filled
  const full = left <= 0 || job.status !== 'open'
  const own = !!profile && job.employer_id === profile.id
  const isEmployer = profile?.role === 'employer' || own

  useEffect(() => {
    setRep(undefined)
    api.reputations([job.employer_id], 'employer').then((m) => setRep(m[job.employer_id])).catch(() => undefined)
  }, [job.employer_id])

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
    // a worker who hasn't introduced themselves yet is asked once, then the application goes out either way
    const go = (p: Profile) => (introNudgeDue(p) ? askIntro({ beforeApply: true, onDone: () => void send() }) : void send())
    if (!profile) return askAuth({ role: 'seeker', onDone: (p) => { if (p.role === 'seeker') go(p) } })
    go(profile)
  }

  return (
    <>
      <div className="dscroll fade-in" key={job.id}>
        {onBack && <button type="button" className="back" onClick={onBack}>{t('backJobs')}</button>}
        <div className="card">
          <div className="hrow"><h2 style={{ fontSize: 20 }}>{job.title}</h2>{job.is_urgent && <Tag tone="urgent">{t('urgent')}</Tag>}</div>
          <div style={{ marginTop: 8 }}><Pay job={job} xl /></div>
          <div style={{ marginTop: 12 }}><Rep rep={rep} employer /></div>
        </div>
        <div className="card info">
          <div><Ic n="calendar" size={18} /><span><b>{dateRange(job.start_date, job.end_date)}</b>{job.shift_note && <><br />{job.shift_note}</>}</span></div>
          <div><Ic n="pin" size={18} /><span><b>{job.address}, {job.city}</b>{distance != null && <><br />{fmtKm(distance, locale)}</>}</span></div>
          <div><Ic n="users" size={18} /><span>{left > 0 ? t('slotsOf', { left, total: job.slots }) : t('full')}</span></div>
          {job.business_name && <div><Avatar square size={28} name={job.business_name} src={avatarUrl(job.business_logo)} /><span>{job.business_name}</span></div>}
        </div>
        {job.description && <div className="card"><b>{t('about')}</b><p style={{ marginTop: 6, whiteSpace: 'pre-line' }}>{job.description}</p></div>}
        {!full && !mine && !isEmployer && (
          <Fld label={t('messageOpt')} htmlFor="msg"><textarea id="msg" className="inp" maxLength={300} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={t('messagePh')} /></Fld>
        )}
        {isEmployer && (
          <div className="notice info stack">
            {own ? t('ownJob') : t('employerCantApply')}
            {/* an account that also looks for work switches role with one tap (never for its own job) */}
            {!own && profile?.roles.includes('seeker') && (
              <Btn v="ghost" sm onClick={() => api.switchRole('seeker').then(setProfile).catch(setError)}>{t('switchToApply')}</Btn>
            )}
          </div>
        )}
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
