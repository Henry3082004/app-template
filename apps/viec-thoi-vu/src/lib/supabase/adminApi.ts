import { type Api, type AdminDispute, type AdminFlag, type AdminPayout, type AdminSamples, type AdminStats, type AdminDeletion, type AdminReport } from '../types'
import { rpc, num } from './core'

export const adminApi: Pick<Api, 'adminReports' | 'resolveReport' | 'adminDeletions' | 'resolveDeletion' | 'adminDisputes' | 'resolveDispute' | 'adminPayouts' | 'markPayoutPaid' | 'adminFlags' | 'adminStats' | 'adminSamples'> = {
  async adminReports() {
    return ((await rpc('admin_reports')) ?? []) as AdminReport[]
  },
  async resolveReport(id, note) {
    await rpc('resolve_report', { p_id: id, p_note: note })
  },
  async adminDeletions() {
    return ((await rpc('admin_deletions')) ?? []) as AdminDeletion[]
  },
  async resolveDeletion(id, note) {
    await rpc('resolve_deletion', { p_id: id, p_note: note })
  },
  async adminDisputes() {
    const data = await rpc('admin_disputes')
    return ((data ?? []) as AdminDispute[]).map((d) => ({ ...d, amount: num(d.amount), fee: num(d.fee) }))
  },

  async resolveDispute(applicationId, outcome, note) {
    await rpc('resolve_dispute', { p_application: applicationId, p_outcome: outcome, p_note: note })
  },

  async adminPayouts() {
    const data = await rpc('admin_payouts')
    return ((data ?? []) as AdminPayout[]).map((p) => ({ ...p, amount: Number(p.amount) }))
  },

  async markPayoutPaid(payoutId, reference) {
    await rpc('mark_payout_paid', { p_payout: payoutId, p_reference: reference })
  },

  async adminFlags() {
    const data = await rpc('admin_flags')
    return ((data ?? []) as AdminFlag[]).map((f) => ({ ...f, total: Number(f.total) }))
  },

  async adminStats() {
    return (await rpc('admin_stats')) as AdminStats
  },

  async adminSamples() {
    return (await rpc('admin_samples')) as AdminSamples
  }
}
