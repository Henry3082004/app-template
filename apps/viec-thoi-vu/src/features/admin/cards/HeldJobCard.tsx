import { useState } from 'react'
import { Btn, ErrorBox, Tag } from '../../../components/ui'
import { api } from '../../../lib/api'
import { useI18n } from '../../../lib/i18n'
import type { AdminHeldJob } from '../../../lib/types'

/** A post held back (a suspicious phrase, or workers said it was not as posted): approve it or refuse it with a reason. */
export function HeldJobCard({ j, onDone }: { j: AdminHeldJob; onDone(): void }) {
  const { t } = useI18n()
  const [note, setNote] = useState('')
  const [err, setErr] = useState<unknown>(null)
  const review = async (ok: boolean) => { try { await api.adminReviewJob(j.id, ok, note); onDone() } catch (e) { setErr(e) } }
  return (
    <article className="card stack">
      <div className="hrow"><b>{j.title}</b><Tag tone="urgent">{t('jobHeldTag')}</Tag></div>
      <div className="adminrows">
        <div><span>{t('adminTarget')}</span><b>{j.business}</b></div>
        <div><span>{t('reportReason')}</span><b>{j.held_reason}</b></div>
      </div>
      <input className="inp" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('adminNoteOpt')} aria-label={t('adminNoteOpt')} maxLength={200} />
      <div className="acts">
        <Btn v="ghost" sm onClick={() => review(false)}>{t('adminRejectJob')}</Btn>
        <Btn sm onClick={() => review(true)}>{t('adminApprove')}</Btn>
      </div>
      {err != null && <ErrorBox error={err} where="Admin.heldJob" />}
    </article>
  )
}
