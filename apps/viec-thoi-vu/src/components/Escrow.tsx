import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { today } from '../lib/format'
import { money } from '../lib/format'
import { useI18n, type TKey } from '../lib/i18n'
import { repLevel } from '../lib/reputation'
import type { Applicant, Attendance, BankAccount, Escrow, Job, MyApplication, Quote, ReceivedReview, Reputation, Role } from '../lib/types'
import { Ic } from './Ic'
import { Btn, Dialog, ErrorBox, Fld } from './ui'

const net = (e: Escrow) => (e.escrow_amount ?? 0) - (e.platform_fee ?? 0)
type JobTerms = Pick<Job, 'pay_unit' | 'start_date' | 'end_date'>

/** Reputation summary: level chip + the plain numbers behind it. */
export function Rep({ rep, employer }: { rep?: Reputation; employer?: boolean }) {
  const { t } = useI18n()
  const lvl = repLevel(rep)
  const cls = { new: 'tag p', good: 'tag ok', ok: 'tag', warn: 'tag warn' }[lvl]
  const label = { new: t('repNew'), good: t('repGood'), ok: t('repOk'), warn: t('repWarn') }[lvl]
  const none = !rep || rep.shifts_done === 0
  return (
    <div className="rep">
      <span className={cls}>{label}</span>
      {rep && rep.ratings > 0 && rep.avg_stars != null && <span className="stars-n"><Ic n="star" size={14} /> <b>{rep.avg_stars.toFixed(1)}</b> <span className="muted">({t('repRatings', { n: rep.ratings })})</span></span>}
      <span className="muted">{none ? (employer ? t('repEmployerNew') : t('repNoShifts')) : t('repShifts', { n: rep!.shifts_done })}</span>
      {!employer && rep && rep.noshow > 0 && <span className="warnt">{t('repNoshow', { n: rep.noshow })}</span>}
      {!employer && rep && rep.late > 0 && <span className="muted">{t('repLate', { n: rep.late })}</span>}
    </div>
  )
}

function TestNote() {
  const { t } = useI18n()
  return <div className="notice info"><b>{t('testMode')}</b><br />{t('testModeSub')}</div>
}

export function FundDialog({ app, job, onClose, onDone }: { app: Applicant; job: JobTerms; onClose(): void; onDone(): void }) {
  const { t, locale } = useI18n()
  const days = Math.max(Math.round((Date.parse(job.end_date) - Date.parse(job.start_date)) / 864e5) + 1, 1)
  const [hours, setHours] = useState(String(8 * days))
  const [q, setQ] = useState<Quote | null>(null)
  const [test, setTest] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const h = job.pay_unit === 'hour' ? Number(hours) : undefined

  useEffect(() => { api.paymentMode().then((m) => setTest(m === 'test')).catch(() => undefined) }, [])
  useEffect(() => {
    if (h !== undefined && !(h >= 1)) { setQ(null); return }
    let live = true
    api.quote(app.id, h).then((x) => { if (live) { setQ(x); setError(null) } }).catch((e) => { if (live) { setQ(null); setError(e) } })
    return () => { live = false }
  }, [app.id, h])

  const go = async () => {
    setBusy(true); setError(null)
    try { await api.fund(app.id, h); onDone() } catch (e) { setError(e); setBusy(false) }
  }
  const pct = q && q.amount ? Math.round((q.fee / q.amount) * 100) : 0
  return (
    <Dialog label={t('fundTitle')} onClose={onClose}>
      <div className="stack">
        <h2>{t('fundTitle')}</h2>
        <div className="sub">{t('fundHint')}</div>
        {test && <TestNote />}
        {job.pay_unit === 'hour' && (
          <Fld label={t('fundHours')} htmlFor="fh"><input id="fh" className="inp" type="number" inputMode="numeric" min={1} value={hours} onChange={(e) => setHours(e.target.value)} /></Fld>
        )}
        {q && (
          <div className="sumrows">
            <div><span>{t('fundAmount')}</span><b>{money(q.amount, locale)}</b></div>
            <div className="muted"><span>{t('fundFee', { pct })}</span><span>−{money(q.fee, locale)}</span></div>
            <div><span>{t('fundNet')}</span><b>{money(q.net, locale)}</b></div>
          </div>
        )}
        {error != null && <ErrorBox error={error} where="FundDialog" />}
        <Btn block onClick={go} disabled={busy || !q}>{busy ? '…' : t('fundConfirm')}</Btn>
        <Btn v="text" onClick={onClose}>{t('cancel')}</Btn>
      </div>
    </Dialog>
  )
}

