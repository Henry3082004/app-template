import { useState } from 'react'
import { api } from '../../../lib/api'
import { useI18n } from '../../../lib/i18n'
import { Btn, ErrorBox } from '../../../components/ui'

export function DirectPay({ id, onDone }: { id: string; onDone(): void }) {
  const { locale } = useI18n()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const go = async () => {
    setBusy(true); setError(null)
    try { await api.chooseDirectPay(id); onDone() } catch (e) { setError(e) } finally { setBusy(false) }
  }
  return <div className="stack">
    <Btn v="ghost" block disabled={busy} onClick={go}>{locale === 'vi' ? 'Thanh toán trực tiếp sau ca' : 'Pay worker directly after shift'}</Btn>
    <div className="small muted">{locale === 'vi' ? 'Quán trả thẳng cho người làm sau ca. Không nạp trước qua Capi.' : 'Pay the worker after the shift. No advance deposit through Capi.'}</div>
    {error != null && <ErrorBox error={error} where="DirectPay" />}
  </div>
}
