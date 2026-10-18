import { normalizePhone } from './phone'
import { seedEmployers, seedJobs } from './seed'
import { addDays, today } from './format'
import {
  AppError, type AdminDispute, type AdminFlag, type AdminPayout, type AdminStats, type Api, type AppConfig, type AppStatus, type Attendance, type BankAccount, type Escrow, type Job, type PayStatus, type Profile, type Reputation, type Role,
} from './types'

// In-memory backend for local UI testing (VITE_MOCK=1). Enforces the same rules as the database.
interface User { profile: Profile; password: string }
interface App extends Omit<Escrow, 'reviewed' | 'other_reviewed'> {
  id: string; job_id: string; seeker_id: string; status: AppStatus; message: string | null; created_at: string; seen: boolean
  completed_at: number | null; released_at: number | null
}
interface Rev { id: string; application_id: string; reviewer_id: string; reviewee_id: string; reviewer_role: Role; stars: number; tags: string[]; comment: string | null; created_at: string }
const FEE_PCT = 8 // the real values live in the database (app_settings)
const REP_MIN = 50000
const CFG: AppConfig = { google_login: (import.meta.env.VITE_MOCK_GOOGLE as 'on' | 'off') || 'on', zalo_web_login: 'off', zalo_published: (import.meta.env.VITE_MOCK_ZALO_PUBLISHED as 'on' | 'off') || 'on', payment_mode: (import.meta.env.VITE_MOCK_PAYMENT as AppConfig['payment_mode']) || 'test', billing: (import.meta.env.VITE_MOCK_BILLING as AppConfig['billing']) || 'on' }
const isPro = (p: Profile) => p.plan === 'pro' || CFG.billing === 'off'
const NEW_PAY = { pay_status: 'none' as PayStatus, escrow_amount: null, platform_fee: null, attendance: null as Attendance | null, funding_mode: null, completed_at: null, released_at: null }
const SEEKER_TAGS = ['accurate_description', 'friendly', 'clean_safe', 'clear_instructions']
const EMPLOYER_TAGS = ['hardworking', 'punctual', 'polite', 'fast_learner']

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
addUser('11111111-1111-4111-8111-000000000003', '84900000003', 'quan-tri-thu-1', 'employer', 'Quản trị (dùng thử)', { business_name: 'Quản trị', is_admin: true })
addUser('11111111-1111-4111-8111-000000000002', '84900000002', 'demo-tuyen-dung', 'employer', 'Chủ quán (dùng thử)', { business_name: 'Quán Cà Phê Dùng Thử', address: '45 Lê Lợi, Q.1', city: 'TP.HCM' })
Object.entries(seedEmployers).forEach(([id, e], i) => {
  if (!users[id]) addUser(id, '8490000010' + i, 'x-not-usable', 'employer', e.name, { business_name: e.name, plan: e.plan })
})

const jobs: Job[] = seedJobs.map((j) => ({ ...j, filled: 0, status: 'open', created_at: now() }))
const apps: App[] = [{ id: 'a1', job_id: 'j3', seeker_id: '11111111-1111-4111-8111-000000000001', status: 'pending', message: 'Em rảnh buổi sáng ạ', created_at: now(), seen: false, ...NEW_PAY }]
const reviews: Rev[] = []
interface Payout { id: string; application_id: string; seeker_id: string; amount: number; mode: 'test' | 'live'; status: 'pending' | 'paid'; reference: string | null; created_at: string; paid_at: string | null }
const payouts: Payout[] = []
const banks: Record<string, BankAccount> = {}
const resolutions: Record<string, string> = {}

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

