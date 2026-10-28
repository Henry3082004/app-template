import { useEffect, useState } from 'react'
import { Empty, ErrorBox, Skel, Tag } from '../../components/ui'
import { api } from '../../lib/api'
import { money } from '../../lib/format'
import { useI18n, type TKey } from '../../lib/i18n'
import { useSession } from '../../lib/session'
import type { AdminDeletion, AdminDispute, AdminFlag, AdminReport, AdminPayout, AdminSamples, AdminStats } from '../../lib/types'
import { DeletionCard } from './cards/DeletionCard'
import { DisputeCard } from './cards/DisputeCard'
import { HealthCard, SentryCheck } from './cards/Health'
import { PayoutCard } from './cards/PayoutCard'
import { ReportCard } from './cards/ReportCard'
import { SamplesTab } from './cards/SamplesTab'

type Tab = 'disputes' | 'payouts' | 'flags' | 'samples' | 'reports' | 'deletions'

export default function Admin() {
  const { t, locale } = useI18n()
  const { profile, ready } = useSession()
  const [tab, setTab] = useState<Tab>('disputes')
  const [disputes, setDisputes] = useState<AdminDispute[] | null>(null)
  const [payouts, setPayouts] = useState<AdminPayout[] | null>(null)
  const [flags, setFlags] = useState<AdminFlag[] | null>(null)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [samples, setSamples] = useState<AdminSamples | null>(null)
  const [reports, setReports] = useState<AdminReport[] | null>(null)
  const [deletions, setDeletions] = useState<AdminDeletion[] | null>(null)
  const [error, setError] = useState<unknown>(null)

  const load = () => {
    setError(null)
    api.adminDisputes().then(setDisputes).catch(setError)
    api.adminPayouts().then(setPayouts).catch(setError)
    api.adminFlags().then(setFlags).catch(setError)
    api.adminStats().then(setStats).catch(setError)
    api.adminSamples().then(setSamples).catch(setError)
    api.adminReports().then(setReports).catch(setError)
    api.adminDeletions().then(setDeletions).catch(setError)
  }
  useEffect(() => { if (profile?.is_admin) load() }, [profile?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return <div className="pg"><Skel n={2} /></div>
  if (!profile?.is_admin) return <div className="page-scroll"><div className="pg"><Empty pose="error" title={t('adminNoAccess')} /></div></div>

  const pendingN = payouts?.filter((p) => p.status === 'pending').length ?? 0
  const openReports = reports?.filter((r) => r.status === 'open').length ?? 0
  const openDeletions = deletions?.filter((d) => d.status === 'open').length ?? 0
  return (
    <div className="page-scroll"><div className="pg wide">
      <h1 className="ptitle" style={{ marginBottom: 16 }}>{t('adminTitle')}</h1>
      <HealthCard s={stats} />
      <div className="seg" style={{ marginBottom: 16 }}>
        <button type="button" className={tab === 'disputes' ? 'on' : ''} onClick={() => setTab('disputes')}>{t('adminTabDisputes')}{disputes?.length ? ` (${disputes.length})` : ''}</button>
        <button type="button" className={tab === 'payouts' ? 'on' : ''} onClick={() => setTab('payouts')}>{t('adminTabPayouts')}{pendingN ? ` (${pendingN})` : ''}</button>
        <button type="button" className={tab === 'flags' ? 'on' : ''} onClick={() => setTab('flags')}>{t('adminTabFlags')}{flags?.length ? ` (${flags.length})` : ''}</button>
        <button type="button" className={tab === 'reports' ? 'on' : ''} onClick={() => setTab('reports')}>{t('adminTabReports')}{openReports ? ` (${openReports})` : ''}</button>
        <button type="button" className={tab === 'deletions' ? 'on' : ''} onClick={() => setTab('deletions')}>{t('adminTabDeletions')}{openDeletions ? ` (${openDeletions})` : ''}</button>
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
      {tab === 'reports' && (
        <>
          {!reports && !error && <Skel n={2} />}
          {reports?.length === 0 && <Empty pose="empty" title={t('noReports')} />}
          <div className="g2">{reports?.map((r) => <ReportCard key={r.id} r={r} onDone={load} />)}</div>
        </>
      )}
      {tab === 'deletions' && (
        <>
          {!deletions && !error && <Skel n={2} />}
          {deletions?.length === 0 && <Empty pose="empty" title={t('noDeletions')} />}
          <div className="g2">{deletions?.map((d) => <DeletionCard key={d.id} d={d} onDone={load} />)}</div>
        </>
      )}
      {tab === 'samples' && <SamplesTab s={samples} />}
      <SentryCheck />
    </div></div>
  )
}
