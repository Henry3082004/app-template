import { type Api, type AdminDispute, type AdminFlag, type AdminPayout, type AdminSamples, type AdminStats, type AdminDeletion, type AdminReport, type AdminHeldJob, type AdminKpis } from '../types'
import { rpc, num } from './core'

export const adminApi: Pick<Api, 'adminReports' | 'resolveReport' | 'adminDeletions' | 'resolveDeletion' | 'adminDisputes' | 'resolveDispute' | 'adminPayouts' | 'markPayoutPaid' | 'adminFlags' | 'adminStats' | 'adminSamples' | 'adminHeldJobs' | 'adminReviewJob' | 'adminKpis'> = {
  async adminReports() {
    // "lost property" travels as reason 'other' with a [lost_property] prefix (the database list of reasons stays as it was)
    return (((await rpc('admin_reports')) ?? []) as AdminReport[]).map((r) => r.reason === 'other' && r.detail?.startsWith('[lost_property]')
      ? { ...r, reason: 'lost_property' as const, detail: r.detail.slice('[lost_property]'.length).trim() || null } : r)
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

  async adminHeldJobs() {
    return ((await rpc('admin_held_jobs')) ?? []) as AdminHeldJob[]
  },
  async adminReviewJob(jobId, ok, note) {
    await rpc('admin_review_job', { p_job: jobId, p_ok: ok, p_note: note ?? null })
  },

  async adminKpis() {
    const k = (await rpc('admin_kpis')) as AdminKpis
    return { ...k, avg_reply_hours_30d: k.avg_reply_hours_30d == null ? null : Number(k.avg_reply_hours_30d) }
  },

  async adminSamples() {
    return (await rpc('admin_samples')) as AdminSamples
  }
}
