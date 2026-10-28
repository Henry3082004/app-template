import { useState } from 'react'
import { api } from '../lib/api'
import { useI18n, type TKey } from '../lib/i18n'
import { useAction } from '../lib/useAction'
import { REPORT_REASONS, type ReportReason } from '../lib/types'
import { Btn, Dialog, ErrorBox, Fld } from './ui'

/** Report someone you dealt with. Only the admin sees it. */
export function ReportDialog({ target, name, jobId, onClose }: { target: string; name: string; jobId?: string; onClose(): void }) {
  const { t } = useI18n()
  const [reason, setReason] = useState<ReportReason>('scam')
  const [detail, setDetail] = useState('')
  const [done, setDone] = useState(false)
  const { busy, error, run } = useAction()
  const send = () => run('report', async () => { await api.report(target, reason, detail, jobId); setDone(true) })
  return (
    <Dialog label={t('reportTitle', { name })} onClose={onClose}>
      <h2 style={{ fontSize: 20 }}>{t('reportTitle', { name })}</h2>
      {done
        ? <><div className="notice ok">{t('reportDone')}</div><Btn block onClick={onClose}>{t('done')}</Btn></>
        : (
          <>
            <Fld label={t('reportReason')} htmlFor="rep-reason">
              <select id="rep-reason" className="inp" value={reason} onChange={(e) => setReason(e.target.value as ReportReason)}>
                {REPORT_REASONS.map((r) => <option key={r} value={r}>{t(`rr_${r}` as TKey)}</option>)}
              </select>
            </Fld>
            <Fld label={t('reportDetail')} htmlFor="rep-detail"><textarea id="rep-detail" className="inp" value={detail} onChange={(e) => setDetail(e.target.value)} maxLength={500} /></Fld>
            {error != null && <ErrorBox error={error} where="ReportDialog" />}
            <Btn block onClick={send} disabled={busy != null}>{busy ? '…' : t('reportSend')}</Btn>
            <div className="muted small">{t('reportNote')}</div>
          </>
        )}
    </Dialog>
  )
}
