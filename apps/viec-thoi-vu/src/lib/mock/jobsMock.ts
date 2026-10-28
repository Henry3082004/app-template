import { AppError, type Api, type Job } from '../types'
import { CFG, isPro, NEW_PAY, now, nid, notify, users, jobs, apps, payouts, current, wait, me, jobOf, bizOf, escrowOf } from './core'

export const jobsMock: Pick<Api, 'listOpenJobs' | 'getJob' | 'myApplicationStatus' | 'apply' | 'myApplications' | 'withdraw' | 'myJobs' | 'createJob' | 'setJobStatus' | 'applicantsFor' | 'myHires' | 'decide'> = {
  async listOpenJobs() { return wait(jobs.filter((j) => j.status === 'open')) },
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
    const job: Job = { ...input, id: nid(), employer_id: p.id, business_name: p.business_name || p.full_name, business_logo: p.logo_path ?? null, filled: 0, status: 'open', created_at: now() }
    jobs.unshift(job)
    return wait(job)
  },

  async setJobStatus(id, status) {
    const p = me()
    const j = jobs.find((x) => x.id === id && x.employer_id === p.id)
    if (!j) throw new AppError('NOT_FOUND')
    if (status === 'open' && !isPro(p) && jobs.filter((x) => x.employer_id === p.id && x.status === 'open').length >= 2) throw new AppError('FREE_PLAN_LIMIT')
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
    if (decision === 'accepted') notify(a.seeker_id, 'accepted', `${bizOf(job)} đã nhận bạn`, `Việc "${job.title}" — xem ca và liên hệ quán`, '/app/cham-cong')
    else notify(a.seeker_id, 'rejected', 'Đơn chưa được chọn', `Việc "${job.title}" của ${bizOf(job)}`, '/app/da-ung-tuyen')
    return wait({ phone: decision === 'accepted' ? users[a.seeker_id]?.profile.phone ?? null : null })
  }
}
