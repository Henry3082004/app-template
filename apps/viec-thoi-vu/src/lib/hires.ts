import { useCallback, useEffect, useState } from 'react'
import { api } from './api'
import { useSession } from './session'
import type { Hire } from './types'

/** Every application to my posts (shop side); null while loading. */
export function useHires() {
  const { profile } = useSession()
  const [list, setList] = useState<Hire[] | null>(null)
  const [error, setError] = useState<unknown>(null)
  const load = useCallback(() => {
    if (profile?.role !== 'employer') { setList(null); return }
    setError(null)
    api.sweep().catch(() => undefined).then(() => api.myHires()).then(setList).catch(setError)
  }, [profile?.id, profile?.role]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(load, [load])
  return { list, error, reload: load }
}

/** today / confirm = shift over but nobody confirmed it yet / soon / done */
export type HireWhen = 'confirm' | 'today' | 'soon' | 'done'
export interface HireShift { hire: Hire; when: HireWhen }

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const SETTLED = ['released', 'refunded', 'noshow_reported', 'disputed']

/** Accepted workers split by where their shift stands. */
export function hireShifts(list: Hire[] | null, now = new Date()): HireShift[] {
  const today = ymd(now)
  return (list ?? []).filter((h) => h.status === 'accepted').map((h): HireShift => {
    const when: HireWhen = SETTLED.includes(h.pay_status) ? 'done' : h.job.end_date < today ? 'confirm' : h.job.start_date > today ? 'soon' : 'today'
    return { hire: h, when }
  }).sort((x, y) => (x.when === 'done' ? y.hire.job.end_date.localeCompare(x.hire.job.end_date) : x.hire.job.start_date.localeCompare(y.hire.job.start_date)))
}

/** Shifts waiting for the shop: to confirm, or confirmed but the cash payment is not recorded. */
export const needsAction = (list: Hire[] | null) => hireShifts(list).filter((s) => s.when === 'confirm').length

export interface Spend {
  rows: Hire[]
  thisMonth: number
  total: number
  held: number
  shifts: number
  people: number
  unpaidCash: number
  months: { month: string; label: string; total: number; shifts: Hire[] }[]
  /** every row is a cash estimate (nothing went through the app) */
  estimated: boolean
}

const amount = (h: Hire) => Number(h.escrow_amount ?? 0)

export function spendOf(list: Hire[] | null, now = new Date()): Spend {
  const rows = (list ?? []).filter((h) => h.status === 'accepted' && h.pay_status === 'released' && h.escrow_amount != null)
    .sort((a, b) => b.job.end_date.localeCompare(a.job.end_date))
  const here = now.toISOString().slice(0, 7)
  const by = new Map<string, Hire[]>()
  for (const r of rows) by.set(r.job.end_date.slice(0, 7), [...(by.get(r.job.end_date.slice(0, 7)) ?? []), r])
  return {
    rows,
    thisMonth: (by.get(here) ?? []).reduce((s, r) => s + amount(r), 0),
    total: rows.reduce((s, r) => s + amount(r), 0),
    held: (list ?? []).filter((h) => h.pay_status === 'held').reduce((s, r) => s + amount(r), 0),
    shifts: rows.length,
    people: new Set(rows.map((r) => r.seeker_id)).size,
    unpaidCash: rows.filter((r) => r.funding_mode === 'off' && !r.paid_cash_at).length,
    months: [...by.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([month, shifts]) => ({
      month, label: `${month.slice(5)}/${month.slice(0, 4)}`, total: shifts.reduce((s, r) => s + amount(r), 0), shifts,
    })),
    estimated: rows.length > 0 && rows.every((r) => r.funding_mode === 'off'),
  }
}

export interface Regular { seeker_id: string; hire: Hire; shifts: number; name: string }

/** Workers who showed up (full shift or a little late) at least once, best-known first — the people worth inviting again. */
export function regularsOf(list: Hire[] | null): Regular[] {
  const by = new Map<string, Regular>()
  for (const h of list ?? []) {
    if (h.pay_status !== 'released' || h.attendance === 'noshow') continue
    const cur = by.get(h.seeker_id)
    if (cur) cur.shifts += 1
    else by.set(h.seeker_id, { seeker_id: h.seeker_id, hire: h, shifts: 1, name: h.full_name })
  }
  return [...by.values()].sort((a, b) => b.shifts - a.shifts)
}
