import { useI18n } from '../../../lib/i18n'
import type { AdminKpis } from '../../../lib/types'

const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) + '%' : '—')

/** Whether the marketplace works: posts answered within a day, shops that come back, finished shifts per week, no-shows, reply time. */
export function KpiCard({ k }: { k: AdminKpis | null }) {
  const { t } = useI18n()
  if (!k) return null
  const max = Math.max(1, ...k.weekly_shifts.map((w) => w.shifts))
  return (
    <section className="card stack kpis">
      <b>{t('kpiTitle')}</b>
      <div className="tiles">
        <div><b>{pct(k.jobs_with_applicant_24h, k.jobs_30d)}</b><span>{t('kpiApply24', { n: k.jobs_30d })}</span></div>
        <div><b>{pct(k.shops_repeat_60d, k.shops_60d)}</b><span>{t('kpiRepeat', { n: k.shops_60d })}</span></div>
        <div><b>{pct(k.noshow_30d, k.finished_30d)}</b><span>{t('kpiNoshow')}</span></div>
        <div><b>{k.avg_reply_hours_30d == null ? '—' : k.avg_reply_hours_30d + 'h'}</b><span>{t('kpiReply')}</span></div>
      </div>
      <div className="small muted">{t('kpiWeekly')}</div>
      <div className="kpibars" role="img" aria-label={t('kpiWeekly')}>
        {k.weekly_shifts.map((w) => (
          <div key={w.week}><span style={{ height: Math.max(4, (w.shifts / max) * 56) }} /><b>{w.shifts}</b><small>{w.week.slice(8, 10)}/{w.week.slice(5, 7)}</small></div>
        ))}
      </div>
      <div className="small muted">{t('kpiMore', { held: k.held_jobs, reports: k.open_reports, refs: k.referrals_30d })}</div>
    </section>
  )
}
