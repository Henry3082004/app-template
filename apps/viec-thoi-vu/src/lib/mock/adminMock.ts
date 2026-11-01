import { AppError, type Api, type AdminDispute, type AdminFlag, type AdminPayout, type AdminSamples, type AdminStats } from '../types'
import { holds, notify, now, reports, deletions, users, jobs, apps, reviews, payouts, banks, resolutions, wait, jobOf, release, admin, freeSlot } from './core'

export const adminMock: Pick<Api, 'adminReports' | 'resolveReport' | 'adminDeletions' | 'resolveDeletion' | 'adminDisputes' | 'resolveDispute' | 'adminPayouts' | 'markPayoutPaid' | 'adminFlags' | 'adminSamples' | 'adminStats' | 'adminHeldJobs' | 'adminReviewJob' | 'adminKpis'> = {
  async adminKpis() {
    admin()
    const shifts = apps.filter((a) => a.pay_status === 'released').length
    const bad = apps.filter((a) => a.attendance === 'noshow' && a.pay_status === 'refunded').length
    const owners = jobs.map((j) => j.employer_id)
    const shops = [...new Set(owners)]
    return wait({
      jobs_30d: jobs.length, jobs_with_applicant_24h: jobs.filter((j) => apps.some((a) => a.job_id === j.id)).length,
      shops_60d: shops.length, shops_repeat_60d: shops.filter((s) => owners.filter((o) => o === s).length >= 2).length,
      weekly_shifts: Array.from({ length: 8 }, (_, i) => ({ week: new Date(Date.now() - (7 - i) * 7 * 864e5).toISOString().slice(0, 10), shifts: i === 7 ? shifts : 0 })),
      noshow_30d: bad, finished_30d: shifts + bad, avg_reply_hours_30d: null,
      held_jobs: jobs.filter((j) => j.held_reason && !j.held_reason.startsWith('REJECTED')).length, referrals_30d: 0, open_reports: reports.filter((r) => r.status === 'open').length,
    })
  },
  async adminHeldJobs() {
    admin()
    return wait(jobs.filter((j) => j.held_reason && !j.held_reason.startsWith('REJECTED')).map((j) => ({ id: j.id, title: j.title, business: j.business_name ?? '—', held_reason: j.held_reason!, created_at: j.created_at })))
  },
  async adminReviewJob(id, ok, note) {
    admin()
    const j = jobs.find((x) => x.id === id)
    if (!j || !j.held_reason) throw new AppError('NOT_FOUND')
    if (ok) { j.held_reason = null; j.status = j.filled < j.slots ? 'open' : 'closed'; notify(j.employer_id, 'job_approved', 'Tin đã được duyệt', `"${j.title}" đã hiển thị cho người tìm việc`, '/app/viec-cua-toi') }
    else { j.held_reason = 'REJECTED' + (note?.trim() ? `: ${note.trim().slice(0, 200)}` : ''); j.status = 'closed'; notify(j.employer_id, 'job_rejected', 'Tin không được duyệt', `"${j.title}"`, '/app/viec-cua-toi') }
    return wait(undefined)
  },
  async adminReports() {
    admin()
    return wait(reports.map(({ reporter_id: _r, ...r }) => r).sort((a, b) => Number(b.status === 'open') - Number(a.status === 'open') || b.created_at.localeCompare(a.created_at)))
  },
  async resolveReport(id, note) {
    admin()
    const r = reports.find((x) => x.id === id)
    if (r) { r.status = 'resolved'; r.note = note.trim().slice(0, 300); if (r.reason === 'lost_property') holds[r.target_id] = 0 }
    return wait(undefined)
  },
  async adminDeletions() {
    admin()
    return wait(deletions.map(({ user_id: _u, ...d }) => ({ ...d, user_id: _u })).sort((a, b) => Number(b.status === 'open') - Number(a.status === 'open') || b.requested_at.localeCompare(a.requested_at)))
  },
  async resolveDeletion(id) {
    admin()
    const d = deletions.find((x) => x.id === id && x.status === 'open')
    if (d) d.status = 'done'
    return wait(undefined)
  },
  async adminDisputes() {
    admin()
    return wait(apps.filter((a) => a.pay_status === 'disputed').map((a): AdminDispute => {
      const j = jobOf(a)
      return { application_id: a.id, job_title: j.title, employer_name: j.business_name ?? '—', seeker_name: users[a.seeker_id]?.profile.full_name ?? '—', employer_phone: users[j.employer_id]?.profile.phone ?? null, seeker_phone: users[a.seeker_id]?.profile.phone ?? null, amount: a.escrow_amount, fee: a.platform_fee, reason: resolutions[a.id] ?? 'worker_contests_noshow', attendance: a.attendance, funding_mode: a.funding_mode, start_date: j.start_date, end_date: j.end_date, completed_at: a.completed_at ? new Date(a.completed_at).toISOString() : null }
    }))
  },
  async resolveDispute(id, outcome) {
    admin()
    if (!['release', 'refund'].includes(outcome)) throw new AppError('BAD_OUTCOME')
    const a = apps.find((x) => x.id === id)
    if (!a) throw new AppError('NOT_FOUND')
    if (a.pay_status !== 'disputed') throw new AppError('NOT_DISPUTED')
    if (outcome === 'release') { if (a.attendance === 'noshow') a.attendance = null; release(a) } else { a.pay_status = 'refunded'; freeSlot(a) }
    return wait(undefined)
  },
  async adminPayouts() {
    admin()
    return wait([...payouts].sort((x, y) => Number(x.status === 'paid') - Number(y.status === 'paid')).map((p): AdminPayout => ({ ...p, seeker_name: users[p.seeker_id]?.profile.full_name ?? '—', bank_name: banks[p.seeker_id]?.bank_name ?? null, account_no: banks[p.seeker_id]?.account_no ?? null, holder_name: banks[p.seeker_id]?.holder_name ?? null })))
  },
  async markPayoutPaid(id, reference) {
    admin()
    const p = payouts.find((x) => x.id === id)
    if (!p) throw new AppError('NOT_FOUND')
    if (p.status !== 'pending') throw new AppError('PAYOUT_DONE')
    if (p.mode === 'live' && reference.trim().length < 3) throw new AppError('REFERENCE_REQUIRED')
    Object.assign(p, { status: 'paid', paid_at: now(), reference: reference.trim() || null })
    return wait(undefined)
  },
  async adminFlags() {
    admin()
    const pairs: Record<string, { e: string; s: string; n: number; total: number }> = {}
    apps.filter((a) => a.pay_status === 'released').forEach((a) => {
      const k = jobOf(a).employer_id + '|' + a.seeker_id
      pairs[k] ??= { e: jobOf(a).employer_id, s: a.seeker_id, n: 0, total: 0 }
      pairs[k].n += 1; pairs[k].total += a.escrow_amount ?? 0
    })
    return wait(Object.values(pairs).filter((x) => x.n >= 3).map((x): AdminFlag => ({ kind: 'repeat_pair', employer_name: users[x.e]?.profile.business_name ?? '—', seeker_name: users[x.s]?.profile.full_name ?? '—', shifts: x.n, total: x.total, last_at: now() })))
  },
  async adminSamples() {
    admin()
    return wait<AdminSamples>({
      shops: [{ id: 's1', name: 'Quán Cơm Tấm Bà Tư', owner: 'Chị Tư', address: '12 Nguyễn Trãi, Q.1', city: 'TP.HCM', logo_path: '/sample/shop-01.png', jobs: 1 }],
      workers: [{ id: 'w1', name: 'Nguyễn Thị Lan', city: 'TP.HCM', birth_year: 1999, avatar_path: '/sample/worker-01.png', experience: ['service'], availability: ['evening'], applications: 2 }],
    })
  },
  async adminStats() {
    admin()
    const day = new Date(); day.setHours(0, 0, 0, 0)
    const since = (iso: string, from: number) => new Date(iso).getTime() >= from
    const week = Date.now() - 7 * 864e5
    const profiles = Object.values(users).map((u) => u.profile)
    return wait<AdminStats>({
      employers: profiles.filter((p) => p.roles.includes('employer')).length,
      seekers: profiles.filter((p) => p.roles.includes('seeker')).length,
      new_users_today: 0, new_users_7d: 0,
      open_jobs: jobs.filter((j) => j.status === 'open').length,
      jobs_7d: jobs.filter((j) => since(j.created_at, week)).length,
      applications_today: apps.filter((a) => since(a.created_at, day.getTime())).length,
      applications_7d: apps.filter((a) => since(a.created_at, week)).length,
      accepted_total: apps.filter((a) => a.status === 'accepted').length,
      shifts_done: apps.filter((a) => a.completed_at != null).length,
      reviews_total: reviews.length,
      open_disputes: apps.filter((a) => a.pay_status === 'disputed' || a.pay_status === 'noshow_reported').length,
    })
  }
}
