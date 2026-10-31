import { dateSpan, money, payUnitKey } from '../../lib/format'
import { fmtKm } from '../../lib/geo'
import { useI18n } from '../../lib/i18n'
import type { Job, Reputation } from '../../lib/types'
import { avatarUrl } from '../../lib/worker'
import { Ic } from '../../components/Ic'
import { Avatar, Tag } from '../../components/ui'
import { SaveButton } from './SaveButton'

export function Pay({ job, xl }: { job: Job; xl?: boolean }) {
  const { t, locale } = useI18n()
  return <div className={xl ? 'pay xl' : 'pay'}>{money(job.pay_amount, locale)} <small>/ {t(payUnitKey(job.pay_unit))}</small></div>
}

export function JobCard({ job, distance, sel, rep, fit, save, onOpen }: { job: Job; distance?: number | null; sel?: boolean; rep?: Reputation; fit?: boolean; save?: boolean; onOpen(): void }) {
  const { t, locale } = useI18n()
  const left = job.slots - job.filled
  const full = left <= 0 || job.status !== 'open'
  const rated = !!rep && rep.ratings > 0 && rep.avg_stars != null
  const card = (
    <button type="button" className={'card job' + (sel ? ' sel' : '') + (full ? ' full' : '')} onClick={onOpen}>
      <div className="hrow"><h3>{job.title}</h3>{job.is_urgent && <Tag tone="urgent">{t('urgent')}</Tag>}</div>
      {fit && <div className="fitrow"><Tag tone="ok">{t('fitTag')}</Tag></div>}
      <Pay job={job} />
      {job.business_name && (
        <div className="bizrow">
          <Avatar square size={36} name={job.business_name} src={avatarUrl(job.business_logo)} />
          <div className="biz">
            <span className="bname"><b>{job.business_name}</b>{rep && (rated ? <span className="jrate"><Ic n="star" size={13} /> {rep.avg_stars!.toFixed(1)} <small>({rep.ratings})</small></span> : rep.shifts_done === 0 && <span className="jnew">{t('jobNewShop')}</span>)}
              {rep && rep.shifts_done > 0 && <span className="jdone">{t('repShifts', { n: rep.shifts_done })}</span>}</span>
            <span>{job.city}{distance != null ? ` · ${fmtKm(distance, locale)}` : ''}</span>
          </div>
        </div>
      )}
      <div className="meta">
        <div className="jinfo">
          <span><Ic n="calendar" size={15} /> {dateSpan(job.start_date, job.end_date)}</span>
          {job.shift_note && <span className="jshift"><Ic n="clock" size={15} /> {job.shift_note}</span>}
        </div>
        <span className={'jslots' + (full ? ' full' : left <= 3 ? ' low' : '')}>{full ? t('full') : t('slotsLeft', { n: left })}</span>
      </div>
    </button>
  )
  // the save button sits beside the card button (a button cannot hold another button)
  return save ? <div className="jobwrap">{card}<SaveButton jobId={job.id} /></div> : card
}
