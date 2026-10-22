import type { MyApplication } from './types'

/** One finished shift I was paid (or will be paid) for. Built from my applications — no extra database call. */
export interface Earning {
  id: string
  title: string
  business: string
  /** when the shop confirmed the shift (the day it counts for) */
  at: string
  gross: number
  fee: number
  net: number
  /** off = the shop pays cash directly and the amount is an estimate (listed rate × 8 h/day); test/live = money went through the app */
  mode: 'direct' | 'test' | 'live'
  /** only for money that went through the app: waiting to be transferred, or transferred */
  payout: 'pending' | 'paid' | null
  reference: string | null
}

export interface Statement { month: string; label: string; total: number; shifts: Earning[] }

export interface EarningsSummary {
  rows: Earning[]
  /** money that reached the app but is not transferred to me yet (always 0 while payments are off) */
  balance: number
  thisMonth: number
  total: number
  count: number
  months: Statement[]
  /** every row is a cash estimate (nothing went through the app) */
  estimated: boolean
}

const monthKey = (iso: string) => iso.slice(0, 7)

export function summarize(list: MyApplication[] | null, now = new Date()): EarningsSummary {
  const rows: Earning[] = (list ?? [])
    .filter((a) => a.status === 'accepted' && a.pay_status === 'released' && a.escrow_amount != null)
    .map((a) => {
      const gross = Number(a.escrow_amount), fee = Number(a.platform_fee ?? 0)
      const mode = a.funding_mode === 'live' ? 'live' : a.funding_mode === 'test' ? 'test' : 'direct'
      return {
        id: a.id, title: a.job.title, business: a.job.business_name ?? '—',
        at: a.job.end_date, gross, fee, net: gross - fee, mode,
        payout: mode === 'direct' ? null : a.payout?.status ?? 'pending', reference: a.payout?.reference ?? null,
      } satisfies Earning
    })
    .sort((x, y) => y.at.localeCompare(x.at))
  const here = monthKey(now.toISOString())
  const byMonth = new Map<string, Earning[]>()
  for (const r of rows) byMonth.set(monthKey(r.at), [...(byMonth.get(monthKey(r.at)) ?? []), r])
  return {
    rows,
    balance: rows.filter((r) => r.payout === 'pending').reduce((s, r) => s + r.net, 0),
    thisMonth: (byMonth.get(here) ?? []).reduce((s, r) => s + r.net, 0),
    total: rows.reduce((s, r) => s + r.net, 0),
    count: rows.length,
    months: [...byMonth.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([month, shifts]) => ({
      month, label: `${month.slice(5)}/${month.slice(0, 4)}`, total: shifts.reduce((s, r) => s + r.net, 0), shifts,
    })),
    estimated: rows.length > 0 && rows.every((r) => r.mode === 'direct'),
  }
}

/** Where a shift stands for the "shifts" tab. */
export type ShiftWhen = 'today' | 'soon' | 'done'
export interface Shift { app: MyApplication; when: ShiftWhen }

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Accepted shifts split into today / coming up / done (paid, settled, or past with nobody confirming yet). */
export function shiftsOf(list: MyApplication[] | null, now = new Date()): Shift[] {
  const today = ymd(now)
  return (list ?? [])
    .filter((a) => a.status === 'accepted')
    .map((a): Shift => {
      const settled = ['released', 'refunded', 'noshow_reported', 'disputed'].includes(a.pay_status)
      const when: ShiftWhen = settled || a.job.end_date < today ? 'done' : a.job.start_date > today ? 'soon' : 'today'
      return { app: a, when }
    })
    .sort((x, y) => (x.when === 'done' ? y.app.job.end_date.localeCompare(x.app.job.end_date) : x.app.job.start_date.localeCompare(y.app.job.start_date)))
}
