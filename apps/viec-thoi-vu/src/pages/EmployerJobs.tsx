import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Dock } from '../components/Dock'
import { ErrorBox } from '../components/ErrorBox'
import { CardSkeleton } from '../components/Skeleton'
import { Topbar } from '../components/Topbar'
import { api } from '../lib/api'
import { dateRange } from '../lib/format'
import { tap } from '../lib/haptics'
import { useI18n } from '../lib/i18n'
import { useSession } from '../lib/session'
import type { MyJob } from '../lib/types'

export default function EmployerJobs() {
  const { t } = useI18n()
  const nav = useNavigate()
  const { profile, ready } = useSession()
  const [list, setList] = useState<MyJob[] | null>(null)
  const [error, setError] = useState<unknown>(null)

  const load = () => {
    if (profile?.role !== 'employer') return
    setError(null)
    api.myJobs().then(setList).catch(setError)
  }
  useEffect(load, [profile])

  if (!ready) return <CardSkeleton />
  if (profile?.role !== 'employer') return <Navigate to="/app" replace />

  const open = list?.filter((j) => j.status === 'open').length ?? 0
  const isPro = profile.plan === 'pro'

  return (
    <div className="page-enter">
      <Topbar title={t('myJobsTitle')} />
      <div className="plan-bar">
        <span>{isPro ? t('proBar') : t('planBar', { open })}</span>
        {!isPro && <button className="btn ghost small" style={{ height: 28 }} onClick={() => nav('/app/bang-gia')}>{t('upgrade')}</button>}
      </div>
      {error != null && <ErrorBox error={error} where="EmployerJobs.load" onRetry={load} />}
      {!list && !error && <CardSkeleton />}
      {list && list.length === 0 && <div className="empty"><div className="big">📋</div>{t('emptyMyJobs')}</div>}
      {list?.map((j) => (
        <article className="card tappable" key={j.id} onClick={() => nav(`/app/tin/${j.id}`)} role="button" tabIndex={0}>
          <div className="row between" style={{ alignItems: 'flex-start' }}>
            <h3 className="job-title grow">{j.title}</h3>
            {j.status === 'closed' ? <span className="badge gray">{t('closed')}</span> : j.is_urgent ? <span className="badge urgent">{t('urgent')}</span> : null}
          </div>
          <div className="chips">
            <span className="chip">📅 {dateRange(j.start_date, j.end_date)}</span>
            <span className="chip">👥 {t('filledOf', { filled: j.filled, slots: j.slots })}</span>
            {j.newApplicants > 0
              ? <span className="badge info">{t('newApplicants', { n: j.newApplicants })}</span>
              : <span className="chip">{t('applicantsN', { n: j.applicants })}</span>}
          </div>
        </article>
      ))}
      <Dock>
        {list && list.length === 0 && <div className="tip">{t('firstTip')}</div>}
        <button className="btn primary block" onClick={() => { tap(); nav('/app/dang-tin') }}>{t('postJob')}</button>
      </Dock>
    </div>
  )
}
