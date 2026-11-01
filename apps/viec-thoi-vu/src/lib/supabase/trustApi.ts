import type { Api, TrustSignals } from '../types'
import { rpc } from './core'

/** Keeping one's word: confirming arrival, backups, cancelling a hire, "not paid" reports, and the summary shown on the cards. */
export const trustApi: Pick<Api, 'confirmAttendance' | 'setBackup' | 'cancelHire' | 'reportUnpaid' | 'trustSignals' | 'myApplyLock'> = {
  async confirmAttendance(applicationId) {
    await rpc('confirm_attendance', { p_application: applicationId })
  },
  async setBackup(applicationId, on) {
    await rpc('set_backup', { p_application: applicationId, p_on: on })
  },
  async cancelHire(applicationId) {
    await rpc('cancel_hire', { p_application: applicationId })
  },
  async reportUnpaid(applicationId) {
    await rpc('report_unpaid', { p_application: applicationId })
  },
  async trustSignals(userIds) {
    if (!userIds.length) return {}
    const rows = ((await rpc('trust_signals', { p_users: userIds })) ?? []) as TrustSignals[]
    return Object.fromEntries(rows.map((r) => [r.user_id, { ...r, reply_hours: r.reply_hours == null ? null : Number(r.reply_hours) }]))
  },
  async myApplyLock() {
    return ((await rpc('my_apply_lock')) as string | null) ?? null
  },
}
