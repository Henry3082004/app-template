import { useNavigate } from 'react-router-dom'
import { Ic } from '../components/Ic'
import { ShiftTabs } from '../components/ShiftTabs'
import { Btn, Empty, ErrorBox, Skel, Tag } from '../components/ui'
import { dateRange, money } from '../lib/format'
import { shiftsOf, type Shift, type ShiftWhen } from '../lib/earnings'
import { useI18n, type TKey } from '../lib/i18n'
import { displayPhone, telHref } from '../lib/phone'
import { useMine } from '../lib/useMine'
import { useSession } from '../lib/session'

const TITLES: Record<ShiftWhen, TKey> = { today: 'shiftsToday', soon: 'shiftsSoon', done: 'shiftsDone' }

function ShiftCard({ s }: { s: Shift }) {
  const { t, locale } = useI18n()
  const nav = useNavigate()
  const { job, employer_phone: phone } = s.app
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
      {list && shifts.length === 0 && <Empty pose="empty" title={t('noShifts')} sub={t('noShiftsSub')}><Btn onClick={() => nav('/app/viec-lam')}>{t('findJobs')}</Btn></Empty>}
      {(['today', 'soon', 'done'] as ShiftWhen[]).map((w) => {
        const rows = shifts.filter((s) => s.when === w)
        return rows.length === 0 ? null : (
          <section key={w} className="stack">
            <h2 className="sechead">{t(TITLES[w])} <span className="count">{rows.length}</span></h2>
            <div className="g2">{rows.map((s) => <ShiftCard key={s.app.id} s={s} />)}</div>
          </section>
        )
      })}
    </div></div>
  )
}
