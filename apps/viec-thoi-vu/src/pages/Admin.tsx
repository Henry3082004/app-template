import { useEffect, useState } from 'react'
import { Ic } from '../components/Ic'
import { Btn, Empty, ErrorBox, Skel, Tag } from '../components/ui'
import { api } from '../lib/api'
import { dateRange, money } from '../lib/format'
import { useI18n, type TKey } from '../lib/i18n'
import { displayPhone, telHref } from '../lib/phone'
import { useSession } from '../lib/session'
import type { AdminDispute, AdminPayout } from '../lib/types'

type Tab = 'disputes' | 'payouts'

function DisputeCard({ d, onDone }: { d: AdminDispute; onDone(): void }) {
  const { t, locale } = useI18n()
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const resolve = async (outcome: 'release' | 'refund') => {
    if (!confirm(t(outcome === 'release' ? 'resolveConfirmRelease' : 'resolveConfirmRefund'))) return
    setBusy(true); setError(null)
    try { await api.resolveDispute(d.application_id, outcome, note); onDone() } catch (e) { setError(e); setBusy(false) }
  }
  const att = d.attendance ? t((`attLabel${d.attendance[0].toUpperCase()}${d.attendance.slice(1)}`) as TKey) : '—'
  return (
    <article className="card stack">
      <div className="hrow"><h3 style={{ fontSize: 17 }}>{d.job_title}</h3>{d.funding_mode === 'test' && <Tag tone="sun">{t('modeTest')}</Tag>}</div>
      <div className="pay">{money(d.amount ?? 0, locale)}</div>
      <div className="sub"><Ic n="calendar" size={14} /> {dateRange(d.start_date, d.end_date)}</div>
      <div className="adminrows">
        <div><span>{t('adminEmployer')}</span><b>{d.employer_name}</b>{d.employer_phone && <a href={telHref(d.employer_phone)}>{displayPhone(d.employer_phone)}</a>}</div>
        <div><span>{t('adminWorker')}</span><b>{d.seeker_name}</b>{d.seeker_phone && <a href={telHref(d.seeker_phone)}>{displayPhone(d.seeker_phone)}</a>}</div>
        <div><span>{t('adminAttendance')}</span><b>{att}</b></div>
        <div><span>{t('adminReason')}</span><b>{d.reason === 'worker_contests_noshow' ? t('reasonContest') : d.reason ?? '—'}</b></div>
      </div>
      <textarea className="inp" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('resolveNote')} aria-label={t('resolveNote')} />
      {error != null && <ErrorBox error={error} where="Admin.resolve" />}
      <div className="acts">
        <Btn v="ghost" disabled={busy} onClick={() => resolve('refund')}>{t('resolveRefund')}</Btn>
        <Btn disabled={busy} onClick={() => resolve('release')}>{t('resolveRelease')}</Btn>
      </div>
    </article>
  )
}

function PayoutCard({ p, onDone }: { p: AdminPayout; onDone(): void }) {
  const { t, locale } = useI18n()
  const [ref, setRef] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const paid = p.status === 'paid'
  const mark = async () => {
    setBusy(true); setError(null)
    try { await api.markPayoutPaid(p.id, ref); onDone() } catch (e) { setError(e); setBusy(false) }
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(p.account_no ?? ''); setCopied(true) } catch { /* clipboard blocked */ }
  }
  return (
    <article className="card stack">
      <div className="hrow"><h3 style={{ fontSize: 17 }}>{p.seeker_name}</h3><span className="row" style={{ gap: 6 }}>{p.mode === 'test' && <Tag tone="sun">{t('modeTest')}</Tag>}<Tag tone={paid ? 'ok' : 'p'}>{t(paid ? 'payoutPaid' : 'payoutPending')}</Tag></span></div>
      <div className="pay">{money(p.amount, locale)}</div>
      {p.account_no ? (
        <div className="adminrows">
          <div><span>{t('bankName')}</span><b>{p.bank_name}</b></div>
          <div><span>{t('bankAccount')}</span><b>{p.account_no}</b></div>
          <div><span>{t('bankHolder')}</span><b>{p.holder_name}</b></div>
          {!paid && <div><Btn v="text" sm onClick={copy}>{copied ? t('copied') : t('copyAcct')}</Btn></div>}
        </div>
      ) : <div className="notice warn">{t('noBankYet')}</div>}
      {paid && p.reference && <div className="small muted">{t('payoutRef')}: {p.reference}</div>}
      {!paid && (
        <>
          <input className="inp" value={ref} onChange={(e) => setRef(e.target.value)} maxLength={100} placeholder={t('payoutRef')} aria-label={t('payoutRef')} />
          {error != null && <ErrorBox error={error} where="Admin.payout" />}
          <Btn onClick={mark} disabled={busy || !p.account_no}>{busy ? '…' : t('markPaid')}</Btn>
        </>
      )}
    </article>
  )
}

export default function Admin() {
  const { t } = useI18n()
  const { profile, ready } = useSession()
  const [tab, setTab] = useState<Tab>('disputes')
  const [disputes, setDisputes] = useState<AdminDispute[] | null>(null)
  const [payouts, setPayouts] = useState<AdminPayout[] | null>(null)
  const [error, setError] = useState<unknown>(null)

  const load = () => {
    setError(null)
    api.adminDisputes().then(setDisputes).catch(setError)
    api.adminPayouts().then(setPayouts).catch(setError)
  }
  useEffect(() => { if (profile?.is_admin) load() }, [profile?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return <div className="pg"><Skel n={2} /></div>
  if (!profile?.is_admin) return <div className="page-scroll"><div className="pg"><Empty pose="error" title={t('adminNoAccess')} /></div></div>

  const pendingN = payouts?.filter((p) => p.status === 'pending').length ?? 0
  return (
    <div className="page-scroll"><div className="pg wide">
      <h1 className="ptitle" style={{ marginBottom: 16 }}>{t('adminTitle')}</h1>
      <div className="seg" style={{ marginBottom: 16 }}>
        <button type="button" className={tab === 'disputes' ? 'on' : ''} onClick={() => setTab('disputes')}>{t('adminTabDisputes')}{disputes?.length ? ` (${disputes.length})` : ''}</button>
        <button type="button" className={tab === 'payouts' ? 'on' : ''} onClick={() => setTab('payouts')}>{t('adminTabPayouts')}{pendingN ? ` (${pendingN})` : ''}</button>
      </div>
      {error != null && <ErrorBox error={error} where="Admin.load" onRetry={load} />}
      {tab === 'disputes' && (
        <>
          {!disputes && !error && <Skel n={2} />}
          {disputes?.length === 0 && <Empty pose="empty" title={t('noDisputes')} />}
          <div className="g2">{disputes?.map((d) => <DisputeCard key={d.application_id} d={d} onDone={load} />)}</div>
        </>
      )}
      {tab === 'payouts' && (
        <>
          {!payouts && !error && <Skel n={2} />}
          {payouts?.length === 0 && <Empty pose="empty" title={t('noPayouts')} />}
          <div className="g2">{payouts?.map((p) => <PayoutCard key={p.id} p={p} onDone={load} />)}</div>
        </>
      )}
    </div></div>
  )
}
