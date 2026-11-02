import { AppError, type Api, type FeePlan, type FeeRow } from '../types'
import { admin, apps, jobOf, me, users, wait } from './core'

/** The plan (same defaults as the database) and the fee of each finished shift, fixed the first time it is seen. */
const plan: FeePlan = { fee: 12000, voucher_pct: 100, voucher_name: 'Ưu đãi ra mắt' }
const ledger: Record<string, FeeRow & { employer_id: string }> = {}
const sync = () => {
  apps.filter((a) => a.pay_status === 'released' && !ledger[a.id]).forEach((a) => {
    const j = jobOf(a)
    const discount = Math.floor((plan.fee * plan.voucher_pct) / 100)
    ledger[a.id] = {
      application_id: a.id, employer_id: j.employer_id, fee: plan.fee, discount, due: plan.fee - discount,
      voucher: plan.voucher_pct > 0 ? plan.voucher_name : null, created_at: new Date().toISOString(), title: j.title, worker: users[a.seeker_id]?.profile.full_name ?? '',
    }
  })
  return Object.values(ledger)
}
const month = (rows: FeeRow[]) => rows.filter((r) => r.created_at.slice(0, 7) === new Date().toISOString().slice(0, 7))
const sum = (rows: FeeRow[], k: 'fee' | 'discount' | 'due') => rows.reduce((n, r) => n + r[k], 0)

export const feesMock: Pick<Api, 'feePlan' | 'myFees' | 'adminFees' | 'adminSetFee'> = {
  async feePlan() { return wait({ ...plan }) },
  async myFees() {
    const uid = me().id
    const rows = sync().filter((r) => r.employer_id === uid).sort((a, b) => b.created_at.localeCompare(a.created_at))
    const m = month(rows)
    return wait({ rows, month_fee: sum(m, 'fee'), month_discount: sum(m, 'discount'), month_due: sum(m, 'due'), total_due: sum(rows, 'due') })
  },
  async adminFees() {
    admin()
    const m = month(sync())
    return wait({ ...plan, month_shifts: m.length, month_fee: sum(m, 'fee'), month_discount: sum(m, 'discount'), month_due: sum(m, 'due') })
  },
  async adminSetFee(fee, pct, name) {
    admin()
    if (!Number.isInteger(fee) || fee < 0 || fee > 1_000_000) throw new AppError('BAD_FEE')
    if (!Number.isInteger(pct) || pct < 0 || pct > 100) throw new AppError('BAD_PCT')
    sync() // shifts already finished keep the old plan
    Object.assign(plan, { fee, voucher_pct: pct, voucher_name: name.trim().slice(0, 60) || null })
    return wait(undefined)
  },
}
