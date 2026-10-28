import { useState } from 'react'
import { Ic } from '../../../components/Ic'
import { Btn, ErrorBox, Tag } from '../../../components/ui'
import { api } from '../../../lib/api'
import { dateRange, money } from '../../../lib/format'
import { useI18n, type TKey } from '../../../lib/i18n'
import { displayPhone, telHref } from '../../../lib/phone'
import type { AdminDispute } from '../../../lib/types'

export function DisputeCard({ d, onDone }: { d: AdminDispute; onDone(): void }) {
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
