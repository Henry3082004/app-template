import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ErrorBox } from '../components/ErrorBox'
import { PayLine } from '../components/JobCard'
import { CardSkeleton } from '../components/Skeleton'
import { Topbar } from '../components/Topbar'
import { api } from '../lib/api'
import { dateRange } from '../lib/format'
import { useI18n } from '../lib/i18n'
import { displayPhone, telHref, zaloHref } from '../lib/phone'
import { useSession } from '../lib/session'
import type { AppStatus, MyApplication } from '../lib/types'

const BADGE: Record<AppStatus, string> = { pending: 'badge info', accepted: 'badge ok', rejected: 'badge gray', withdrawn: 'badge gray' }

export default function MyApplications() {
  const { t } = useI18n()
  const nav = useNavigate()
  const { profile, ready, askAuth } = useSession()
  const [list, setList] = useState<MyApplication[] | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [actErr, setActErr] = useState<unknown>(null)

  const load = () => {
    if (!profile || profile.role !== 'seeker') return
    setError(null)
    api.myApplications().then(setList).catch(setError)
  }
  useEffect(load, [profile])

  const withdraw = async (id: string) => {
    if (!confirm(t('withdrawConfirm'))) return
    setActErr(null)
    try { await api.withdraw(id); load() } catch (e) { setActErr(e) }
  }

  if (!ready) return <CardSkeleton />
  if (!profile) {
    return (
      <div className="page-enter">
        <Topbar title={t('appliedTitlePage')} />
        <div className="empty"><div className="big">📨</div>{t('loginToSee')}</div>
        <button className="btn primary block" onClick={() => askAuth({ role: 'seeker' })}>{t('login')}</button>
      </div>
    )
  }

  return (
    <div className="page-enter">
      <Topbar title={t('appliedTitlePage')} />
      {error != null && <ErrorBox error={error} where="MyApplications.load" onRetry={load} />}
      {actErr != null && <div style={{ marginBottom: 12 }}><ErrorBox error={actErr} where="MyApplications.withdraw" /></div>}
      {!list && !error && <CardSkeleton />}
      {list && list.length === 0 && (
        <>
          <div className="empty"><div className="big">🌱</div>{t('emptyApplied')}</div>
          <button className="btn primary block" onClick={() => nav('/app')}>{t('findJobs')}</button>
        </>
      )}
      {list?.map((a) => (
        <article className="card" key={a.id}>
          <div className="row between" style={{ alignItems: 'flex-start' }}>
            <h3 className="job-title grow tappable" style={{ cursor: 'pointer' }} onClick={() => nav(`/app/viec/${a.job.id}`)}>{a.job.title}</h3>
            <span className={BADGE[a.status]}>{t(`st${a.status}`)}</span>
          </div>
          <PayLine job={a.job} />
          <div className="chips">
            <span className="chip">📅 {dateRange(a.job.start_date, a.job.end_date)}</span>
            <span className="chip">📍 {a.job.city}</span>
          </div>
          {a.job.business_name && <div className="employer-name">🏪 {a.job.business_name}</div>}
          {a.status === 'accepted' && a.employer_phone && (
            <div className="notice info mt-12">
              <div className="small">{t('employerPhone')}</div>
              <div className="phone-big">{displayPhone(a.employer_phone)}</div>
              <div className="two mt-8">
                <a className="btn primary small" href={telHref(a.employer_phone)}>📞 {t('call')}</a>
                <a className="btn secondary small" href={zaloHref(a.employer_phone)} target="_blank" rel="noreferrer">💬 {t('zalo')}</a>
              </div>
            </div>
          )}
          {a.status === 'pending' && (
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button className="btn danger-text small" onClick={() => withdraw(a.id)}>{t('withdraw')}</button>
            </div>
          )}
        </article>
      ))}
    </div>
  )
}
