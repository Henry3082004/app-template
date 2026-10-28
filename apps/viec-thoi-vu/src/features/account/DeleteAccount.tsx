import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'
import { useAction } from '../../lib/useAction'
import type { DeletionRequest } from '../../lib/types'
import { Btn, ErrorBox, Fld } from '../../components/ui'

/** "Xóa tài khoản": sends a request the admin fulfils within 7 days (the privacy policy's promise). Can be cancelled. */
export function DeleteAccount() {
  const { t } = useI18n()
  const [req, setReq] = useState<DeletionRequest | null | undefined>(undefined)
  const [reason, setReason] = useState('')
  const { busy, error, setError, run: act } = useAction()
  const load = () => api.myDeletionRequest().then(setReq).catch((e) => { setReq(null); setError(e) })
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const run = (fn: () => Promise<unknown>) => act('delete', async () => { await fn(); await load() })
  const send = () => { if (confirm(t('deleteConfirm'))) run(() => api.requestDeletion(reason)) }
  const when = req ? new Date(req.requested_at).toLocaleString() : ''
  return (
    <div className="stack">
      <div className="sub" style={{ fontSize: 14 }}>{t('deleteText')}</div>
      {req
        ? (
          <>
            <div className="notice info">{t('deletePending', { when })}</div>
            <Btn v="ghost" block onClick={() => run(() => api.cancelDeletion())} disabled={busy != null}>{t('deleteCancel')}</Btn>
          </>
        )
        : req === null && (
          <>
            <Fld label={t('deleteReason')} htmlFor="del-reason"><input id="del-reason" className="inp" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} /></Fld>
            <Btn v="danger" block onClick={send} disabled={busy != null}>{t('deleteSend')}</Btn>
          </>
        )}
      {error != null && <ErrorBox error={error} where="DeleteAccount" />}
    </div>
  )
}
