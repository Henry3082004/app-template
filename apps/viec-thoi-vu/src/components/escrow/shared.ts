import type { Escrow, Job } from '../../lib/types'

export const net = (e: Escrow) => (e.escrow_amount ?? 0) - (e.platform_fee ?? 0)
export type JobTerms = Pick<Job, 'pay_unit' | 'start_date' | 'end_date'>
export type Dlg = null | 'fund' | 'complete' | 'dispute' | 'review'