const jobOf = (a: App) => jobs.find((j) => j.id === a.job_id)!
const revealed = (appId: string) => {
  const a = apps.find((x) => x.id === appId)
  return !!a && (reviews.filter((r) => r.application_id === appId).length >= 2 || (!!a.released_at && Date.now() - a.released_at > 7 * 864e5))
}
const escrowOf = (a: App, viewer: string): Escrow => ({
  pay_status: a.pay_status, escrow_amount: a.escrow_amount, platform_fee: a.platform_fee, attendance: a.attendance, funding_mode: a.funding_mode,
  reviewed: reviews.some((r) => r.application_id === a.id && r.reviewer_id === viewer),
  other_reviewed: reviews.some((r) => r.application_id === a.id && r.reviewer_id !== viewer),
})
function quoteOf(a: App, hours?: number) {
  const j = jobOf(a)
  const days = Math.max((Date.parse(j.end_date) - Date.parse(j.start_date)) / 864e5 + 1, 1)
  if (j.pay_unit === 'hour' && hours != null && (hours < 1 || hours > 16 * days)) throw new AppError('BAD_HOURS')
  const amt = j.pay_unit === 'hour' ? j.pay_amount * (hours ?? 8 * days) : j.pay_unit === 'day' ? j.pay_amount * days : j.pay_amount
  const fee = Math.round((amt * FEE_PCT) / 100)
  return { amount: Math.round(amt), fee, net: Math.round(amt) - fee }
}
const release = (a: App) => {
  a.pay_status = 'released'; a.released_at = Date.now(); a.completed_at ??= Date.now()
  if (a.funding_mode !== 'off' && !payouts.some((p) => p.application_id === a.id)) {
    payouts.push({ id: nid(), application_id: a.id, seeker_id: a.seeker_id, amount: (a.escrow_amount ?? 0) - (a.platform_fee ?? 0), mode: a.funding_mode === 'live' ? 'live' : 'test', status: 'pending', reference: null, created_at: now(), paid_at: null })
  }
}
const admin = () => { const p = me(); if (!p.is_admin) throw new AppError('FORBIDDEN'); return p }
const freeSlot = (a: App) => {
  const j = jobOf(a)
  j.filled = Math.max(j.filled - 1, 0)
  if (j.status === 'closed' && j.end_date >= today()) j.status = 'open'
}
const sweepFor = (uid: string | null) => {
  apps.forEach((a) => {
    if (uid && a.seeker_id !== uid && jobOf(a).employer_id !== uid) return
    if (a.pay_status === 'noshow_reported' && a.completed_at && Date.now() - a.completed_at > 48 * 36e5) { a.pay_status = 'refunded'; freeSlot(a) }
    if (a.pay_status === 'held' && addDays(jobOf(a).end_date, 2) < today()) { release(a) }
  })
}
const myApp = (id: string, who: 'employer' | 'seeker') => {
  const p = me()
  const a = apps.find((x) => x.id === id)
  if (!a) throw new AppError('NOT_FOUND')
  const ok = who === 'employer' ? jobOf(a).employer_id === p.id : a.seeker_id === p.id
  if (!ok) throw new AppError('FORBIDDEN')
  return a
}

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

  async signInWithGoogle() {
    let g = { email: 'ann@example.com', name: 'Ann Lee' }
    try { g = JSON.parse(sessionStorage.getItem('mock-google') || 'null') || g } catch { /* ignore */ }
    const existing = Object.values(users).find((u) => (u.profile as Profile & { email?: string }).email === g.email)
    if (existing) setCurrent(existing.profile.id)
    else { try { sessionStorage.setItem('mock-google-pending', JSON.stringify(g)) } catch { /* ignore */ } }
    return wait(undefined)
  },
  async pendingProfile() {
    if (current && users[current]) return wait(null)
    try { const g = JSON.parse(sessionStorage.getItem('mock-google-pending') || 'null'); return wait(g ? { email: g.email, name: g.name } : null) } catch { return wait(null) }
  },
  async completeProfile(i) {
    let g: { email: string } | null = null
    try { g = JSON.parse(sessionStorage.getItem('mock-google-pending') || 'null') } catch { /* ignore */ }
    if (!g) throw new AppError('NOT_SIGNED_IN')
    const raw = i.phone.trim()
    const digits = raw.replace(/\D/g, '')
    const ok = (raw.startsWith('+') || raw.startsWith('0')) && /^[0-9]{8,15}$/.test(raw.startsWith('0') ? '84' + digits.slice(1) : digits)
    if (!ok) throw new AppError('BAD_PHONE')
    if (!i.full_name.trim()) throw new AppError('NAME_REQUIRED')
    const id = nid()
    addUser(id, raw.startsWith('0') ? '84' + digits.slice(1) : digits, 'x-google-only', i.role, i.full_name.trim(), {
      bio: i.role === 'seeker' ? i.bio || null : null, business_name: i.role === 'employer' ? i.business_name || null : null,
      address: i.role === 'employer' ? i.address || null : null, city: i.city || null, locale: i.locale,
    })
    ;(users[id].profile as Profile & { email?: string }).email = g.email
    try { sessionStorage.removeItem('mock-google-pending') } catch { /* ignore */ }
    setCurrent(id)
    return wait(users[id].profile)
  },

  async zaloLogin(creds) {
    // Mock: the "phone token" IS the phone, so tests can choose who is logging in.
    const d = normalizePhone(creds.phone_token)
    if (!d) throw new AppError('ZALO_VERIFY_FAILED')
    const u = byDigits(d)
    if (u) { setCurrent(u.profile.id); return wait({ profile: u.profile }) }
    return wait({ ticket: 'mock-ticket-' + d, phone: d })
  },

  async zaloSignUp(ticket, input) {
    const d = ticket.replace('mock-ticket-', '')
    if (!ticket.startsWith('mock-ticket-') || byDigits(d)) throw new AppError('TICKET_INVALID')
    if (!input.full_name.trim()) throw new AppError('NAME_REQUIRED')
    const id = nid()
    addUser(id, d, 'x-zalo-only', input.role, input.full_name.trim(), {
      bio: input.bio || null, business_name: input.business_name || null, address: input.address || null, city: input.city || null, locale: input.locale,
    })
    setCurrent(id)
    return wait(users[id].profile)
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
    apps.push({ id: nid(), job_id: jobId, seeker_id: p.id, status: 'pending', message: message.trim() || null, created_at: now(), seen: false, ...NEW_PAY })
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
    if (p.role !== 'employer') throw new AppError('FORBIDDEN')
    if (input.is_urgent && !isPro(p)) throw new AppError('URGENT_REQUIRES_PRO')
    if (!isPro(p) && jobs.filter((j) => j.employer_id === p.id && j.status === 'open').length >= 2) throw new AppError('FREE_PLAN_LIMIT')
    const job: Job = { ...input, id: nid(), employer_id: p.id, business_name: p.business_name || p.full_name, filled: 0, status: 'open', created_at: now() }
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
      return { id: a.id, status: a.status, message: a.message, created_at: a.created_at, seeker_id: a.seeker_id, ...escrowOf(a, p.id), full_name: s?.full_name ?? '—', bio: s?.bio ?? null, phone: a.status === 'accepted' ? s?.phone ?? null : null }
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

  async appConfig() { return wait(CFG) },
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
    if (attendance === 'noshow') a.pay_status = 'noshow_reported'
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
    const allowed = p.role === 'employer' ? EMPLOYER_TAGS : SEEKER_TAGS
    if (!tags.every((t) => allowed.includes(t))) throw new AppError('BAD_TAGS')
    if (reviews.some((r) => r.application_id === id && r.reviewer_id === p.id)) throw new AppError('ALREADY_REVIEWED')
    reviews.push({ id: nid(), application_id: id, reviewer_id: p.id, reviewee_id: p.role === 'employer' ? a.seeker_id : j.employer_id, reviewer_role: p.role, stars, tags, comment: comment.trim().slice(0, 300) || null, created_at: now() })
    return wait(undefined)
  },
  async reputations(ids) {
    // Same rules as the database: shifts >= REP_MIN count, one (latest) review per reviewer→reviewee pair.
    const out: Record<string, Reputation> = {}
    const q = apps.filter((a) => (a.escrow_amount ?? 0) >= REP_MIN)
    const party = (a: App, u: string) => a.seeker_id === u || jobOf(a).employer_id === u
    ids.forEach((u) => {
      const done = q.filter((a) => a.pay_status === 'released' && party(a, u))
      const latest = new Map<string, Rev>()
      reviews.filter((r) => r.reviewee_id === u && revealed(r.application_id) && q.some((a) => a.id === r.application_id))
        .forEach((r) => { const k = r.reviewer_id; if (!latest.has(k) || latest.get(k)!.created_at <= r.created_at) latest.set(k, r) })
      const rs = [...latest.values()]
      const counts: Record<string, number> = {}
      rs.forEach((r) => r.tags.forEach((t) => { counts[t] = (counts[t] ?? 0) + 1 }))
      out[u] = {
        user_id: u,
        shifts_done: done.length,
        on_time: done.filter((a) => a.attendance !== 'late').length,
        partners: new Set(done.map((a) => (a.seeker_id === u ? jobOf(a).employer_id : a.seeker_id))).size,
        noshow: q.filter((a) => a.seeker_id === u && a.pay_status === 'refunded' && a.attendance === 'noshow').length,
        late: done.filter((a) => a.seeker_id === u && a.attendance === 'late').length,
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
  async adminStats() {
    admin()
    const day = new Date(); day.setHours(0, 0, 0, 0)
    const since = (iso: string, from: number) => new Date(iso).getTime() >= from
    const week = Date.now() - 7 * 864e5
    const profiles = Object.values(users).map((u) => u.profile)
    return wait<AdminStats>({
      employers: profiles.filter((p) => p.role === 'employer').length,
      seekers: profiles.filter((p) => p.role === 'seeker').length,
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
  },
  async pendingReviews() {
    if (!current) return 0
    const me = current
    return wait(apps.filter((a) => a.pay_status === 'released' && (a.seeker_id === me || jobOf(a).employer_id === me) && !reviews.some((r) => r.application_id === a.id && r.reviewer_id === me)).length)
  },
  async sweep() { sweepFor(current); return wait(undefined) },
}
