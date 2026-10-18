import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { money } from '../../lib/format'
import { useI18n, type TKey } from '../../lib/i18n'
import { useAppConfig } from '../../lib/config'
import { Btn, Dialog, ErrorBox, Fld } from '../ui'
import type { Applicant, Attendance, Quote } from '../../lib/types'
import type { JobTerms } from './shared'

function TestNote() {
  const { t } = useI18n()
  return <div className="notice info"><b>{t('testMode')}</b><br />{t('testModeSub')}</div>
}

export function FundDialog({ app, job, onClose, onDone }: { app: Applicant; job: JobTerms; onClose(): void; onDone(): void }) {
  const { t, locale } = useI18n()
  const days = Math.max(Math.round((Date.parse(job.end_date) - Date.parse(job.start_date)) / 864e5) + 1, 1)
  const [hours, setHours] = useState(String(8 * days))
  const [q, setQ] = useState<Quote | null>(null)
  const [test, setTest] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const h = job.pay_unit === 'hour' ? Number(hours) : undefined

  const cfg = useAppConfig()
  useEffect(() => { if (cfg) setTest(cfg.payment_mode === 'test') }, [cfg])
  useEffect(() => {
    if (h !== undefined && !(h >= 1)) { setQ(null); return }
    let live = true
    api.quote(app.id, h).then((x) => { if (live) { setQ(x); setError(null) } }).catch((e) => { if (live) { setQ(null); setError(e) } })
    return () => { live = false }
  }, [app.id, h])

  const go = async () => {
    setBusy(true); setError(null)
    try { await api.fund(app.id, h); onDone() } catch (e) { setError(e); setBusy(false) }
  }
  const pct = q && q.amount ? Math.round((q.fee / q.amount) * 100) : 0
  return (
    <Dialog label={t('fundTitle')} onClose={onClose}>
      <div className="stack">
        <h2>{t('fundTitle')}</h2>
        <div className="sub">{t('fundHint')}</div>
        {test && <TestNote />}
        {job.pay_unit === 'hour' && (
          <Fld label={t('fundHours')} htmlFor="fh"><input id="fh" className="inp" type="number" inputMode="numeric" min={1} value={hours} onChange={(e) => setHours(e.target.value)} /></Fld>
        )}
        {q && (
          <div className="sumrows">
            <div><span>{t('fundAmount')}</span><b>{money(q.amount, locale)}</b></div>
            <div className="muted"><span>{t('fundFee', { pct })}</span><span>−{money(q.fee, locale)}</span></div>
            <div><span>{t('fundNet')}</span><b>{money(q.net, locale)}</b></div>
          </div>
        )}
        {error != null && <ErrorBox error={error} where="FundDialog" />}
        <Btn block onClick={go} disabled={busy || !q}>{busy ? '…' : t('fundConfirm')}</Btn>
        <Btn v="text" onClick={onClose}>{t('cancel')}</Btn>
      </div>
    </Dialog>
  )
}

export function CompleteDialog({ app, free, onClose, onDone }: { app: Applicant; free?: boolean; onClose(): void; onDone(a: Attendance): void }) {
  const { t } = useI18n()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const pick = async (a: Attendance) => {
    setBusy(true); setError(null)
    try { await api.completeShift(app.id, a); onDone(a) } catch (e) { setError(e); setBusy(false) }
  }
  const opts: [Attendance, TKey, TKey][] = free
    ? [['ok', 'attOk', 'attOkSubFree'], ['late', 'attLate', 'attLateSubFree'], ['noshow', 'attNoshow', 'attNoshowSubFree']]
    : [['ok', 'attOk', 'attOkSub'], ['late', 'attLate', 'attLateSub'], ['noshow', 'attNoshow', 'attNoshowSub']]
  return (
    <Dialog label={t('completeTitle')} onClose={onClose}>
      <div className="stack">
        <h2>{t('completeTitle')}</h2>
        <div className="opts">
          {opts.map(([k, l, s]) => (
            <button key={k} type="button" className={'opt ' + k} disabled={busy} onClick={() => pick(k)}><b>{t(l)}</b><span>{t(s)}</span></button>
          ))}
        </div>
        {error != null && <ErrorBox error={error} where="CompleteDialog" />}
        <Btn v="text" onClick={onClose}>{t('cancel')}</Btn>
      </div>
    </Dialog>
  )
}

export function DisputeDialog({ appId, onClose, onDone }: { appId: string; onClose(): void; onDone(): void }) {
  const { t } = useI18n()
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const send = async () => {
    setBusy(true); setError(null)
    try { await api.openDispute(appId, reason); onDone() } catch (e) { setError(e); setBusy(false) }
  }
  return (
    <Dialog label={t('disputeTitle')} onClose={onClose}>
      <div className="stack">
        <h2>{t('disputeTitle')}</h2>
        <div className="sub">{t('disputeHint')}</div>
        <textarea className="inp" maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('disputePh')} aria-label={t('disputePh')} />
        {error != null && <ErrorBox error={error} where="DisputeDialog" />}
        <Btn block onClick={send} disabled={busy || reason.trim().length < 3}>{busy ? '…' : t('disputeSend')}</Btn>
        <Btn v="text" onClick={onClose}>{t('cancel')}</Btn>
      </div>
    </Dialog>
  )
}
