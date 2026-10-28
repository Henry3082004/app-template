import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useI18n } from '../lib/i18n'
import type { DeletionRequest } from '../lib/types'
import { Btn, ErrorBox, Fld } from './ui'

/** "Xóa tài khoản": sends a request the admin fulfils within 7 days (the privacy policy's promise). Can be cancelled. */
export function DeleteAccount() {
  const { t } = useI18n()
  const [req, setReq] = useState<DeletionRequest | null | undefined>(undefined)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const load = () => api.myDeletionRequest().then(setReq).catch((e) => { setReq(null); setError(e) })
  useEffect(() => { load() }, [])
  const run = async (fn: () => Promise<unknown>) => { setBusy(true); setError(null); try { await fn(); await load() } catch (e) { setError(e) } finally { setBusy(false) } }
  const send = () => { if (confirm(t('deleteConfirm'))) run(() => api.requestDeletion(reason)) }
  const when = req ? new Date(req.requested_at).toLocaleString() : ''
  return (
    <div className="stack">
      <div className="sub" style={{ fontSize: 14 }}>{t('deleteText')}</div>
      {req
        ? (
          <>
            <div className="notice info">{t('deletePending', { when })}</div>
            <Btn v="ghost" block onClick={() => run(() => api.cancelDeletion())} disabled={busy}>{t('deleteCancel')}</Btn>
          </>
        )
        : req === null && (
          <>
            <Fld label={t('deleteReason')} htmlFor="del-reason"><input id="del-reason" className="inp" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} /></Fld>
            <Btn v="danger" block onClick={send} disabled={busy}>{t('deleteSend')}</Btn>
          </>
        )}
      {error != null && <ErrorBox error={error} where="DeleteAccount" />}
    </div>
  )
}
