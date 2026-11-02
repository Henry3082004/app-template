import { useEffect, useState } from 'react'
import { Btn, ErrorBox } from '../../../components/ui'
import { api } from '../../../lib/api'
import { money } from '../../../lib/format'
import { useI18n } from '../../../lib/i18n'
import { queryClient } from '../../../lib/query'
import type { AdminFees } from '../../../lib/types'
import { useAction } from '../../../lib/useAction'

/** Admin: the service fee per finished shift and the voucher (lower it step by step: 100% → 50% → 0%), and this month's totals. */
export function FeeAdminCard() {
  const { t, locale } = useI18n()
  const [f, setF] = useState<AdminFees | null>(null)
  const [fee, setFee] = useState('')
  const [pct, setPct] = useState('')
  const [name, setName] = useState('')
  const [saved, setSaved] = useState(false)
  const act = useAction()
  const load = () => api.adminFees().then((x) => { setF(x); setFee(String(x.fee)); setPct(String(x.voucher_pct)); setName(x.voucher_name ?? '') }).catch(() => undefined)
  useEffect(() => { load() }, [])
  if (!f) return null
  const nFee = Number(fee), nPct = Number(pct)
  const ok = Number.isInteger(nFee) && nFee >= 0 && nFee <= 1_000_000 && Number.isInteger(nPct) && nPct >= 0 && nPct <= 100
  const due = ok ? nFee - Math.floor((nFee * nPct) / 100) : 0
  const save = () => act.run('save', async () => {
    await api.adminSetFee(nFee, nPct, name)
    setSaved(true); queryClient.invalidateQueries({ queryKey: ['feePlan'] }); await load()
  })
  return (
    <section className="card stack">
      <b>{t('feeAdminTitle')}</b>
      <div className="tiles">
        <div><b>{f.month_shifts}</b><span>{t('feeAdminShifts')}</span></div>
        <div><b>{money(f.month_fee, locale)}</b><span>{t('feeMonthFee')}</span></div>
        <div><b>{money(f.month_due, locale)}</b><span>{t('feeMonthDue')}</span></div>
      </div>
      <label className="small">{t('feeAdminFee')}<input className="inp" inputMode="numeric" value={fee} onChange={(e) => { setFee(e.target.value.replace(/\D/g, '')); setSaved(false) }} /></label>
      <label className="small">{t('feeAdminPct')}<input className="inp" inputMode="numeric" value={pct} onChange={(e) => { setPct(e.target.value.replace(/\D/g, '')); setSaved(false) }} /></label>
      <label className="small">{t('feeAdminName')}<input className="inp" value={name} maxLength={60} onChange={(e) => { setName(e.target.value); setSaved(false) }} /></label>
      <div className="small muted">{ok ? t('feeAdminPreview', { due: money(due, locale) }) : t('feeAdminBad')}</div>
      <div className="acts"><Btn sm disabled={!ok || act.busy === 'save'} onClick={save}>{t('feeAdminSave')}</Btn>{saved && <span className="small muted">{t('feeAdminSaved')}</span>}</div>
      <div className="small muted">{t('feeAdminHint')}</div>
      {act.error != null && <ErrorBox error={act.error} where="FeeAdminCard" />}
    </section>
  )
}
