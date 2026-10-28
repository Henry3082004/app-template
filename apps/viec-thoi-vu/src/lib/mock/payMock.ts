import { AppError, type Api, type Reputation, type Role } from '../types'
import { today } from '../format'
import { REP_MIN, CFG, SEEKER_TAGS, EMPLOYER_TAGS, now, nid, notify, apps, reviews, banks, current, wait, me, jobOf, revealed, quoteOf, release, freeSlot, sweepFor, myApp } from './core'
import type { App, Rev } from './core'

export const payMock: Pick<Api, 'quote' | 'fund' | 'completeShift' | 'respondNoshow' | 'openDispute' | 'submitReview' | 'reputations' | 'receivedReviews' | 'myBank' | 'saveBank' | 'pendingReviews' | 'sweep'> = {
  async quote(id, hours) {
    const p = me()
    const a = apps.find((x) => x.id === id)
    if (!a) throw new AppError('NOT_FOUND')
    if (p.id !== a.seeker_id && p.id !== jobOf(a).employer_id) throw new AppError('FORBIDDEN')
    return wait(quoteOf(a, hours))
  },
  async fund(id, hours) {
    if (CFG.payment_mode !== 'test') throw new AppError('PAYMENT_NOT_AVAILABLE')
    const a = myApp(id, 'employer')
    if (a.status !== 'accepted') throw new AppError('NOT_ACCEPTED')
    if (a.pay_status !== 'none') throw new AppError('ALREADY_FUNDED')
    if (jobOf(a).end_date < today()) throw new AppError('JOB_ENDED')
    const q = quoteOf(a, hours)
    Object.assign(a, { pay_status: 'held', escrow_amount: q.amount, platform_fee: q.fee, funding_mode: 'test' })
    return wait(undefined)
  },
  async completeShift(id, attendance) {
    const a = myApp(id, 'employer')
    if (!['ok', 'late', 'noshow'].includes(attendance)) throw new AppError('BAD_ATTENDANCE')
    if (a.status !== 'accepted') throw new AppError('NOT_ACCEPTED')
    if (a.pay_status === 'none') {
      if (CFG.payment_mode !== 'off') throw new AppError('NOT_FUNDED')
      Object.assign(a, { escrow_amount: quoteOf(a).amount, platform_fee: 0, funding_mode: 'off' })
    } else if (a.pay_status !== 'held') throw new AppError('ALREADY_SETTLED')
    if (today() < jobOf(a).start_date) throw new AppError('TOO_EARLY')
    a.attendance = attendance
    a.completed_at = Date.now()
    if (attendance === 'noshow') { a.pay_status = 'noshow_reported'; notify(a.seeker_id, 'noshow', 'Quán báo bạn vắng ca', `Việc "${jobOf(a).title}" — xem và phản hồi nếu không đúng`, '/app/cham-cong') }
    else release(a)
    return wait(undefined)
  },
  async respondNoshow(id, accept) {
    const a = myApp(id, 'seeker')
    if (a.pay_status !== 'noshow_reported') throw new AppError('ALREADY_SETTLED')
    if (accept) { a.pay_status = 'refunded'; freeSlot(a) } else a.pay_status = 'disputed'
    return wait(undefined)
  },
  async openDispute(id) {
    const p = me()
    const a = apps.find((x) => x.id === id)
    if (!a) throw new AppError('NOT_FOUND')
    if (p.id !== a.seeker_id && p.id !== jobOf(a).employer_id) throw new AppError('FORBIDDEN')
    if (a.pay_status !== 'held') throw new AppError('CANNOT_DISPUTE')
    a.pay_status = 'disputed'
    return wait(undefined)
  },
  async submitReview(id, stars, tags, comment) {
    const p = me()
    const a = apps.find((x) => x.id === id)
    if (!a) throw new AppError('NOT_FOUND')
    const j = jobOf(a)
    if (p.id !== a.seeker_id && p.id !== j.employer_id) throw new AppError('FORBIDDEN')
    if (a.pay_status !== 'released') throw new AppError('NOT_COMPLETED')
    if (!(stars >= 1 && stars <= 5)) throw new AppError('BAD_STARS')
    const side: Role = p.id === j.employer_id ? 'employer' : 'seeker' // from the shift, not the role in use
    const allowed = side === 'employer' ? EMPLOYER_TAGS : SEEKER_TAGS
    if (!tags.every((t) => allowed.includes(t))) throw new AppError('BAD_TAGS')
    if (reviews.some((r) => r.application_id === id && r.reviewer_id === p.id)) throw new AppError('ALREADY_REVIEWED')
    reviews.push({ id: nid(), application_id: id, reviewer_id: p.id, reviewee_id: side === 'employer' ? a.seeker_id : j.employer_id, reviewer_role: side, stars, tags, comment: comment.trim().slice(0, 300) || null, created_at: now() })
    return wait(undefined)
  },
  async reputations(ids, as) {
    // Same rules as the database: shifts >= REP_MIN count, one (latest) review per reviewer→reviewee pair,
    // only on the asked side (as a worker or as a business).
    const out: Record<string, Reputation> = {}
    const q = apps.filter((a) => (a.escrow_amount ?? 0) >= REP_MIN)
    const party = (a: App, u: string) => (as === 'seeker' ? a.seeker_id === u : jobOf(a).employer_id === u)
    ids.forEach((u) => {
      const done = q.filter((a) => a.pay_status === 'released' && party(a, u))
      const latest = new Map<string, Rev>()
      reviews.filter((r) => r.reviewee_id === u && r.reviewer_role !== as && revealed(r.application_id) && q.some((a) => a.id === r.application_id))
        .forEach((r) => { const k = r.reviewer_id; if (!latest.has(k) || latest.get(k)!.created_at <= r.created_at) latest.set(k, r) })
      const rs = [...latest.values()]
      const counts: Record<string, number> = {}
      rs.forEach((r) => r.tags.forEach((t) => { counts[t] = (counts[t] ?? 0) + 1 }))
      out[u] = {
        user_id: u,
        shifts_done: done.length,
        on_time: done.filter((a) => a.attendance !== 'late').length,
        partners: new Set(done.map((a) => (a.seeker_id === u ? jobOf(a).employer_id : a.seeker_id))).size,
        noshow: as === 'seeker' ? q.filter((a) => a.seeker_id === u && a.pay_status === 'refunded' && a.attendance === 'noshow').length : 0,
        late: as === 'seeker' ? done.filter((a) => a.attendance === 'late').length : 0,
        ratings: rs.length,
        avg_stars: rs.length ? Math.round((rs.reduce((n, r) => n + r.stars, 0) / rs.length) * 10) / 10 : null,
        top_tags: Object.entries(counts).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([t]) => t),
      }
    })
    return wait(out)
  },
  async receivedReviews() {
    const p = me()
    return wait(reviews.filter((r) => r.reviewee_id === p.id && revealed(r.application_id)).map(({ id, stars, tags, comment, created_at, reviewer_role }) => ({ id, stars, tags, comment, created_at, reviewer_role })))
  },
  async myBank() { return wait(banks[me().id] ?? null) },
  async saveBank(b) {
    const acct = b.account_no.replace(/\s/g, '')
    if (b.bank_name.trim().length < 2 || b.holder_name.trim().length < 2 || !/^[0-9]{6,20}$/.test(acct)) throw new AppError('BAD_BANK')
    banks[me().id] = { bank_name: b.bank_name.trim(), account_no: acct, holder_name: b.holder_name.trim().toUpperCase() }
    return wait(undefined)
  },
  async pendingReviews() {
    if (!current) return 0
    const me = current
    return wait(apps.filter((a) => a.pay_status === 'released' && (a.seeker_id === me || jobOf(a).employer_id === me) && !reviews.some((r) => r.application_id === a.id && r.reviewer_id === me)).length)
  },
  async sweep() { sweepFor(current); return wait(undefined) }
}
