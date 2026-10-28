import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChatDialog } from '../collab/ChatDialog'
import { Ic } from '../../components/Ic'
import { ReportDialog } from '../collab/ReportDialog'
import { ShiftTabs } from './ShiftTabs'
import { Btn, Empty, ErrorBox, Skel, Tag } from '../../components/ui'
import { api } from '../../lib/api'
import { dateRange, money, vnClock, vnDate, vnToday } from '../../lib/format'
import { getPosition } from '../../lib/position'
import { shiftsOf, type Shift, type ShiftWhen } from '../../lib/earnings'
import { useI18n, type TKey } from '../../lib/i18n'
import { displayPhone, telHref } from '../../lib/phone'
import { useMine } from '../../lib/useMine'
import { useSession } from '../../lib/session'

const TITLES: Record<ShiftWhen, TKey> = { today: 'shiftsToday', soon: 'shiftsSoon', done: 'shiftsDone' }

function ShiftCard({ s, onChanged }: { s: Shift; onChanged(): void }) {
  const { t, locale } = useI18n()
  const nav = useNavigate()
  const { job, employer_phone: phone } = s.app
  const a = s.app
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<unknown>(null)
  const [dlg, setDlg] = useState<null | 'chat' | 'report'>(null)
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true); setErr(null)
    try { await fn(); onChanged() } catch (e) { setErr(e) } finally { setBusy(false) }
  }
  // "I'm here" / "I'm done" (today only, until the shop confirms the shift); the phone's location is a bonus, never required
  const inToday = !!a.checked_in_at && vnDate(a.checked_in_at) === vnToday()
  const outToday = inToday && !!a.checked_out_at && a.checked_out_at >= a.checked_in_at!
  const doIn = () => run(async () => { const pos = await getPosition(); await api.checkIn(a.id, pos?.lat, pos?.lng) })
  const paid = s.app.pay_status === 'released' && s.app.escrow_amount != null
  const status: [string, '' | 'ok' | 'p' | 'sun' | 'urgent'] =
    s.app.pay_status === 'released' ? [t('shiftPaid'), 'ok']
    : s.app.pay_status === 'noshow_reported' || s.app.pay_status === 'disputed' ? [t('shiftDispute'), 'urgent']
    : s.when === 'done' ? [t('shiftWaiting'), 'p']
    : s.when === 'today' ? [t('shiftOnToday'), 'sun']
    : [t('shiftConfirmed'), 'ok']
  return (
    <article className="card shiftcard">
      <div className="hrow"><h3 onClick={() => nav(`/app/viec/${job.id}`)}>{job.title}</h3><Tag tone={status[1]}>{status[0]}</Tag></div>
      <div className="shiftmeta">
        <span><Ic n="store" size={15} /> {job.business_name}</span>
        <span><Ic n="calendar" size={15} /> {dateRange(job.start_date, job.end_date)}{job.shift_note ? ` · ${job.shift_note}` : ''}</span>
        <span><Ic n="pin" size={15} /> {job.address}</span>
      </div>
      {s.when === 'today' && ['none', 'held'].includes(a.pay_status) && (
        <div className="attend">
          {!inToday
            ? <Btn sm onClick={doIn} disabled={busy}>{busy ? t('checkingIn') : t('checkIn')}</Btn>
            : (
              <>
                <span className="arrived"><Ic n="clock" size={15} /> {a.checkin_distance_m != null ? t('arrivedAtFar', { time: vnClock(a.checked_in_at!), m: a.checkin_distance_m }) : t('arrivedAt', { time: vnClock(a.checked_in_at!) })}</span>
                {outToday
                  ? <Tag tone="ok">{t('leftAt', { time: vnClock(a.checked_out_at!) })}</Tag>
                  : <Btn sm v="ghost" onClick={() => run(() => api.checkOut(a.id))} disabled={busy}>{t('checkOut')}</Btn>}
              </>
            )}
          <span className="muted small">{t('attendNote')}</span>
        </div>
      )}
      {paid && (a.funding_mode ?? 'off') === 'off' && (
        <div className="attend">
          {a.cash_received_at
            ? <Tag tone="ok">{t('cashReceivedTag')}</Tag>
            : (
              <>
                <span className="muted small">{t(a.paid_cash_at ? 'cashShopPaid' : 'cashWaitShop')}</span>
                <Btn sm onClick={() => run(() => api.ackCashReceived(a.id))} disabled={busy}>{t('ackCash')}</Btn>
              </>
            )}
        </div>
      )}
      {err != null && <ErrorBox error={err} where="Shifts.action" />}
      <div className="acts">
        <Btn v="ghost" sm onClick={() => setDlg('chat')}><Ic n="message" size={16} /> {t('chat')}</Btn>
        <Btn v="text" sm onClick={() => setDlg('report')}>{t('report')}</Btn>
      </div>
      {dlg === 'chat' && <ChatDialog applicationId={a.id} name={job.business_name ?? '—'} onClose={() => setDlg(null)} />}
      {dlg === 'report' && <ReportDialog target={job.employer_id} name={job.business_name ?? '—'} jobId={job.id} onClose={() => setDlg(null)} />}
      <div className="shiftfoot">
        {paid
          ? <b className="pay">{money(Number(s.app.escrow_amount) - Number(s.app.platform_fee ?? 0), locale)}</b>
          : phone ? <a className="btn btn-ghost sm" href={telHref(phone)}><Ic n="phone" size={16} /> {displayPhone(phone)}</a> : <span className="muted small">{t('shiftNoPhone')}</span>}
      </div>
    </article>
  )
}

/** "Chấm công": the shifts I was accepted for — today, coming up, done. (No clock-in button: the shop confirms the shift.) */
export default function Shifts() {
  const { t } = useI18n()
  const nav = useNavigate()
  const { profile, ready, askAuth } = useSession()
  const { list, error, reload } = useMine()
  if (!ready) return <div className="pg"><Skel n={2} /></div>
  if (!profile) {
    return (
      <div className="page-scroll"><div className="pg">
        <h1 className="ptitle">{t('navShifts')}</h1>
        <Empty pose="wave" title={t('loginToSee')}><Btn onClick={() => askAuth({ role: 'seeker' })}>{t('login')}</Btn></Empty>
      </div></div>
    )
  }
  const shifts = shiftsOf(list)
  return (
    <div className="page-scroll"><div className="pg wide shiftspg">
      <h1 className="ptitle">{t('navShifts')}</h1>
      <ShiftTabs />
      {error != null && <ErrorBox error={error} where="Shifts.load" onRetry={reload} />}
      {!list && !error && <Skel n={2} />}
      {list && shifts.length === 0 && <Empty pose="empty" title={t('noShifts')} sub={t('noShiftsSub')}><Btn onClick={() => nav('/app')}>{t('findJobs')}</Btn></Empty>}
      {(['today', 'soon', 'done'] as ShiftWhen[]).map((w) => {
        const rows = shifts.filter((s) => s.when === w)
        return rows.length === 0 ? null : (
          <section key={w} className="stack">
            <h2 className="sechead">{t(TITLES[w])} <span className="count">{rows.length}</span></h2>
            <div className="g2">{rows.map((s) => <ShiftCard key={s.app.id} s={s} onChanged={reload} />)}</div>
          </section>
        )
      })}
    </div></div>
  )
}
