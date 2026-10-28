import { Navigate, useNavigate } from 'react-router-dom'
import { Ic } from '../components/Ic'
import { EmployerPay } from '../components/escrow'
import { Avatar, Btn, Empty, ErrorBox, Skel, Tag } from '../components/ui'
import { dateRange, vnClock } from '../lib/format'
import { hireShifts, useHires, type HireShift, type HireWhen } from '../lib/hires'
import { useI18n, type TKey } from '../lib/i18n'
import { displayPhone, telHref, zaloHref } from '../lib/phone'
import { useSession } from '../lib/session'
import { avatarUrl } from '../lib/worker'

const TITLES: Record<HireWhen, TKey> = { confirm: 'hireShiftsConfirm', today: 'shiftsToday', soon: 'shiftsSoon', done: 'shiftsDone' }

function Card({ s, onChanged }: { s: HireShift; onChanged(): void }) {
  const { t } = useI18n()
  const h = s.hire
  const nav = useNavigate()
  return (
    <article className="card shiftcard">
      <div className="row">
        <Avatar name={h.full_name} src={avatarUrl(h.avatar_path)} size={48} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <b>{h.full_name}</b>
          <div className="sub" style={{ fontSize: 14, cursor: 'pointer' }} onClick={() => nav(`/app/tin/${h.job.id}`)}>{h.job.title}</div>
        </div>
        {s.when === 'confirm' && <Tag tone="urgent">{t('hireShiftsConfirm')}</Tag>}
        {s.when === 'today' && <Tag tone="sun">{t('shiftOnToday')}</Tag>}
      </div>
      <div className="shiftmeta">
        <span><Ic n="calendar" size={15} /> {dateRange(h.job.start_date, h.job.end_date)}{h.job.shift_note ? ` · ${h.job.shift_note}` : ''}</span>
        {h.phone && <span><Ic n="phone" size={15} /> {displayPhone(h.phone)}</span>}
        {h.checked_in_at
          ? (
            <span>
              <Ic n="clock" size={15} /> {h.checkin_distance_m != null ? t('workerArrivedFar', { name: h.full_name, time: vnClock(h.checked_in_at), m: h.checkin_distance_m }) : t('workerArrived', { name: h.full_name, time: vnClock(h.checked_in_at) })}
              {h.checked_out_at && h.checked_out_at >= h.checked_in_at ? ` · ${t('workerLeft', { time: vnClock(h.checked_out_at) })}` : ''}
            </span>
          )
          : s.when === 'today' && <span className="muted"><Ic n="clock" size={15} /> {t('workerNotArrived')}</span>}
      </div>
      {h.phone && s.when !== 'done' && (
        <div className="acts">
          <a className="btn btn-primary sm" href={telHref(h.phone)}><Ic n="phone" size={16} /> {t('call')}</a>
          <a className="btn btn-ghost sm" href={zaloHref(h.phone)} target="_blank" rel="noreferrer"><Ic n="message" size={16} /> {t('zalo')}</a>
        </div>
      )}
      <EmployerPay app={h} job={h.job} onChanged={onChanged} />
      {h.cash_received_at && <Tag tone="ok">{t('cashAckByWorker')}</Tag>}
    </article>
  )
}

/** "Ca làm": the people I hired — who works today, whose shift I still have to confirm, who is done. */
export default function EmployerShifts() {
  const { t } = useI18n()
  const nav = useNavigate()
  const { profile, ready } = useSession()
  const { list, error, reload } = useHires()
  if (!ready) return <div className="pg"><Skel n={2} /></div>
  if (profile?.role !== 'employer') return <Navigate to="/app" replace />
  const shifts = hireShifts(list)
  return (
    <div className="page-scroll"><div className="pg wide shiftspg">
      <h1 className="ptitle">{t('navEmpShifts')}</h1>
      {error != null && <ErrorBox error={error} where="EmployerShifts.load" onRetry={reload} />}
      {!list && !error && <Skel n={2} />}
      {list && shifts.length === 0 && <Empty pose="empty" title={t('empNoShifts')} sub={t('empNoShiftsSub')}><Btn onClick={() => nav('/app/ung-vien')}>{t('hireCandTab')}</Btn></Empty>}
      {(['confirm', 'today', 'soon', 'done'] as HireWhen[]).map((w) => {
        const rows = shifts.filter((s) => s.when === w)
        return rows.length === 0 ? null : (
          <section key={w} className="stack">
            <h2 className="sechead">{t(TITLES[w])} <span className="count">{rows.length}</span></h2>
            <div className="g2">{rows.map((s) => <Card key={s.hire.id} s={s} onChanged={reload} />)}</div>
          </section>
        )
      })}
    </div></div>
  )
}
