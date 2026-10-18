import { useState } from 'react'
import { money, today } from '../../lib/format'
import { useI18n } from '../../lib/i18n'
import { useAppConfig } from '../../lib/config'
import { Btn } from '../ui'
import type { Applicant } from '../../lib/types'
import { net, type JobTerms, type Dlg } from './shared'
import { FundDialog, CompleteDialog, DisputeDialog } from './dialogs'
import { ReviewDialog, ReviewPrompt } from './reviews'

/** Employer's side of an accepted applicant: deposit → confirm shift → review. */
export function EmployerPay({ app, job, onChanged }: { app: Applicant; job: JobTerms; onChanged(): void }) {
  const { t, locale } = useI18n()
  const [dlg, setDlg] = useState<Dlg>(null)
  const close = () => setDlg(null)
  const done = () => { close(); onChanged() }
  const early = today() < job.start_date
  const s = app.pay_status
  const cfg = useAppConfig()
  if (!cfg && s === 'none') return null
  const free = app.funding_mode === 'off' || (s === 'none' && cfg?.payment_mode === 'off')
  if (free) {
    return (
      <div className="escrow">
        {s === 'none' && (
          <>
            <div className="small muted">{t('freeConfirmHint')}</div>
            <Btn onClick={() => setDlg('complete')} disabled={early}>{t('completeCta')}</Btn>
            {early && <div className="small muted">{t('completeTooEarly')}</div>}
          </>
        )}
        {s === 'noshow_reported' && <div className="notice info">{t('noshowWaitingFree')}</div>}
        {s === 'released' && (
          <>
            <div className="notice ok">{t('releasedFree')}</div>
            <ReviewPrompt app={app} onReview={() => setDlg('review')} />
          </>
        )}
        {s === 'refunded' && <div className="notice info">{t('noshowRecorded')}</div>}
        {s === 'disputed' && <div className="notice warn">{t('disputedFree')}</div>}
        {dlg === 'complete' && <CompleteDialog app={app} free onClose={close} onDone={(a) => { onChanged(); setDlg(a === 'noshow' ? null : 'review') }} />}
        {dlg === 'review' && <ReviewDialog appId={app.id} as="employer" onClose={close} onDone={done} />}
      </div>
    )
  }
  return (
    <div className="escrow">
      {s === 'none' && (
        <>
          <div className="notice warn">{t('fundWaitingEmp')}</div>
          <Btn block onClick={() => setDlg('fund')}>{t('fundCta')}</Btn>
        </>
      )}
      {s === 'held' && (
        <>
          <div className="notice ok">{t('heldEmp', { amount: money(app.escrow_amount ?? 0, locale) })}</div>
          <div className="acts">
            <Btn onClick={() => setDlg('complete')} disabled={early}>{t('completeCta')}</Btn>
            <Btn v="text" onClick={() => setDlg('dispute')}>{t('disputeCta')}</Btn>
          </div>
          {early && <div className="small muted">{t('completeTooEarly')}</div>}
        </>
      )}
      {s === 'noshow_reported' && <div className="notice info">{t('noshowWaiting')}</div>}
      {s === 'released' && (
        <>
          <div className="notice ok">{t('releasedEmp', { amount: money(net(app), locale) })}</div>
          <ReviewPrompt app={app} onReview={() => setDlg('review')} />
        </>
      )}
      {s === 'refunded' && <div className="notice info">{t('refundedNote')}</div>}
      {s === 'disputed' && <div className="notice warn">{t('disputedNote')}</div>}
      {dlg === 'fund' && <FundDialog app={app} job={job} onClose={close} onDone={done} />}
      {dlg === 'complete' && <CompleteDialog app={app} onClose={close} onDone={(a) => { onChanged(); setDlg(a === 'noshow' ? null : 'review') }} />}
      {dlg === 'dispute' && <DisputeDialog appId={app.id} onClose={close} onDone={done} />}
      {dlg === 'review' && <ReviewDialog appId={app.id} as="employer" onClose={close} onDone={done} />}
    </div>
  )
}
