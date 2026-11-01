import { AppError, type Api, type Job } from '../types'
import { applyLockOf } from './trustMock'
import { guides } from './hireToolsMock'
import { cleanTasks } from '../tasks'
import { CFG, SUSPICIOUS, holds, discoverable, saved, isPro, NEW_PAY, now, nid, notify, users, jobs, apps, payouts, current, wait, me, jobOf, bizOf, escrowOf } from './core'

export const jobsMock: Pick<Api, 'savedJobIds' | 'saveJobs' | 'unsaveJob' | 'jobsByIds' | 'homeHighlights' | 'listOpenJobs' | 'getJob' | 'myApplicationStatus' | 'apply' | 'myApplications' | 'withdraw' | 'myJobs' | 'createJob' | 'setJobStatus' | 'applicantsFor' | 'myHires' | 'decide'> = {
  async savedJobIds() { return wait([...(saved[me().id] ?? [])].reverse()) },
  async saveJobs(jobIds) {
    const list = (saved[me().id] ??= [])
    jobIds.forEach((j) => { if (jobs.some((x) => x.id === j) && !list.includes(j)) list.push(j) })
    return wait(undefined)
  },
  async unsaveJob(jobId) {
    const id = me().id
    saved[id] = (saved[id] ?? []).filter((j) => j !== jobId)
    return wait(undefined)
  },
  async jobsByIds(ids) {
    const mineOf = (j: Job) => current != null && apps.some((a) => a.job_id === j.id && a.seeker_id === current)
    return wait(jobs.filter((j) => ids.includes(j.id) && (j.status === 'open' || mineOf(j))))
  },
  async homeHighlights() {
    const open = jobs.filter((j) => j.status === 'open')
    const top = (key: 'city' | 'category') => {
      const n: Record<string, number> = {}
      open.forEach((j) => { const v = j[key]; if (v) n[v] = (n[v] ?? 0) + 1 })
      const best = Object.entries(n).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]
      return best ? { name: best[0], n: best[1] } : null
    }
    return wait({
      open_jobs: open.length, new_jobs_7d: open.length, urgent_jobs: open.filter((j) => j.is_urgent).length, ready_workers: discoverable.size,
      top_city: top('city'), top_category: top('category'),
      news: [{ title: 'Tuyển dụng TPHCM cận Tết 2026 dự kiến nhu cầu lên tới 30.000 vị trí', sub: 'Bài báo về nhu cầu tuyển dụng dịp cận Tết ở TP.HCM.', url: 'https://voh.com.vn/kinh-te/tuyen-dung-tphcm-can-tet-2026-du-kien-nhu-cau-len-toi-30000-vi-tri-630672.html', source: 'VOH' }],
    })
  },
  // urgent first, then boosted (a referral reward), then as stored
  async listOpenJobs() { return wait(jobs.filter((j) => j.status === 'open').sort((a, b) => Number(!!b.is_urgent) - Number(!!a.is_urgent) || (b.boosted_until ?? '').localeCompare(a.boosted_until ?? ''))) },
  async getJob(id) { return wait(jobs.find((j) => j.id === id) ?? null) },

  async myApplicationStatus() {
    if (!current) return {}
    return wait(Object.fromEntries(apps.filter((a) => a.seeker_id === current).map((a) => [a.job_id, a.status])))
  },

  async apply(jobId, message) {
    const p = me()
    if (!p.roles.includes('seeker')) throw new AppError('FORBIDDEN')
    const job = jobs.find((j) => j.id === jobId)
    if (!job || job.status !== 'open') throw new AppError('JOB_NOT_OPEN')
    if (job.employer_id === p.id) throw new AppError('FORBIDDEN')
    if (apps.some((a) => a.job_id === jobId && a.seeker_id === p.id)) throw new AppError('ALREADY_APPLIED')
    if (applyLockOf(p.id)) throw new AppError('APPLY_LOCKED')
    apps.push({ id: nid(), job_id: jobId, seeker_id: p.id, status: 'pending', message: message.trim() || null, created_at: now(), seen: false, ...NEW_PAY })
    notify(job.employer_id, 'new_applicant', 'Có người ứng tuyển mới', `${p.full_name} ứng tuyển "${job.title}"`, '/app/ung-vien')
    return wait(undefined)
  },

  async myApplications() {
    const p = me()
    return wait(apps.filter((a) => a.seeker_id === p.id).reverse().map((a) => {
      const job = jobs.find((j) => j.id === a.job_id)!
      const funded = CFG.payment_mode === 'off' || ['held', 'released', 'noshow_reported', 'disputed'].includes(a.pay_status)
      return { id: a.id, status: a.status, message: a.message, created_at: a.created_at, job, ...escrowOf(a, p.id), payout: payouts.find((x) => x.application_id === a.id) ? { status: payouts.find((x) => x.application_id === a.id)!.status, reference: payouts.find((x) => x.application_id === a.id)!.reference } : null, employer_phone: a.status === 'accepted' && funded ? users[job.employer_id]?.profile.phone ?? null : null }
    }))
  },

  async withdraw(id) {
    const a = apps.find((x) => x.id === id && x.seeker_id === me().id)
    if (!a || a.status !== 'pending') throw new AppError('CANNOT_WITHDRAW')
    a.status = 'withdrawn'
    return wait(undefined)
  },

  async myJobs() {
    const p = me()
    return wait(jobs.filter((j) => j.employer_id === p.id).reverse().map((j) => {
      const list = apps.filter((a) => a.job_id === j.id && a.status !== 'withdrawn')
      return { ...j, applicants: list.length, newApplicants: list.filter((a) => !a.seen && a.status === 'pending').length }
    }))
  },

  async createJob(input) {
    const p = me()
    if (!p.roles.includes('employer')) throw new AppError('FORBIDDEN')
    if (input.is_urgent && !isPro(p)) throw new AppError('URGENT_REQUIRES_PRO')
    if (!isPro(p) && jobs.filter((j) => j.employer_id === p.id && j.status === 'open').length >= 2) throw new AppError('FREE_PLAN_LIMIT')
    const job: Job = { ...input, tasks: cleanTasks(input.tasks ?? []), id: nid(), employer_id: p.id, business_name: p.business_name || p.full_name, business_logo: p.logo_path ?? null, filled: 0, status: 'open', created_at: now() }
    const text = `${input.title} ${input.description ?? ''} ${input.shift_note ?? ''} ${(input.tasks ?? []).join(' ')}`.toLowerCase()
    const hit = SUSPICIOUS.find((w) => text.includes(w))
    if (hit || (holds[p.id] ?? 0) > Date.now()) {
      job.held_reason = hit ? `Chứa cụm "${hit}"` : 'Tài khoản đang chờ xác minh'; job.status = 'closed'
      notify(p.id, 'job_held', 'Tin đang chờ duyệt', `"${job.title}" — ${job.held_reason}. Quản trị sẽ xem trong 24 giờ.`, '/app/viec-cua-toi')
    }
    jobs.unshift(job)
    return wait(job)
  },

  async setJobStatus(id, status) {
    const p = me()
    const j = jobs.find((x) => x.id === id && x.employer_id === p.id)
    if (!j) throw new AppError('NOT_FOUND')
    if (status === 'open' && !isPro(p) && jobs.filter((x) => x.employer_id === p.id && x.status === 'open').length >= 2) throw new AppError('FREE_PLAN_LIMIT')
    if (status === 'open' && j.held_reason) return wait(undefined) // a held post stays closed
    j.status = status
    return wait(undefined)
  },

  async applicantsFor(jobId) {
    const p = me()
    const list = apps.filter((a) => a.job_id === jobId && a.status !== 'withdrawn' && jobs.find((j) => j.id === jobId)?.employer_id === p.id)
    const out = list.map((a) => {
      const s = users[a.seeker_id]?.profile
      return { id: a.id, status: a.status, message: a.message, created_at: a.created_at, seeker_id: a.seeker_id, ...escrowOf(a, p.id), full_name: s?.full_name ?? '—', bio: s?.bio ?? null, phone: a.status === 'accepted' ? s?.phone ?? null : null,
        birth_year: s?.birth_year ?? null, experience: s?.experience ?? [], availability: s?.availability ?? [], avatar_path: s?.avatar_path ?? null }
    })
    list.forEach((a) => { a.seen = true })
    return wait(out)
  },

  async myHires() {
    const p = me()
    const mine = jobs.filter((j) => j.employer_id === p.id)
    return wait(apps.filter((a) => a.status !== 'withdrawn' && mine.some((j) => j.id === a.job_id)).slice().reverse().map((a) => {
      const s = users[a.seeker_id]?.profile
      return { id: a.id, status: a.status, message: a.message, created_at: a.created_at, seeker_id: a.seeker_id, ...escrowOf(a, p.id), full_name: s?.full_name ?? '—', bio: s?.bio ?? null, phone: a.status === 'accepted' ? s?.phone ?? null : null,
        birth_year: s?.birth_year ?? null, experience: s?.experience ?? [], availability: s?.availability ?? [], avatar_path: s?.avatar_path ?? null, job: jobOf(a) }
    }))
  },

  async decide(id, decision) {
    const p = me()
    const a = apps.find((x) => x.id === id)
    if (!a) throw new AppError('NOT_FOUND')
    const job = jobs.find((j) => j.id === a.job_id)!
    if (job.employer_id !== p.id) throw new AppError('FORBIDDEN')
    if (a.status !== 'pending') throw new AppError('ALREADY_DECIDED')
    if (decision === 'accepted') {
      if (job.filled >= job.slots) throw new AppError('JOB_FULL')
      job.filled += 1
      if (job.filled >= job.slots) job.status = 'closed'
    }
    a.status = decision
    if (decision === 'accepted' && guides[job.id]) notify(a.seeker_id, 'job_guide', 'Hướng dẫn công việc', `"${job.title}": ${guides[job.id]}`.slice(0, 300), '/app/cham-cong')
    if (decision === 'accepted') notify(a.seeker_id, 'accepted', `${bizOf(job)} đã nhận bạn`, `Việc "${job.title}" — xem ca và liên hệ quán`, '/app/cham-cong')
    else notify(a.seeker_id, 'rejected', 'Đơn chưa được chọn', `Việc "${job.title}" của ${bizOf(job)}`, '/app/da-ung-tuyen')
    return wait({ phone: decision === 'accepted' ? users[a.seeker_id]?.profile.phone ?? null : null })
  }
}
