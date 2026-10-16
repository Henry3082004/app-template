import { dateRange, money, payUnitKey } from '../lib/format'
import { fmtKm } from '../lib/geo'
import { useI18n } from '../lib/i18n'
import type { Job } from '../lib/types'
import { Ic } from './Ic'
import { Tag } from './ui'

export function Pay({ job, xl }: { job: Job; xl?: boolean }) {
  const { t, locale } = useI18n()
  return <div className={xl ? 'pay xl' : 'pay'}>{money(job.pay_amount, locale)} <small>/ {t(payUnitKey(job.pay_unit))}</small></div>
}

export function JobCard({ job, distance, sel, onOpen }: { job: Job; distance?: number | null; sel?: boolean; onOpen(): void }) {
  const { t, locale } = useI18n()
  const left = job.slots - job.filled
  const full = left <= 0 || job.status !== 'open'
  return (
    <button type="button" className={'card job' + (sel ? ' sel' : '') + (full ? ' full' : '')} onClick={onOpen}>
      <div className="hrow"><h3>{job.title}</h3>{job.is_urgent && <Tag tone="urgent">{t('urgent')}</Tag>}</div>
      <Pay job={job} />
      <div className="tags">
        <Tag><Ic n="calendar" size={14} /> {dateRange(job.start_date, job.end_date)}</Tag>
        <Tag><Ic n="pin" size={14} /> {job.city}{distance != null ? ` · ${fmtKm(distance, locale)}` : ''}</Tag>
        <Tag><Ic n="users" size={14} /> {full ? t('full') : t('slotsLeft', { n: left })}</Tag>
      </div>
      {job.business_name && <div className="biz"><Ic n="store" size={15} /> {job.business_name}</div>}
    </button>
  )
}
