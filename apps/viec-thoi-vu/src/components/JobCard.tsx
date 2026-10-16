import { dateRange, money, payUnitKey } from '../lib/format'
import { fmtKm } from '../lib/geo'
import { useI18n } from '../lib/i18n'
import type { Job, Reputation } from '../lib/types'
import { Rep } from './Escrow'
import { Tag } from './ui'

export function Pay({ job, xl }: { job: Job; xl?: boolean }) {
  const { t, locale } = useI18n()
  return <div className={xl ? 'pay xl' : 'pay'}>{money(job.pay_amount, locale)} <small>/ {t(payUnitKey(job.pay_unit))}</small></div>
}

export function JobCard({ job, distance, sel, rep, onOpen }: { job: Job; distance?: number | null; sel?: boolean; rep?: Reputation; onOpen(): void }) {
  const { t, locale } = useI18n()
  const left = job.slots - job.filled
  const full = left <= 0 || job.status !== 'open'
  return (
    <button type="button" className={'card job' + (sel ? ' sel' : '') + (full ? ' full' : '')} onClick={onOpen}>
      <div className="hrow"><h3>{job.title}</h3>{job.is_urgent && <Tag tone="urgent">{t('urgent')}</Tag>}</div>
      <Pay job={job} />
      {job.business_name && <div className="biz">{job.business_name}{job.business_name.includes(job.city) ? '' : ` · ${job.city}`}{distance != null ? ` · ${fmtKm(distance, locale)}` : ''}</div>}
      <Rep rep={rep} employer size="sm" />
      <div className="meta">
        <span>{dateRange(job.start_date, job.end_date)}</span>
        <span className={full || left <= 3 ? 'low' : ''}>{full ? t('full') : t('slotsLeft', { n: left })}</span>
      </div>
    </button>
  )
}