function CompleteDialog({ app, onClose, onDone }: { app: Applicant; onClose(): void; onDone(): void }) {
  const { t } = useI18n()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const pick = async (a: Attendance) => {
    setBusy(true); setError(null)
    try { await api.completeShift(app.id, a); onDone() } catch (e) { setError(e); setBusy(false) }
  }
  const opts: [Attendance, TKey, TKey][] = [['ok', 'attOk', 'attOkSub'], ['late', 'attLate', 'attLateSub'], ['noshow', 'attNoshow', 'attNoshowSub']]
  return (
    <Dialog label={t('completeTitle')} onClose={onClose}>
      <div className="stack">
        <h2>{t('completeTitle')}</h2>
        <div className="opts">
          {opts.map(([k, l, s]) => (
            <button key={k} type="button" className={'opt ' + k} disabled={busy} onClick={() => pick(k)}><b>{t(l)}</b><span>{t(s)}</span></button>
          ))}
        </div>
        {error != null && <ErrorBox error={error} where="CompleteDialog" />}
        <Btn v="text" onClick={onClose}>{t('cancel')}</Btn>
      </div>
    </Dialog>
  )
}

function DisputeDialog({ appId, onClose, onDone }: { appId: string; onClose(): void; onDone(): void }) {
  const { t } = useI18n()
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const send = async () => {
    setBusy(true); setError(null)
    try { await api.openDispute(appId, reason); onDone() } catch (e) { setError(e); setBusy(false) }
  }
  return (
    <Dialog label={t('disputeTitle')} onClose={onClose}>
      <div className="stack">
        <h2>{t('disputeTitle')}</h2>
        <div className="sub">{t('disputeHint')}</div>
        <textarea className="inp" maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('disputePh')} aria-label={t('disputePh')} />
        {error != null && <ErrorBox error={error} where="DisputeDialog" />}
        <Btn block onClick={send} disabled={busy || reason.trim().length < 3}>{busy ? '…' : t('disputeSend')}</Btn>
        <Btn v="text" onClick={onClose}>{t('cancel')}</Btn>
      </div>
    </Dialog>
  )
}

const TAGS: Record<Role, string[]> = {
  employer: ['hardworking', 'punctual', 'polite', 'fast_learner'],
  seeker: ['accurate_description', 'friendly', 'clean_safe', 'clear_instructions'],
}

/** `as` = the role of the person writing the review. */
export function ReviewDialog({ appId, as, onClose, onDone }: { appId: string; as: Role; onClose(): void; onDone(): void }) {
  const { t } = useI18n()
  const [stars, setStars] = useState(0)
  const [tags, setTags] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const title = t(as === 'employer' ? 'reviewTitleEmp' : 'reviewTitleSeeker')
  const send = async () => {
    setBusy(true); setError(null)
    try { await api.submitReview(appId, stars, tags, comment); onDone() } catch (e) { setError(e); setBusy(false) }
  }
  return (
    <Dialog label={title} onClose={onClose}>
      <div className="stack">
        <h2>{title}</h2>
        <div className="starpick" role="radiogroup" aria-label={title}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={stars === n} aria-label={`${n}`} className={n <= stars ? 'on' : ''} onClick={() => setStars(n)}><Ic n="star" size={30} /></button>
          ))}
        </div>
        <div className="chiprow wrap">
          {TAGS[as].map((k) => {
            const on = tags.includes(k)
            return <button key={k} type="button" className={'chip' + (on ? ' on' : '')} aria-pressed={on} onClick={() => setTags(on ? tags.filter((x) => x !== k) : [...tags, k])}>{t(`tag_${k}` as TKey)}</button>
          })}
        </div>
        <textarea className="inp" maxLength={300} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t('reviewPh')} aria-label={t('reviewPh')} />
        <div className="small muted">{t('reviewHint')}</div>
        {error != null && <ErrorBox error={error} where="ReviewDialog" />}
        <Btn block onClick={send} disabled={busy || stars < 1}>{busy ? '…' : t('reviewSend')}</Btn>
        <Btn v="text" onClick={onClose}>{t('cancel')}</Btn>
      </div>
    </Dialog>
  )
}

