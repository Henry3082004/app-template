import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { useI18n } from '../../../lib/i18n'
import { Btn, ErrorBox, Fld } from '../../../components/ui'
import type { BankAccount } from '../../../lib/types'

/** Worker's payout account (Account page). Visible only to the owner and the admin. */
export function BankCard() {
  const { t } = useI18n()
  const [f, setF] = useState({ bank_name: '', account_no: '', holder_name: '' })
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  useEffect(() => { api.myBank().then((b) => { if (b) setF(b) }).catch(() => undefined) }, [])
  const save = async () => {
    setBusy(true); setSaved(false); setError(null)
    try { await api.saveBank(f); setSaved(true) } catch (e) { setError(e) } finally { setBusy(false) }
  }
  const set = (k: keyof BankAccount) => (e: { target: { value: string } }) => { setSaved(false); setF({ ...f, [k]: e.target.value }) }
  return (
    <div className="card stack">
      <b>{t('bankTitle')}</b>
      <div className="sub" style={{ fontSize: 14 }}>{t('bankHint')}</div>
      <Fld label={t('bankName')} htmlFor="bk-name"><input id="bk-name" className="inp" value={f.bank_name} onChange={set('bank_name')} maxLength={60} placeholder="Vietcombank" /></Fld>
      <Fld label={t('bankAccount')} htmlFor="bk-acct"><input id="bk-acct" className="inp" inputMode="numeric" value={f.account_no} onChange={set('account_no')} maxLength={24} /></Fld>
      <Fld label={t('bankHolder')} htmlFor="bk-holder"><input id="bk-holder" className="inp" value={f.holder_name} onChange={set('holder_name')} maxLength={80} /></Fld>
      {error != null && <ErrorBox error={error} where="BankCard.save" />}
      <Btn v="ghost" block onClick={save} disabled={busy || !f.bank_name.trim() || !f.account_no.trim() || !f.holder_name.trim()}>{busy ? '…' : saved ? t('bankSaved') : t('save')}</Btn>
    </div>
  )
}
