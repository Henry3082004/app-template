import { useEffect, useState } from 'react'
import { Ic } from '../components/Ic'
import { Avatar, Btn, Empty, ErrorBox, Skel, Tag } from '../components/ui'
import { WorkerFacts } from '../components/WorkerFields'
import { api } from '../lib/api'
import { dateRange, money } from '../lib/format'
import { useI18n, type TKey } from '../lib/i18n'
import { displayPhone, telHref } from '../lib/phone'
import { sendTestError } from '../lib/sentry'
import { useSession } from '../lib/session'
import { avatarUrl } from '../lib/worker'
import type { AdminDispute, AdminFlag, AdminPayout, AdminSamples, AdminStats, Availability, Experience } from '../lib/types'

type Tab = 'disputes' | 'payouts' | 'flags' | 'samples'

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

function HealthCard({ s }: { s: AdminStats | null }) {
  const { t } = useI18n()
  return (
    <section className="card stack" style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 17 }}>{t('healthTitle')}</h2>
      {!s ? <Skel n={1} /> : (
        <div className="tiles stats">
          <div><b>{s.employers}</b><span>{t('statEmployers')}</span></div>
          <div><b>{s.seekers}</b><span>{t('statSeekers')}</span></div>
          <div><b>{s.new_users_7d}</b><span>{t('statNewUsers', { n: s.new_users_today })}</span></div>
          <div><b>{s.open_jobs}</b><span>{t('statOpenJobs')}</span></div>
          <div><b>{s.applications_7d}</b><span>{t('statApps', { n: s.applications_today })}</span></div>
          <div><b>{s.shifts_done}</b><span>{t('statShiftsDone')}</span></div>
          <div><b>{s.reviews_total}</b><span>{t('statReviews')}</span></div>
          <div className={s.open_disputes > 0 ? 'bad' : ''}><b>{s.open_disputes}</b><span>{t('statDisputes')}</span></div>
        </div>
      )}
    </section>
  )
}

function SamplesTab({ s }: { s: AdminSamples | null }) {
  const { t } = useI18n()
  if (!s) return <Skel n={2} />
  return (
    <div className="stack">
      <p className="small muted">{t('samplesHint')}</p>
      <h2 style={{ fontSize: 17 }}>{t('samplesShops')} ({s.shops.length})</h2>
      <div className="g2">{s.shops.map((p) => (
        <article key={p.id} className="card stack">
          <div className="row"><Avatar square size={44} name={p.name ?? p.owner} src={avatarUrl(p.logo_path)} /><h3 style={{ fontSize: 16 }}>{p.name}</h3></div>
          <div className="small muted">{p.owner} · {[p.address, p.city].filter(Boolean).join(', ')}</div>
          <div><Tag tone="p">{t('samplesJobsN', { n: p.jobs })}</Tag></div>
        </article>
      ))}</div>
      <h2 style={{ fontSize: 17 }}>{t('samplesWorkers')} ({s.workers.length})</h2>
      <div className="g2">{s.workers.map((w) => (
        <article key={w.id} className="card stack">
          <div className="row"><Avatar size={44} name={w.name} src={avatarUrl(w.avatar_path)} /><h3 style={{ fontSize: 16 }}>{w.name}</h3></div>
          <div className="small muted">{w.city}</div>
          <WorkerFacts w={{ birth_year: w.birth_year, experience: (w.experience ?? []) as Experience[], availability: (w.availability ?? []) as Availability[], avatar_path: null }} />
          <div><Tag tone="p">{t('samplesAppsN', { n: w.applications })}</Tag></div>
        </article>
      ))}</div>
    </div>
  )
}

function SentryCheck() {
  const { t } = useI18n()
  const [state, setState] = useState<'idle' | 'busy' | 'sent' | 'off'>('idle')
  const send = async () => {
    setState('busy')
    setState((await sendTestError()) ? 'sent' : 'off')
  }
  return (
    <section className="card stack" style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 17 }}>{t('sentryTestTitle')}</h2>
      <p className="small muted">{t('sentryTestHint')}</p>
      <div><Btn v="ghost" sm disabled={state === 'busy'} onClick={send}>{state === 'busy' ? '…' : t('sentryTestBtn')}</Btn></div>
      {state === 'sent' && <div className="notice ok">{t('sentryTestSent')}</div>}
      {state === 'off' && <div className="notice warn">{t('sentryTestOff')}</div>}
    </section>
  )
}

export default function Admin() {
  const { t, locale } = useI18n()
  const { profile, ready } = useSession()
  const [tab, setTab] = useState<Tab>('disputes')
  const [disputes, setDisputes] = useState<AdminDispute[] | null>(null)
  const [payouts, setPayouts] = useState<AdminPayout[] | null>(null)
  const [flags, setFlags] = useState<AdminFlag[] | null>(null)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [samples, setSamples] = useState<AdminSamples | null>(null)
  const [error, setError] = useState<unknown>(null)

  const load = () => {
    setError(null)
    api.adminDisputes().then(setDisputes).catch(setError)
    api.adminPayouts().then(setPayouts).catch(setError)
    api.adminFlags().then(setFlags).catch(setError)
    api.adminStats().then(setStats).catch(setError)
    api.adminSamples().then(setSamples).catch(setError)
  }
  useEffect(() => { if (profile?.is_admin) load() }, [profile?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return <div className="pg"><Skel n={2} /></div>
  if (!profile?.is_admin) return <div className="page-scroll"><div className="pg"><Empty pose="error" title={t('adminNoAccess')} /></div></div>

  const pendingN = payouts?.filter((p) => p.status === 'pending').length ?? 0
  return (
    <div className="page-scroll"><div className="pg wide">
      <h1 className="ptitle" style={{ marginBottom: 16 }}>{t('adminTitle')}</h1>
      <HealthCard s={stats} />
      <div className="seg" style={{ marginBottom: 16 }}>
        <button type="button" className={tab === 'disputes' ? 'on' : ''} onClick={() => setTab('disputes')}>{t('adminTabDisputes')}{disputes?.length ? ` (${disputes.length})` : ''}</button>
        <button type="button" className={tab === 'payouts' ? 'on' : ''} onClick={() => setTab('payouts')}>{t('adminTabPayouts')}{pendingN ? ` (${pendingN})` : ''}</button>
        <button type="button" className={tab === 'flags' ? 'on' : ''} onClick={() => setTab('flags')}>{t('adminTabFlags')}{flags?.length ? ` (${flags.length})` : ''}</button>
        <button type="button" className={tab === 'samples' ? 'on' : ''} onClick={() => setTab('samples')}>{t('adminTabSamples')}</button>
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
      {tab === 'flags' && (
        <>
          {!flags && !error && <Skel n={2} />}
          {flags?.length === 0 && <Empty pose="empty" title={t('noFlags')} />}
          <div className="g2">{flags?.map((f, i) => (
            <article key={i} className="card stack">
              <Tag tone="urgent">{t(`flag_${f.kind}` as TKey)}</Tag>
              <div className="adminrows">
                <div><span>{t('adminEmployer')}</span><b>{f.employer_name}</b></div>
                <div><span>{t('adminWorker')}</span><b>{f.seeker_name}</b></div>
                <div><span>{t('repStatShifts')}</span><b>{t('flagShifts', { n: f.shifts })} · {money(f.total, locale)}</b></div>
              </div>
            </article>
          ))}</div>
        </>
      )}
      {tab === 'samples' && <SamplesTab s={samples} />}
      <SentryCheck />
    </div></div>
  )
}
