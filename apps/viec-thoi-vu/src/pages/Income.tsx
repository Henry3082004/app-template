import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WithdrawBtn } from '../components/Wallet'
import { Btn, Empty, ErrorBox, Skel, Tag } from '../components/ui'
import { dateRange, money } from '../lib/format'
import { summarize, type Earning } from '../lib/earnings'
import { useI18n } from '../lib/i18n'
import { useSession } from '../lib/session'
import { useMine } from '../lib/useMine'
import { useAppConfig } from '../lib/config'

function status(e: Earning, t: ReturnType<typeof useI18n>['t']): [string, '' | 'ok' | 'p'] {
  if (e.mode === 'direct') return [t('earnDirect'), '']
  return e.payout === 'paid' ? [t('payoutPaid'), 'ok'] : [t('payoutPending'), 'p']
}

/** "Thu nhập": what my finished shifts earned. Money is only "in the app" when payments are on; until then it is the shop paying cash. */
export default function Income() {
  const { t, locale } = useI18n()
  const nav = useNavigate()
  const { profile, ready, askAuth } = useSession()
  const cfg = useAppConfig()
  const { list, error, reload } = useMine()
  const [tab, setTab] = useState<'tx' | 'statement'>('tx')
  if (!ready) return <div className="pg"><Skel n={2} /></div>
  if (!profile) {
    return (
      <div className="page-scroll"><div className="pg">
        <h1 className="ptitle">{t('navIncome')}</h1>
        <Empty pose="wave" title={t('loginToSee')}><Btn onClick={() => askAuth({ role: 'seeker' })}>{t('login')}</Btn></Empty>
      </div></div>
    )
  }
  const s = list ? summarize(list) : null
  return (
    <div className="page-scroll"><div className="pg wide incomepg">
      <h1 className="ptitle">{t('navIncome')}</h1>
      <section className="card walletdark">
        <div className="wtop"><span>{t('balanceNow')}</span></div>
        <div className="wamt">{s ? money(s.balance, locale) : '…'}</div>
        <WithdrawBtn dark />
        <div className="wnote">{t(cfg?.payment_mode === 'off' ? 'withdrawHint' : 'withdrawHintApp')}</div>
      </section>
      <div className="tiles stats">
        <div><b>{s ? money(s.thisMonth, locale) : '…'}</b><span>{t('incomeThisMonth')}</span></div>
        <div><b>{s ? money(s.total, locale) : '…'}</b><span>{t('incomeTotal')}</span></div>
        <div><b>{s?.count ?? '…'}</b><span>{t('shiftsDoneN')}</span></div>
      </div>
      {s?.estimated && <div className="notice info">{t('estimatedNote')}</div>}
      {error != null && <ErrorBox error={error} where="Income.load" onRetry={reload} />}
      <div className="seg pills" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'tx'} className={tab === 'tx' ? 'on' : ''} onClick={() => setTab('tx')}>{t('txTab')}</button>
        <button type="button" role="tab" aria-selected={tab === 'statement'} className={tab === 'statement' ? 'on' : ''} onClick={() => setTab('statement')}>{t('statementTab')}</button>
      </div>
      {!s && !error && <Skel n={2} />}
      {s && s.rows.length === 0 && <Empty pose="empty" title={t('noTx')} sub={t('noTxSub')}><Btn onClick={() => nav('/app')}>{t('findJobs')}</Btn></Empty>}
      {s && tab === 'tx' && s.rows.length > 0 && (
        <div className="card txlist">
          {s.rows.map((e) => {
            const [label, tone] = status(e, t)
            return (
              <div key={e.id} className="tx">
                <div><b>{e.title}</b><span className="muted small">{e.business} · {dateRange(e.at, e.at)}</span></div>
                <div className="txr"><b className="pay">+{money(e.net, locale)}</b><Tag tone={tone}>{label}</Tag>{e.reference && <span className="muted small">{e.reference}</span>}</div>
              </div>
            )
          })}
        </div>
      )}
      {s && tab === 'statement' && s.months.length > 0 && (
        <div className="stack">
          {s.months.map((m, i) => (
            <details key={m.month} className="arow" open={i === 0}>
              <summary><span><b>{t('monthOf', { m: m.label })}</b><small>{t('shiftsN', { n: m.shifts.length })}</small></span><b className="pay">{money(m.total, locale)}</b></summary>
              <div className="abody">
                {m.shifts.map((e) => (
                  <div key={e.id} className="tx"><div><b>{e.title}</b><span className="muted small">{e.business} · {dateRange(e.at, e.at)}</span></div><b>{money(e.net, locale)}</b></div>
                ))}
                {m.shifts.some((e) => e.fee > 0) && <div className="muted small">{t('feeNote', { n: money(m.shifts.reduce((x, e) => x + e.fee, 0), locale) })}</div>}
              </div>
            </details>
          ))}
        </div>
      )}
    </div></div>
  )
}
