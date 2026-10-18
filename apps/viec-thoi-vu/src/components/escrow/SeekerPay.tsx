import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { money } from '../../lib/format'
import { useI18n } from '../../lib/i18n'
import { useAppConfig } from '../../lib/config'
import { Btn, ErrorBox } from '../ui'
import type { BankAccount, MyApplication } from '../../lib/types'
import { net, type Dlg } from './shared'
import { DisputeDialog } from './dialogs'
import { ReviewDialog, ReviewPrompt } from './reviews'

/** Worker's side of an accepted application. */
export function SeekerPay({ app, onChanged }: { app: MyApplication; onChanged(): void }) {
  const { t, locale } = useI18n()
  const [dlg, setDlg] = useState<Dlg>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const close = () => setDlg(null)
  const done = () => { close(); onChanged() }
  const s = app.pay_status
  const testy = app.funding_mode === 'test'
  const cfg = useAppConfig()
  const free = app.funding_mode === 'off' || (s === 'none' && cfg?.payment_mode === 'off')
  const [bank, setBank] = useState<BankAccount | null | undefined>(undefined)
  useEffect(() => {
    if (s === 'released' && app.payout?.status !== 'paid') api.myBank().then(setBank).catch(() => undefined)
  }, [s, app.payout?.status])
  const answer = async (accept: boolean) => {
    setBusy(true); setError(null)
    try { await api.respondNoshow(app.id, accept); onChanged() } catch (e) { setError(e) } finally { setBusy(false) }
  }
  if (!cfg && s === 'none') return null
  if (free) {
    return (
      <div className="escrow">
        {s === 'none' && <div className="small muted">{t('freeSeekerHint')}</div>}
        {s === 'noshow_reported' && (
          <>
            <div className="notice warn">{t('noshowAsk')}</div>
            <div className="acts">
              <Btn v="ghost" disabled={busy} onClick={() => answer(true)}>{t('noshowYes')}</Btn>
              <Btn disabled={busy} onClick={() => answer(false)}>{t('noshowNo')}</Btn>
            </div>
          </>
        )}
        {s === 'released' && (
          <>
            <div className="notice ok">{t('releasedSeekerFree')}</div>
            <ReviewPrompt app={app} onReview={() => setDlg('review')} />
          </>
        )}
        {s === 'refunded' && <div className="notice info">{t('noshowRecordedSeeker')}</div>}
        {s === 'disputed' && <div className="notice warn">{t('disputedFree')}</div>}
        {error != null && <ErrorBox error={error} where="SeekerPay" />}
        {dlg === 'review' && <ReviewDialog appId={app.id} as="seeker" onClose={close} onDone={done} />}
      </div>
    )
  }
  return (
    <div className="escrow">
      {s === 'none' && <div className="notice info">{t('fundWaiting')}</div>}
      {s === 'held' && (
        <>
          <div className="notice ok">{t('heldSeeker', { amount: money(net(app), locale) })}</div>
          <div><Btn v="text" sm onClick={() => setDlg('dispute')}>{t('disputeCta')}</Btn></div>
        </>
      )}
      {s === 'noshow_reported' && (
        <>
          <div className="notice warn">{t('noshowAsk')}</div>
          <div className="acts">
            <Btn v="ghost" disabled={busy} onClick={() => answer(true)}>{t('noshowYes')}</Btn>
            <Btn disabled={busy} onClick={() => answer(false)}>{t('noshowNo')}</Btn>
          </div>
        </>
      )}
      {s === 'released' && (
        <>
          <div className="notice ok">{t('releasedSeeker', { amount: money(net(app), locale) })}</div>
          {app.payout?.status === 'paid'
            ? <div className="notice ok">{t('payoutDone')}{app.payout.reference ? ` (${app.payout.reference})` : ''}</div>
            : <div className="notice info">{t('payoutWaiting')}</div>}
          {app.payout?.status !== 'paid' && bank === null && <div className="notice warn">{t('bankMissing')} <Link to="/app/tai-khoan" className="bold">{t('fillBank')}</Link></div>}
          <ReviewPrompt app={app} onReview={() => setDlg('review')} />
        </>
      )}
      {s === 'refunded' && <div className="notice info">{t('refundedNote')}</div>}
      {s === 'disputed' && <div className="notice warn">{t('disputedNote')}</div>}
      {testy && ['held', 'released'].includes(s) && <div className="small muted">{t('testMode')}</div>}
      {error != null && <ErrorBox error={error} where="SeekerPay" />}
      {dlg === 'dispute' && <DisputeDialog appId={app.id} onClose={close} onDone={done} />}
      {dlg === 'review' && <ReviewDialog appId={app.id} as="seeker" onClose={close} onDone={done} />}
    </div>
  )
}
