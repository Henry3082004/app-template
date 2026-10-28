import { useState } from 'react'
import { Btn, ErrorBox, Tag } from '../../../components/ui'
import { api } from '../../../lib/api'
import { useI18n, type TKey } from '../../../lib/i18n'
import type { AdminReport } from '../../../lib/types'

export function ReportCard({ r, onDone }: { r: AdminReport; onDone(): void }) {
  const { t } = useI18n()
  const [note, setNote] = useState('')
  const [err, setErr] = useState<unknown>(null)
  const resolve = async () => { try { await api.resolveReport(r.id, note); onDone() } catch (e) { setErr(e) } }
  return (
    <article className="card stack">
      <div className="hrow"><Tag tone={r.status === 'open' ? 'urgent' : 'ok'}>{t(`rr_${r.reason}` as TKey)}</Tag>{r.status === 'resolved' && <Tag tone="ok">{t('adminHandled')}</Tag>}</div>
      <div className="adminrows">
        <div><span>{t('adminReporter')}</span><b>{r.reporter_name}</b></div>
        <div><span>{t('adminTarget')}</span><b>{r.target_name}</b></div>
        {r.job_title && <div><span>{t('adminPost')}</span><b>{r.job_title}</b></div>}
      </div>
      {r.detail && <div className="sub" style={{ fontSize: 14 }}>“{r.detail}”</div>}
      {r.note && <div className="muted small">{r.note}</div>}
      {r.status === 'open' && (
        <>
          <input className="inp" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('adminNoteOpt')} aria-label={t('adminNoteOpt')} maxLength={300} />
          <Btn sm onClick={resolve}>{t('adminResolve')}</Btn>
        </>
      )}
      {err != null && <ErrorBox error={err} where="Admin.report" />}
    </article>
  )
}
