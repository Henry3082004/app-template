import { type Api, type AppNotification, type ChatMessage, type FoundWorker, type DeletionRequest, type ReportReason, type SentInvite } from '../types'
import { rpc, num } from './core'

export const collabApi: Pick<Api, 'notifications' | 'unreadCount' | 'markNotificationsRead' | 'checkIn' | 'checkOut' | 'ackCashReceived' | 'messages' | 'sendMessage' | 'report' | 'myDeletionRequest' | 'requestDeletion' | 'cancelDeletion' | 'inviteWorker' | 'mySentInvites' | 'searchWorkers' | 'myDiscoverable' | 'setDiscoverable' | 'markPaidCash'> = {
  async notifications() {
    return ((await rpc('my_notifications', { p_limit: 40 })) ?? []) as AppNotification[]
  },

  async unreadCount() {
    return Number(await rpc('unread_notifications')) || 0
  },

  async markNotificationsRead(ids) {
    await rpc('mark_notifications_read', { p_ids: ids ?? null })
  },

  async checkIn(applicationId, lat, lng) {
    await rpc('check_in', { p_application: applicationId, p_lat: lat ?? null, p_lng: lng ?? null })
  },

  async checkOut(applicationId) {
    await rpc('check_out', { p_application: applicationId })
  },

  async ackCashReceived(applicationId) {
    await rpc('ack_cash_received', { p_application: applicationId })
  },

  async messages(applicationId) {
    return ((await rpc('app_messages', { p_application: applicationId })) ?? []) as ChatMessage[]
  },
  async sendMessage(applicationId, body) {
    await rpc('send_message', { p_application: applicationId, p_body: body })
  },
  async report(target, reason: ReportReason, detail, jobId) {
    await rpc('report_user', { p_target: target, p_reason: reason, p_detail: detail ?? null, p_job: jobId ?? null })
  },
  async myDeletionRequest() {
    const rows = ((await rpc('my_deletion_request')) ?? []) as DeletionRequest[]
    return rows[0] ?? null
  },
  async requestDeletion(reason) {
    await rpc('request_account_deletion', { p_reason: reason ?? null })
  },
  async cancelDeletion() {
    await rpc('cancel_account_deletion')
  },
  async inviteWorker(jobId, workerId) {
    await rpc('invite_worker', { p_job: jobId, p_worker: workerId })
  },
  async mySentInvites() {
    return ((await rpc('my_sent_invites')) ?? []) as SentInvite[]
  },
  async searchWorkers(f) {
    const data = await rpc('search_workers', { p_city: f.city || null, p_exp: f.exp || null, p_when: f.when || null, p_limit: 30 })
    return ((data ?? []) as FoundWorker[]).map((w) => ({ ...w, avg_stars: num(w.avg_stars) }))
  },
  async myDiscoverable() {
    return (await rpc('my_discoverable')) === true
  },
  async setDiscoverable(on) {
    await rpc('set_discoverable', { p_on: on })
  },

  async markPaidCash(applicationId) {
    await rpc('mark_paid_cash', { p_application: applicationId })
  }
}
