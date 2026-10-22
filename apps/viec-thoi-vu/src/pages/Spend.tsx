import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Empty, ErrorBox, Skel, Tag } from '../components/ui'
import { dateRange, money } from '../lib/format'
import { spendOf } from '../lib/hires'
import { useHires } from '../lib/hires'
import { useI18n } from '../lib/i18n'
import { useSession } from '../lib/session'

/** "Chi phí": what my finished shifts cost. Until payments are on this is the pay agreed for each shift (the shop pays cash). */
export default function Spend() {
  const { t, locale } = useI18n()
  const { profile, ready } = useSession()
  const { list, error, reload } = useHires()
  const [tab, setTab] = useState<'shifts' | 'months'>('shifts')
  if (!ready) return <div className="pg"><Skel n={2} /></div>
  if (profile?.role !== 'employer') return <Navigate to="/app" replace />
  const s = list ? spendOf(list) : null
  return (
    <div className="page-scroll"><div className="pg wide incomepg">
      <h1 className="ptitle">{t('navSpend')}</h1>
      <section className="card walletdark">
        <div className="wtop"><span>{t('spendMonth')}</span></div>
        <div className="wamt">{s ? money(s.thisMonth, locale) : '…'}</div>
        {!!s?.held && <div className="wnote">{t('spendHeld', { n: money(s.held, locale) })}</div>}
        {!!s?.unpaidCash && <div className="wnote">{t('unpaidCashN', { n: s.unpaidCash })}</div>}
      </section>
      <div className="tiles stats">
        <div><b>{s ? money(s.total, locale) : '…'}</b><span>{t('spendTotal')}</span></div>
        <div><b>{s?.shifts ?? '…'}</b><span>{t('spendShifts')}</span></div>
        <div><b>{s?.people ?? '…'}</b><span>{t('spendPeople')}</span></div>
      </div>
      {s?.estimated && <div className="notice info">{t('spendEstimated')}</div>}
      {error != null && <ErrorBox error={error} where="Spend.load" onRetry={reload} />}
      <div className="seg pills" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'shifts'} className={tab === 'shifts' ? 'on' : ''} onClick={() => setTab('shifts')}>{t('spendByShift')}</button>
        <button type="button" role="tab" aria-selected={tab === 'months'} className={tab === 'months' ? 'on' : ''} onClick={() => setTab('months')}>{t('spendByMonth')}</button>
      </div>
      {!s && !error && <Skel n={2} />}
      {s && s.rows.length === 0 && <Empty pose="empty" title={t('spendNone')} sub={t('spendNoneSub')} />}
      {s && tab === 'shifts' && s.rows.length > 0 && (
        <div className="card txlist">
          {s.rows.map((h) => (
            <div key={h.id} className="tx">
              <div><b>{h.full_name}</b><span className="muted small">{h.job.title} · {dateRange(h.job.end_date, h.job.end_date)}</span></div>
              <div className="txr">
                <b className="pay">−{money(Number(h.escrow_amount), locale)}</b>
                {h.funding_mode === 'off' && <Tag tone={h.paid_cash_at ? 'ok' : 'p'}>{t(h.paid_cash_at ? 'paidCashTag' : 'unpaidCashTag')}</Tag>}
              </div>
            </div>
          ))}
        </div>
      )}
      {s && tab === 'months' && s.months.length > 0 && (
        <div className="stack">
          {s.months.map((m, i) => (
            <details key={m.month} className="arow" open={i === 0}>
              <summary><span><b>{t('monthOf', { m: m.label })}</b><small>{t('shiftsN', { n: m.shifts.length })}</small></span><b className="pay">{money(m.total, locale)}</b></summary>
              <div className="abody">
                {m.shifts.map((h) => (
                  <div key={h.id} className="tx"><div><b>{h.full_name}</b><span className="muted small">{h.job.title} · {dateRange(h.job.end_date, h.job.end_date)}</span></div><b>{money(Number(h.escrow_amount), locale)}</b></div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </div></div>
  )
}
