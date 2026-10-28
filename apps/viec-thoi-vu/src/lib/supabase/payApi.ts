import { type Api, type BankAccount, type Reputation } from '../types'
import { sb, fail, rpc, num, uid } from './core'

export const payApi: Pick<Api, 'quote' | 'fund' | 'completeShift' | 'respondNoshow' | 'openDispute' | 'submitReview' | 'reputations' | 'receivedReviews' | 'myBank' | 'saveBank' | 'pendingReviews' | 'sweep'> = {
  async quote(applicationId, hours) {
    return (await rpc('quote_application', { p_application: applicationId, p_hours: hours ?? null })) as { amount: number; fee: number; net: number }
  },

  async fund(applicationId, hours) {
    await rpc('fund_application', { p_application: applicationId, p_hours: hours ?? null })
  },

  async completeShift(applicationId, attendance) {
    await rpc('complete_shift', { p_application: applicationId, p_attendance: attendance })
  },

  async respondNoshow(applicationId, accept) {
    await rpc('respond_noshow', { p_application: applicationId, p_accept: accept })
  },

  async openDispute(applicationId, reason) {
    await rpc('open_dispute', { p_application: applicationId, p_reason: reason })
  },

  async submitReview(applicationId, stars, tags, comment) {
    await rpc('submit_review', { p_application: applicationId, p_stars: stars, p_tags: tags, p_comment: comment })
  },

  async reputations(userIds, as) {
    const ids = [...new Set(userIds)].filter(Boolean)
    if (!ids.length) return {}
    const data = await rpc('role_reputations', { p_users: ids, p_as: as })
    return Object.fromEntries(((data ?? []) as Reputation[]).map((r) => [r.user_id, { ...r, avg_stars: num(r.avg_stars) }]))
  },

  async receivedReviews() {
    const id = await uid()
    const { data, error } = await sb.from('reviews').select('id, stars, tags, comment, created_at, reviewer_role')
      .eq('reviewee_id', id).order('created_at', { ascending: false }).limit(20)
    if (error) fail(error)
    return data ?? []
  },

  async myBank() {
    const id = await uid()
    const { data, error } = await sb.from('bank_accounts').select('bank_name, account_no, holder_name').eq('user_id', id).maybeSingle()
    if (error) fail(error)
    return data as BankAccount | null
  },

  async saveBank(b) {
    await rpc('save_bank_account', { p_bank: b.bank_name, p_account: b.account_no, p_holder: b.holder_name })
  },

  async pendingReviews() {
    const { data, error } = await sb.rpc('my_pending_reviews')
    if (error) return 0
    return Number(data ?? 0)
  },

  async sweep() {
    await sb.rpc('sweep_overdue')
  }
}
