import { normalizePhone } from './phone'
import { seedEmployers, seedJobs } from './seed'
import {
  AppError, type Api, type AppStatus, type Job, type Profile, type Role,
} from './types'

// In-memory backend for local UI testing (VITE_MOCK=1). Enforces the same rules as the database.
interface User { profile: Profile; password: string }
interface App { id: string; job_id: string; seeker_id: string; status: AppStatus; message: string | null; created_at: string; seen: boolean }

const now = () => new Date().toISOString()
let seq = 100
const nid = () => `m${++seq}`

const users: Record<string, User> = {}
function addUser(id: string, digits: string, password: string, role: Role, full_name: string, extra: Partial<Profile> = {}) {
  users[id] = {
    password,
    profile: { id, role, full_name, bio: null, business_name: null, address: null, city: null, plan: 'free', plan_until: null, locale: 'vi', phone: '+' + digits, ...extra },
  }
}
addUser('11111111-1111-4111-8111-000000000001', '84900000001', 'demo-tim-viec', 'seeker', 'Minh Anh (dùng thử)', { bio: 'Sinh viên năm 2, rảnh buổi sáng và cuối tuần.', city: 'TP.HCM' })
addUser('11111111-1111-4111-8111-000000000002', '84900000002', 'demo-tuyen-dung', 'employer', 'Chủ quán (dùng thử)', { business_name: 'Quán Cà Phê Dùng Thử', address: '45 Lê Lợi, Q.1', city: 'TP.HCM' })
Object.entries(seedEmployers).forEach(([id, e], i) => {
  if (!users[id]) addUser(id, '8490000010' + i, 'x-not-usable', 'employer', e.name, { business_name: e.name, plan: e.plan })
})

const jobs: Job[] = seedJobs.map((j) => ({ ...j, filled: 0, status: 'open', created_at: now() }))
const apps: App[] = [{ id: 'a1', job_id: 'j3', seeker_id: '11111111-1111-4111-8111-000000000001', status: 'pending', message: 'Em rảnh buổi sáng ạ', created_at: now(), seen: false }]

let current: string | null = null
try { current = sessionStorage.getItem('mock-uid') } catch { /* storage unavailable */ }
const setCurrent = (id: string | null) => {
  current = id
  try { id ? sessionStorage.setItem('mock-uid', id) : sessionStorage.removeItem('mock-uid') } catch { /* ignore */ }
}

const wait = <T>(v: T) => new Promise<T>((r) => setTimeout(() => r(structuredClone(v)), 250))
const me = () => {
  if (!current || !users[current]) throw new AppError('NOT_SIGNED_IN')
  return users[current].profile
}
const byDigits = (d: string) => Object.values(users).find((u) => u.profile.phone === '+' + d)

export const mockApi: Api = {
  async me() { return wait(current && users[current] ? users[current].profile : null) },

  async signUp(input) {
    const d = normalizePhone(input.phone)
    if (!d) throw new AppError('INVALID_PHONE')
    if (input.password.length < 8) throw new AppError('WEAK_PASSWORD')
    if (!input.full_name.trim()) throw new AppError('NAME_REQUIRED')
    if (byDigits(d)) throw new AppError('PHONE_TAKEN')
    const id = nid()
    addUser(id, d, input.password, input.role, input.full_name.trim(), {
      bio: input.bio || null, business_name: input.business_name || null, address: input.address || null, city: input.city || null, locale: input.locale,
    })
    setCurrent(id)
    return wait(users[id].profile)
  },

  async signIn(phone, password) {
    const d = normalizePhone(phone)
    if (!d) throw new AppError('INVALID_PHONE')
    const u = byDigits(d)
    if (!u || u.password !== password) throw new AppError('INVALID_LOGIN')
    setCurrent(u.profile.id)
    return wait(u.profile)
  },

  async signOut() { setCurrent(null) },

  async listOpenJobs() { return wait(jobs.filter((j) => j.status === 'open')) },
  async getJob(id) { return wait(jobs.find((j) => j.id === id) ?? null) },

  async myApplicationStatus() {
    if (!current) return {}
    return wait(Object.fromEntries(apps.filter((a) => a.seeker_id === current).map((a) => [a.job_id, a.status])))
  },

  async apply(jobId, message) {
    const p = me()
    if (p.role !== 'seeker') throw new AppError('FORBIDDEN')
    const job = jobs.find((j) => j.id === jobId)
    if (!job || job.status !== 'open') throw new AppError('JOB_NOT_OPEN')
    if (apps.some((a) => a.job_id === jobId && a.seeker_id === p.id)) throw new AppError('ALREADY_APPLIED')
    apps.push({ id: nid(), job_id: jobId, seeker_id: p.id, status: 'pending', message: message.trim() || null, created_at: now(), seen: false })
    return wait(undefined)
  },

  async myApplications() {
    const p = me()
    return wait(apps.filter((a) => a.seeker_id === p.id).reverse().map((a) => {
      const job = jobs.find((j) => j.id === a.job_id)!
      return { id: a.id, status: a.status, message: a.message, created_at: a.created_at, job, employer_phone: a.status === 'accepted' ? users[job.employer_id]?.profile.phone ?? null : null }
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
    if (p.role !== 'employer') throw new AppError('FORBIDDEN')
    if (input.is_urgent && p.plan !== 'pro') throw new AppError('URGENT_REQUIRES_PRO')
    if (p.plan !== 'pro' && jobs.filter((j) => j.employer_id === p.id && j.status === 'open').length >= 2) throw new AppError('FREE_PLAN_LIMIT')
    const job: Job = { ...input, id: nid(), employer_id: p.id, business_name: p.business_name || p.full_name, filled: 0, status: 'open', created_at: now() }
    jobs.unshift(job)
    return wait(job)
  },

  async setJobStatus(id, status) {
    const p = me()
    const j = jobs.find((x) => x.id === id && x.employer_id === p.id)
    if (!j) throw new AppError('NOT_FOUND')
    if (status === 'open' && p.plan !== 'pro' && jobs.filter((x) => x.employer_id === p.id && x.status === 'open').length >= 2) throw new AppError('FREE_PLAN_LIMIT')
    j.status = status
    return wait(undefined)
  },

  async applicantsFor(jobId) {
    const p = me()
    const list = apps.filter((a) => a.job_id === jobId && a.status !== 'withdrawn' && jobs.find((j) => j.id === jobId)?.employer_id === p.id)
    const out = list.map((a) => {
      const s = users[a.seeker_id]?.profile
      return { id: a.id, status: a.status, message: a.message, created_at: a.created_at, seeker_id: a.seeker_id, full_name: s?.full_name ?? '—', bio: s?.bio ?? null, phone: a.status === 'accepted' ? s?.phone ?? null : null }
    })
    list.forEach((a) => { a.seen = true })
    return wait(out)
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
    return wait({ phone: decision === 'accepted' ? users[a.seeker_id]?.profile.phone ?? null : null })
  },

  async updateProfile(patch) {
    const p = me()
    Object.assign(p, patch)
    return wait(p)
  },
}