type Dlg = null | 'fund' | 'complete' | 'dispute' | 'review'

/** Employer's side of an accepted applicant: deposit → confirm shift → review. */
export function EmployerPay({ app, job, onChanged }: { app: Applicant; job: JobTerms; onChanged(): void }) {
  const { t, locale } = useI18n()
  const [dlg, setDlg] = useState<Dlg>(null)
  const close = () => setDlg(null)
  const done = () => { close(); onChanged() }
  const early = today() < job.start_date
  const s = app.pay_status
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
          {app.reviewed ? <div className="small muted">{t('reviewedDone')}</div> : <Btn v="ghost" onClick={() => setDlg('review')}><Ic n="star" size={16} /> {t('reviewCta')}</Btn>}
        </>
      )}
      {s === 'refunded' && <div className="notice info">{t('refundedNote')}</div>}
      {s === 'disputed' && <div className="notice warn">{t('disputedNote')}</div>}
      {dlg === 'fund' && <FundDialog app={app} job={job} onClose={close} onDone={done} />}
      {dlg === 'complete' && <CompleteDialog app={app} onClose={close} onDone={done} />}
      {dlg === 'dispute' && <DisputeDialog appId={app.id} onClose={close} onDone={done} />}
      {dlg === 'review' && <ReviewDialog appId={app.id} as="employer" onClose={close} onDone={done} />}
    </div>
  )
}

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
  const [bank, setBank] = useState<BankAccount | null | undefined>(undefined)
  useEffect(() => {
    if (s === 'released' && app.payout?.status !== 'paid') api.myBank().then(setBank).catch(() => undefined)
  }, [s, app.payout?.status])
  const answer = async (accept: boolean) => {
    setBusy(true); setError(null)
    try { await api.respondNoshow(app.id, accept); onChanged() } catch (e) { setError(e) } finally { setBusy(false) }
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
          {app.reviewed ? <div className="small muted">{t('reviewedDone')}</div> : <Btn v="ghost" onClick={() => setDlg('review')}><Ic n="star" size={16} /> {t('reviewCta')}</Btn>}
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

/** Account page card: my own reputation + reviews others left about me. */
export function OwnReputation({ userId, employer }: { userId: string; employer: boolean }) {
  const { t, locale } = useI18n()
  const [rep, setRep] = useState<Reputation>()
  const [reviews, setReviews] = useState<ReceivedReview[]>([])
  useEffect(() => {
    api.reputations([userId]).then((m) => setRep(m[userId])).catch(() => undefined)
    api.receivedReviews().then(setReviews).catch(() => undefined)
  }, [userId])
  return (
    <div className="card stack">
      <b>{t('repTitle')}</b>
      <Rep rep={rep} employer={employer} />
      {rep && rep.top_tags.length > 0 && <div className="chiprow wrap">{rep.top_tags.map((k) => <span key={k} className="tag">{t(`tag_${k}` as TKey)}</span>)}</div>}
      <b style={{ fontSize: 15 }}>{t('myReviewsTitle')}</b>
      {reviews.length === 0 && <div className="sub" style={{ fontSize: 14 }}>{t('noReviewsYet')}</div>}
      {reviews.map((r) => (
        <div key={r.id} className="revitem">
          <div className="stars-n">{Array.from({ length: r.stars }, (_, i) => <Ic key={i} n="star" size={14} />)} <span className="muted small">{new Date(r.created_at).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-GB')}</span></div>
          {r.tags.length > 0 && <div className="chiprow wrap">{r.tags.map((k) => <span key={k} className="tag">{t(`tag_${k}` as TKey)}</span>)}</div>}
          {r.comment && <div>“{r.comment}”</div>}
        </div>
      ))}
    </div>
  )
}

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
