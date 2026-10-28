import { AppError, type Api, type FoundWorker, type ReportReason, type Job } from '../types'
import { vnDate, vnToday } from '../format'
import { now, nid, notes, notify, chat, reports, deletions, invites, discoverable, users, jobs, apps, current, wait, me, jobOf, bizOf, personOf, myApp } from './core'
import { payMock } from './payMock'

export const collabMock: Pick<Api, 'messages' | 'sendMessage' | 'report' | 'myDeletionRequest' | 'requestDeletion' | 'cancelDeletion' | 'inviteWorker' | 'searchWorkers' | 'myDiscoverable' | 'setDiscoverable' | 'mySentInvites' | 'markPaidCash' | 'notifications' | 'unreadCount' | 'markNotificationsRead' | 'checkIn' | 'checkOut' | 'ackCashReceived'> = {
  async messages(id) {
    const a = apps.find((x) => x.id === id)
    const p = me()
    if (!a || a.status !== 'accepted' || (a.seeker_id !== p.id && jobOf(a).employer_id !== p.id)) throw new AppError('FORBIDDEN')
    return wait(chat.filter((m) => m.application_id === id).map(({ application_id: _a, ...m }) => m).reverse())
  },
  async sendMessage(id, body) {
    const a = apps.find((x) => x.id === id)
    const p = me()
    if (!a || a.status !== 'accepted' || (a.seeker_id !== p.id && jobOf(a).employer_id !== p.id)) throw new AppError('FORBIDDEN')
    const b = body.trim()
    if (b.length < 1 || b.length > 1000) throw new AppError('BAD_MESSAGE')
    if (chat.filter((m) => m.application_id === id && m.sender_id === p.id && Date.now() - Date.parse(m.created_at) < 36e5).length >= 30) throw new AppError('TOO_MANY')
    chat.push({ id: nid(), application_id: id, sender_id: p.id, body: b, created_at: now() })
    const j = jobOf(a)
    const toSeeker = p.id === j.employer_id
    const other = toSeeker ? a.seeker_id : j.employer_id
    if (!notes.some((n) => n.user_id === other && n.kind === 'message' && n.ref === id && !n.read_at)) {
      notify(other, 'message', `${toSeeker ? bizOf(j) : personOf(p.id)} nhắn tin cho bạn`, b.slice(0, 120), toSeeker ? '/app/cham-cong' : '/app/ca-lam', id)
    }
    return wait(undefined)
  },
  async report(target, reason: ReportReason, detail, jobId) {
    const p = me()
    if (target === p.id) throw new AppError('FORBIDDEN')
    if (!['scam', 'fee', 'no_show', 'harassment', 'fake_info', 'other'].includes(reason)) throw new AppError('BAD_REASON')
    const dealt = apps.some((a) => (a.seeker_id === p.id && jobOf(a).employer_id === target) || (a.seeker_id === target && jobOf(a).employer_id === p.id))
    const viaJob = !!jobId && jobs.some((j) => j.id === jobId && j.employer_id === target)
    if (!dealt && !viaJob) throw new AppError('FORBIDDEN')
    if (reports.filter((r) => r.reporter_id === p.id && Date.now() - Date.parse(r.created_at) < 864e5).length >= 5) throw new AppError('TOO_MANY')
    reports.push({ id: nid(), reporter_id: p.id, reporter_name: p.business_name || p.full_name, target_id: target, target_name: bizOf({ employer_id: target } as Job) === 'Quán' ? personOf(target) : bizOf({ employer_id: target } as Job),
      reason, detail: (detail ?? '').trim().slice(0, 500) || null, job_title: jobs.find((j) => j.id === jobId)?.title ?? null, status: 'open', note: null, created_at: now() })
    return wait(undefined)
  },
  async myDeletionRequest() {
    const p = me()
    const d = deletions.find((x) => x.user_id === p.id && x.status === 'open')
    return wait(d ? { status: 'open' as const, requested_at: d.requested_at } : null)
  },
  async requestDeletion(reason) {
    const p = me()
    if (!deletions.some((x) => x.user_id === p.id && x.status === 'open')) {
      deletions.push({ id: nid(), user_id: p.id, name: p.business_name || p.full_name, email: null, reason: (reason ?? '').trim().slice(0, 300) || null, status: 'open', requested_at: now() })
    }
    return wait(undefined)
  },
  async cancelDeletion() {
    const p = me()
    deletions.filter((x) => x.user_id === p.id && x.status === 'open').forEach((x) => { x.status = 'cancelled' })
    return wait(undefined)
  },
  async inviteWorker(jobId, workerId) {
    const p = me()
    const j = jobs.find((x) => x.id === jobId)
    if (!j || j.employer_id !== p.id) throw new AppError('FORBIDDEN')
    if (j.status !== 'open') throw new AppError('JOB_NOT_OPEN')
    const regular = apps.some((a) => jobOf(a).employer_id === p.id && a.seeker_id === workerId && a.pay_status === 'released' && a.attendance !== 'noshow')
    if (!regular && !discoverable.has(workerId)) throw new AppError('NOT_A_REGULAR')
    if (apps.some((a) => a.job_id === jobId && a.seeker_id === workerId)) throw new AppError('ALREADY_APPLIED')
    if (invites.filter((i) => i.employer_id === p.id).length >= 20) throw new AppError('TOO_MANY')
    if (!invites.some((i) => i.job_id === jobId && i.worker_id === workerId)) {
      invites.push({ job_id: jobId, worker_id: workerId, employer_id: p.id })
      notify(workerId, 'invite', `${bizOf(j)} mời bạn làm${regular ? ' lại' : ''}`, `Việc "${j.title}" — xem và ứng tuyển`, `/app/viec/${jobId}`, jobId)
    }
    return wait(undefined)
  },
  async searchWorkers(f) {
    const p = me()
    if (!p.roles.includes('employer')) throw new AppError('FORBIDDEN')
    const found = Object.values(users).map((u) => u.profile)
      .filter((w) => w.roles.includes('seeker') && w.id !== p.id && discoverable.has(w.id)
        && (!f.city || w.city === f.city) && (!f.exp || (w.experience as string[]).includes(f.exp)) && (!f.when || (w.availability as string[]).includes(f.when)))
    const reps = await payMock.reputations(found.map((w) => w.id), 'seeker')
    return wait(found.map((w): FoundWorker => {
      const parts = w.full_name.trim().split(/\s+/)
      return {
        user_id: w.id, name: parts.length > 1 ? `${parts[parts.length - 1]} ${parts[0][0].toUpperCase()}.` : parts[0],
        city: w.city, birth_year: w.birth_year, experience: w.experience, availability: w.availability, avatar_path: w.avatar_path,
        shifts_done: reps[w.id]?.shifts_done ?? 0, avg_stars: reps[w.id]?.avg_stars ?? null, ratings: reps[w.id]?.ratings ?? 0,
      }
    }).sort((a, b) => b.shifts_done - a.shifts_done))
  },
  async myDiscoverable() { return wait(discoverable.has(me().id)) },
  async setDiscoverable(on) {
    const p = me()
    if (!p.roles.includes('seeker')) throw new AppError('FORBIDDEN')
    if (on) discoverable.add(p.id); else discoverable.delete(p.id)
    return wait(undefined)
  },
  async mySentInvites() {
    const p = me()
    return wait(invites.filter((i) => i.employer_id === p.id).map(({ employer_id: _e, ...i }) => i))
  },

  async markPaidCash(id) {
    const a = myApp(id, 'employer')
    if (a.pay_status !== 'released' || (a.funding_mode ?? 'off') !== 'off') throw new AppError('ALREADY_SETTLED')
    if (!a.paid_cash_at) notify(a.seeker_id, 'cash_paid', `${bizOf(jobOf(a))} đã ghi trả tiền mặt`, `Ca "${jobOf(a).title}" — bấm xác nhận nếu bạn đã nhận`, '/app/thu-nhap')
    a.paid_cash_at = a.paid_cash_at ?? now()
    return wait(undefined)
  },

  async notifications() {
    const p = me()
    return wait(notes.filter((n) => n.user_id === p.id).map(({ user_id: _u, ...n }) => n))
  },
  async unreadCount() {
    if (!current) return wait(0)
    return wait(notes.filter((n) => n.user_id === current && !n.read_at).length)
  },
  async markNotificationsRead(ids) {
    const p = me()
    notes.filter((n) => n.user_id === p.id && !n.read_at && (!ids || ids.includes(n.id))).forEach((n) => { n.read_at = now() })
    return wait(undefined)
  },
  async checkIn(id, lat, lng) {
    const a = myApp(id, 'seeker')
    const j = jobOf(a)
    if (a.status !== 'accepted') throw new AppError('NOT_ACCEPTED')
    if (!['none', 'held'].includes(a.pay_status)) throw new AppError('ALREADY_SETTLED')
    if (vnToday() < j.start_date) throw new AppError('TOO_EARLY')
    if (vnToday() > j.end_date) throw new AppError('JOB_ENDED')
    if (a.checked_in_at && vnDate(a.checked_in_at) === vnToday()) throw new AppError('ALREADY_CHECKED_IN')
    if ((lat == null) !== (lng == null) || (lat != null && (Math.abs(lat) > 90 || Math.abs(lng!) > 180))) throw new AppError('BAD_LOCATION')
    let d: number | null = null
    if (lat != null && lng != null && j.lat != null && j.lng != null) {
      const r = Math.PI / 180
      d = Math.round(2 * 6371000 * Math.asin(Math.sqrt(Math.sin(((j.lat - lat) * r) / 2) ** 2 + Math.cos(lat * r) * Math.cos(j.lat * r) * Math.sin(((j.lng - lng) * r) / 2) ** 2)))
    }
    Object.assign(a, { checked_in_at: now(), checkin_distance_m: d, checked_out_at: null })
    notify(j.employer_id, 'checked_in', `${personOf(a.seeker_id)} đã đến`, `"${j.title}"`, '/app/ca-lam')
    return wait(undefined)
  },
  async checkOut(id) {
    const a = myApp(id, 'seeker')
    if (a.status !== 'accepted') throw new AppError('NOT_ACCEPTED')
    if (!a.checked_in_at || vnDate(a.checked_in_at) !== vnToday()) throw new AppError('NOT_CHECKED_IN')
    if (a.checked_out_at && a.checked_out_at >= a.checked_in_at) throw new AppError('ALREADY_CHECKED_OUT')
    a.checked_out_at = now()
    return wait(undefined)
  },
  async ackCashReceived(id) {
    const a = myApp(id, 'seeker')
    if (a.status !== 'accepted' || a.pay_status !== 'released') throw new AppError('NOT_COMPLETED')
    if ((a.funding_mode ?? 'off') !== 'off') throw new AppError('NOT_CASH')
    if (!a.cash_received_at) {
      a.cash_received_at = now()
      notify(jobOf(a).employer_id, 'cash_received', 'Người làm xác nhận đã nhận tiền', `${personOf(a.seeker_id)} · "${jobOf(a).title}"`, '/app/chi-phi')
    }
    return wait(undefined)
  }
}
