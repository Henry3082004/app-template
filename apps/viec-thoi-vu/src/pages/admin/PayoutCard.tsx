import { useState } from 'react'
import { Btn, ErrorBox, Tag } from '../../components/ui'
import { api } from '../../lib/api'
import { money } from '../../lib/format'
import { useI18n } from '../../lib/i18n'
import type { AdminPayout } from '../../lib/types'

export function PayoutCard({ p, onDone }: { p: AdminPayout; onDone(): void }) {
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
