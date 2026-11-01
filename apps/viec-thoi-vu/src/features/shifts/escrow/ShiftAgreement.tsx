import { api } from '../../../lib/api'
import { dateRange } from '../../../lib/format'
import { useI18n } from '../../../lib/i18n'
import { useAction } from '../../../lib/useAction'
import { Btn, ErrorBox, Tag } from '../../../components/ui'
import { Pay } from '../../jobs/JobCard'
import type { Escrow, Job } from '../../../lib/types'

/** "Thỏa thuận ca": the job, the day and the pay as posted, and a tap from each side to say they agree. */
export function ShiftAgreement({ appId, app, job, side, otherName, onChanged }: { appId: string; app: Escrow; job: Job; side: 'seeker' | 'employer'; otherName: string; onChanged(): void }) {
  const { t } = useI18n()
  const act = useAction()
  const mine = side === 'seeker' ? app.agreed_seeker_at : app.agreed_employer_at
  const theirs = side === 'seeker' ? app.agreed_employer_at : app.agreed_seeker_at
  return (
    <div className="notice info stack agree">
      <b>{t('agreeTitle')}</b>
      <div className="small">{job.title} · {dateRange(job.start_date, job.end_date)}{job.shift_note ? ` · ${job.shift_note}` : ''}</div>
      <Pay job={job} />
      {mine && theirs
        ? <Tag tone="ok">{t('agreeBoth')}</Tag>
        : (
          <div className="acts">
            {mine ? <Tag tone="ok">{t('agreeMine')}</Tag> : <Btn sm disabled={act.busy === appId} onClick={() => act.run(appId, async () => { await api.agreeShift(appId); onChanged() })}>{t('agreeBtn')}</Btn>}
            {theirs ? <Tag tone="ok">{t('agreeOther', { name: otherName })}</Tag> : <span className="muted small">{t('agreeWaitOther', { name: otherName })}</span>}
          </div>
        )}
      {act.error != null && <ErrorBox error={act.error} where="ShiftAgreement" />}
    </div>
  )
}
