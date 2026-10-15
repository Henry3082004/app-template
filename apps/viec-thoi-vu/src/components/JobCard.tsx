import { dateRange, money, payUnitKey } from '../lib/format'
import { fmtKm } from '../lib/geo'
import { useI18n } from '../lib/i18n'
import type { Job } from '../lib/types'

export function PayLine({ job, big }: { job: Job; big?: boolean }) {
  const { t, locale } = useI18n()
  return <div className={big ? 'pay big' : 'pay'}>{money(job.pay_amount, locale)} / {t(payUnitKey(job.pay_unit))}</div>
}

export function JobCard({ job, distance, onOpen }: { job: Job; distance?: number | null; onOpen(): void }) {
  const { t, locale } = useI18n()
  const left = job.slots - job.filled
  return (
    <article className="card tappable" onClick={onOpen} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onOpen()}>
      <div className="row between" style={{ alignItems: 'flex-start' }}>
        <h3 className="job-title grow">{job.title}</h3>
        {job.is_urgent && <span className="badge urgent">{t('urgent')}</span>}
      </div>
      <PayLine job={job} />
      <div className="chips">
        <span className="chip">📅 {dateRange(job.start_date, job.end_date)}</span>
        <span className="chip">📍 {job.city}{distance != null ? ` · ${fmtKm(distance, locale)}` : ''}</span>
        <span className="chip">👥 {left > 0 ? t('slotsLeft', { n: left }) : t('full')}</span>
      </div>
      {job.business_name && <div className="employer-name">🏪 {job.business_name}</div>}
    </article>
  )
}
