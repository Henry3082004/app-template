import { AppError, type Api, type TrustSignals } from '../types'
import { addDays, today } from '../format'
import { apps, freeSlot, holds, jobs, jobOf, me, myApp, notify, now, reviews, revealed, users, wait, bizOf, personOf } from './core'

const DAY = 864e5
/** Confirmed no-shows of a worker (the shop reported it and it was accepted or went unanswered), newest last. */
const noshows = (uid: string) => apps.filter((a) => a.seeker_id === uid && a.attendance === 'noshow' && a.pay_status === 'refunded').map((a) => a.completed_at ?? Date.now())
export const applyLockOf = (uid: string): string | null => {
  const recent = noshows(uid).filter((t) => Date.now() - t < 30 * DAY)
  const until = Math.max(recent.length >= 2 ? Math.max(...recent) + 7 * DAY : 0, holds[uid] ?? 0)
  return until > Date.now() ? new Date(until).toISOString() : null
}

export const trustMock: Pick<Api, 'confirmAttendance' | 'setBackup' | 'cancelHire' | 'reportUnpaid' | 'trustSignals' | 'myApplyLock' | 'markAsPosted' | 'workerNotes'> = {
  async confirmAttendance(id) {
    const a = myApp(id, 'seeker')
    if (a.status !== 'accepted') throw new AppError('NOT_ACCEPTED')
    if (!['none', 'held'].includes(a.pay_status)) throw new AppError('ALREADY_SETTLED')
    const j = jobOf(a)
    if (today() < addDays(j.start_date, -1)) throw new AppError('TOO_EARLY')
    if (today() > j.end_date) throw new AppError('JOB_ENDED')
    if (a.confirmed_at) return wait(undefined)
    a.confirmed_at = now()
    notify(j.employer_id, 'attend_confirmed', `${personOf(a.seeker_id)} xác nhận vẫn đến`, `"${j.title}"`, '/app/ca-lam')
    return wait(undefined)
  },

  async setBackup(id, on) {
    const a = myApp(id, 'employer')
    if (a.status !== 'pending') throw new AppError('ALREADY_DECIDED')
    const j = jobOf(a)
    if (on && !a.is_backup) {
      if (apps.filter((x) => x.job_id === a.job_id && x.is_backup && x.status === 'pending').length >= j.slots) throw new AppError('TOO_MANY_BACKUPS')
      notify(a.seeker_id, 'backup', 'Bạn đang trong danh sách dự bị', `${bizOf(j)} giữ bạn dự bị cho "${j.title}" — sẽ báo ngay nếu cần bạn`, '/app/da-ung-tuyen')
    }
    a.is_backup = on
    return wait(undefined)
  },

  async cancelHire(id) {
    const a = myApp(id, 'employer')
    const j = jobOf(a)
    if (a.status !== 'accepted') throw new AppError('NOT_ACCEPTED')
    if (a.pay_status !== 'none') throw new AppError('ALREADY_FUNDED')
    if (a.checked_in_at) throw new AppError('ALREADY_STARTED')
    a.status = 'rejected'; a.cancelled_at = now(); a.cancel_late = today() >= j.start_date
    freeSlot(a)
    const n = jobs.filter((x) => x.status === 'open' && x.id !== j.id && x.end_date >= today() && x.city === j.city).length
    notify(a.seeker_id, 'hire_cancelled', `${bizOf(j)} đã hủy ca của bạn`, `Việc "${j.title}"${n > 0 ? ` — còn ${n} việc khác đang mở, xem ngay` : ''}`, '/app')
    return wait(undefined)
  },

  // (the database makes the worker wait a day after the shift is confirmed; the mock lets the tests press it at once)
  async reportUnpaid(id) {
    const a = myApp(id, 'seeker')
    if (a.status !== 'accepted' || a.pay_status !== 'released') throw new AppError('NOT_COMPLETED')
    if ((a.funding_mode ?? 'off') !== 'off') throw new AppError('NOT_CASH')
    if (a.cash_received_at) throw new AppError('ALREADY_PAID')
    if (a.unpaid_reported_at) return wait(undefined)
    a.unpaid_reported_at = now()
    const j = jobOf(a)
    notify(j.employer_id, 'unpaid_reported', `${personOf(a.seeker_id)} báo chưa nhận được tiền`, `"${j.title}" — kiểm tra và trả cho người làm`, '/app/chi-phi')
    return wait(undefined)
  },

  async trustSignals(ids) {
    const out: Record<string, TrustSignals> = {}
    ids.forEach((id) => {
      const mine = apps.filter((a) => jobOf(a).employer_id === id)
      const ns = noshows(id)
      out[id] = {
        user_id: id,
        noshow_30d: ns.filter((t) => Date.now() - t < 30 * DAY).length, noshow_total: ns.length, apply_locked_until: applyLockOf(id),
        unpaid: mine.filter((a) => a.unpaid_reported_at && !a.cash_received_at).length,
        cancels: mine.filter((a) => a.cancelled_at).length, late_cancels: mine.filter((a) => a.cancel_late).length,
        hires: mine.filter((a) => a.status === 'accepted' || a.cancelled_at).length,
        reply_hours: null, mismatch: mine.filter((a) => a.as_posted === false).length,
        phone_verified: users[id]?.profile.auth_provider === 'zalo',
      }
    })
    return wait(out)
  },

  async markAsPosted(id, ok) {
    const a = myApp(id, 'seeker')
    if (a.pay_status !== 'released') throw new AppError('NOT_COMPLETED')
    a.as_posted = ok
    const j = jobOf(a)
    if (!ok && apps.filter((x) => x.job_id === a.job_id && x.as_posted === false).length >= 2 && !j.held_reason) {
      j.held_reason = 'Nhiều người báo không đúng như tin đăng'; j.status = 'closed'
    }
    return wait(undefined)
  },

  async workerNotes(ids) {
    me()
    const out: Record<string, import('../types').WorkerNote[]> = {}
    ids.forEach((id) => {
      const list = reviews.filter((r) => r.reviewee_id === id && r.reviewer_role === 'employer' && r.comment?.trim() && revealed(r.application_id))
        .sort((x, y) => y.created_at.localeCompare(x.created_at)).slice(0, 2)
        .map((r) => ({ user_id: id, stars: r.stars, comment: r.comment!, shop_name: bizOf({ employer_id: r.reviewer_id } as import('../types').Job), created_at: r.created_at }))
      if (list.length) out[id] = list
    })
    return wait(out)
  },

  async myApplyLock() { return wait(applyLockOf(me().id)) },
}
