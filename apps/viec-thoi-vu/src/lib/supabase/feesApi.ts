import type { AdminFees, Api, FeePlan, MyFees } from '../types'
import { rpc } from './core'

/** Service fee per finished shift and the voucher. Nothing is charged: the database only keeps a ledger. */
export const feesApi: Pick<Api, 'feePlan' | 'myFees' | 'adminFees' | 'adminSetFee'> = {
  async feePlan() {
    return (await rpc('fee_plan')) as unknown as FeePlan
  },
  async myFees() {
    return (await rpc('my_fees')) as unknown as MyFees
  },
  async adminFees() {
    return (await rpc('admin_fees')) as unknown as AdminFees
  },
  async adminSetFee(fee, voucherPct, voucherName) {
    await rpc('admin_set_fee', { p_fee: fee, p_pct: voucherPct, p_name: voucherName })
  },
}
