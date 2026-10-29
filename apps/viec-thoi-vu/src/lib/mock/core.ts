import type { QuizAnswers } from '../quiz'
import { seedEmployers, seedJobs } from '../seed'
import { addDays, today } from '../format'
import {
  AppError, type AppConfig, type AppNotification, type AdminDeletion, type AdminReport, type ChatMessage, type SentInvite, type AppStatus, type Attendance, type BankAccount, type Escrow, type Job, type PayStatus, type Profile, type Role,
} from '../types'

// In-memory backend for local UI testing (VITE_MOCK=1). Enforces the same rules as the database.
export interface User { profile: Profile; password: string }
export interface App extends Omit<Escrow, 'reviewed' | 'other_reviewed'> {
  id: string; job_id: string; seeker_id: string; status: AppStatus; message: string | null; created_at: string; seen: boolean
  completed_at: number | null; released_at: number | null
}
export interface Rev { id: string; application_id: string; reviewer_id: string; reviewee_id: string; reviewer_role: Role; stars: number; tags: string[]; comment: string | null; created_at: string }
export const FEE_PCT = 8 // the real values live in the database (app_settings)
export const REP_MIN = 50000
export const CFG: AppConfig = { google_login: (import.meta.env.VITE_MOCK_GOOGLE as 'on' | 'off') || 'on', zalo_web_login: 'off', zalo_published: (import.meta.env.VITE_MOCK_ZALO_PUBLISHED as 'on' | 'off') || 'on', payment_mode: (import.meta.env.VITE_MOCK_PAYMENT as AppConfig['payment_mode']) || 'test', billing: (import.meta.env.VITE_MOCK_BILLING as AppConfig['billing']) || 'on' }
export const isPro = (p: Profile) => p.plan === 'pro' || CFG.billing === 'off'
export const NEW_PAY = { pay_status: 'none' as PayStatus, escrow_amount: null, platform_fee: null, attendance: null as Attendance | null, funding_mode: null, completed_at: null, released_at: null }
export const SEEKER_TAGS = ['accurate_description', 'friendly', 'clean_safe', 'clear_instructions']
export const EMPLOYER_TAGS = ['hardworking', 'punctual', 'polite', 'fast_learner']

export const now = () => new Date().toISOString()
export let seq = 100
export const nid = () => `m${++seq}`

// in-app notifications (the database writes them from a trigger on applications; here the same events call notify())
export const notes: (AppNotification & { user_id: string; ref?: string })[] = []
export const notify = (user_id: string, kind: string, title: string, body: string, link: string, ref?: string) => { notes.unshift({ id: nid(), user_id, kind, title, body, link, created_at: now(), read_at: null, ref }) }
export const chat: (ChatMessage & { application_id: string })[] = []
export const reports: (AdminReport & { reporter_id: string })[] = []
export const deletions: (AdminDeletion & { user_id: string })[] = []
export const invites: (SentInvite & { employer_id: string })[] = []
export const saved: Record<string, string[]> = {} // "Việc đã lưu" per user, oldest first
export const discoverable = new Set<string>() // workers who chose "let shops find me"

export const users: Record<string, User> = {}
export function addUser(id: string, digits: string, password: string, role: Role, full_name: string, extra: Partial<Profile> = {}) {
  users[id] = {
    password,
    profile: { id, role, roles: [role], full_name, bio: null, business_name: null, address: null, city: null, plan: 'free', plan_until: null, locale: 'vi', phone: '+' + digits,
      birth_year: null, experience: [], availability: [], avatar_path: null, ...extra },
  }
}
addUser('11111111-1111-4111-8111-000000000001', '84900000001', 'demo-tim-viec', 'seeker', 'Minh Anh (dùng thử)', { bio: 'Sinh viên năm 2, rảnh buổi sáng và cuối tuần.', city: 'TP.HCM', birth_year: 2005, experience: ['service', 'cashier'], availability: ['morning', 'weekend'] })
addUser('11111111-1111-4111-8111-000000000004', '84900000004', 'x-not-usable', 'seeker', 'Trần Thị Hoa', { city: 'TP.HCM', birth_year: 2002, experience: ['barista', 'service'], availability: ['evening', 'weekend'] })
discoverable.add('11111111-1111-4111-8111-000000000004')
addUser('11111111-1111-4111-8111-000000000003', '84900000003', 'quan-tri-thu-1', 'employer', 'Quản trị (dùng thử)', { business_name: 'Quản trị', is_admin: true })
addUser('11111111-1111-4111-8111-000000000002', '84900000002', 'demo-tuyen-dung', 'employer', 'Chủ quán (dùng thử)', { business_name: 'Quán Cà Phê Dùng Thử', address: '45 Lê Lợi, Q.1', city: 'TP.HCM' })
Object.entries(seedEmployers).forEach(([id, e], i) => {
  if (!users[id]) addUser(id, '8490000010' + i, 'x-not-usable', 'employer', e.name, { business_name: e.name, plan: e.plan })
})

export const jobs: Job[] = seedJobs.map((j) => ({ ...j, filled: 0, status: 'open', created_at: now() }))
export const apps: App[] = [{ id: 'a1', job_id: 'j3', seeker_id: '11111111-1111-4111-8111-000000000001', status: 'pending', message: 'Em rảnh buổi sáng ạ', created_at: now(), seen: false, ...NEW_PAY }]
export const reviews: Rev[] = []
export interface Payout { id: string; application_id: string; seeker_id: string; amount: number; mode: 'test' | 'live'; status: 'pending' | 'paid'; reference: string | null; created_at: string; paid_at: string | null }
export const payouts: Payout[] = []
export const banks: Record<string, BankAccount> = {}
export const resolutions: Record<string, string> = {}

export let current: string | null = null
export const quizzes: Record<string, QuizAnswers> = {}
try { current = sessionStorage.getItem('mock-uid') } catch { /* storage unavailable */ }
export const setCurrent = (id: string | null) => {
  current = id
  try { if (id) sessionStorage.setItem('mock-uid', id); else sessionStorage.removeItem('mock-uid') } catch { /* ignore */ }
}

export const wait = <T>(v: T) => new Promise<T>((r) => setTimeout(() => r(structuredClone(v)), 250))
export const me = () => {
  if (!current || !users[current]) throw new AppError('NOT_SIGNED_IN')
  return users[current].profile
}
export const byDigits = (d: string) => Object.values(users).find((u) => u.profile.phone === '+' + d)

export const jobOf = (a: App) => jobs.find((j) => j.id === a.job_id)!
export const bizOf = (j: Job) => users[j.employer_id]?.profile.business_name || users[j.employer_id]?.profile.full_name || 'Quán'
export const personOf = (id: string) => users[id]?.profile.full_name || 'Ứng viên'
export const revealed = (appId: string) => {
  const a = apps.find((x) => x.id === appId)
  return !!a && (reviews.filter((r) => r.application_id === appId).length >= 2 || (!!a.released_at && Date.now() - a.released_at > 7 * 864e5))
}
export const escrowOf = (a: App, viewer: string): Escrow => ({
  paid_cash_at: a.paid_cash_at ?? null, cash_received_at: a.cash_received_at ?? null,
  checked_in_at: a.checked_in_at ?? null, checkin_distance_m: a.checkin_distance_m ?? null, checked_out_at: a.checked_out_at ?? null,
  pay_status: a.pay_status, escrow_amount: a.escrow_amount, platform_fee: a.platform_fee, attendance: a.attendance, funding_mode: a.funding_mode,
  reviewed: reviews.some((r) => r.application_id === a.id && r.reviewer_id === viewer),
  other_reviewed: reviews.some((r) => r.application_id === a.id && r.reviewer_id !== viewer),
})
export function quoteOf(a: App, hours?: number) {
  const j = jobOf(a)
  const days = Math.max((Date.parse(j.end_date) - Date.parse(j.start_date)) / 864e5 + 1, 1)
  if (j.pay_unit === 'hour' && hours != null && (hours < 1 || hours > 16 * days)) throw new AppError('BAD_HOURS')
  const amt = j.pay_unit === 'hour' ? j.pay_amount * (hours ?? 8 * days) : j.pay_unit === 'day' ? j.pay_amount * days : j.pay_amount
  const fee = Math.round((amt * FEE_PCT) / 100)
  return { amount: Math.round(amt), fee, net: Math.round(amt) - fee }
}
export const release = (a: App) => {
  a.pay_status = 'released'; a.released_at = Date.now(); a.completed_at ??= Date.now()
  notify(a.seeker_id, 'shift_done', 'Ca làm đã được xác nhận', `${bizOf(jobOf(a))} xác nhận bạn đã làm "${jobOf(a).title}"`, '/app/thu-nhap')
  if (a.funding_mode !== 'off' && !payouts.some((p) => p.application_id === a.id)) {
    payouts.push({ id: nid(), application_id: a.id, seeker_id: a.seeker_id, amount: (a.escrow_amount ?? 0) - (a.platform_fee ?? 0), mode: a.funding_mode === 'live' ? 'live' : 'test', status: 'pending', reference: null, created_at: now(), paid_at: null })
  }
}
export const admin = () => { const p = me(); if (!p.is_admin) throw new AppError('FORBIDDEN'); return p }
export const freeSlot = (a: App) => {
  const j = jobOf(a)
  j.filled = Math.max(j.filled - 1, 0)
  if (j.status === 'closed' && j.end_date >= today()) j.status = 'open'
}
export const sweepFor = (uid: string | null) => {
  apps.forEach((a) => {
    if (uid && a.seeker_id !== uid && jobOf(a).employer_id !== uid) return
    if (a.pay_status === 'noshow_reported' && a.completed_at && Date.now() - a.completed_at > 48 * 36e5) { a.pay_status = 'refunded'; freeSlot(a) }
    if (a.pay_status === 'held' && addDays(jobOf(a).end_date, 2) < today()) { release(a) }
  })
}
export const myApp = (id: string, who: 'employer' | 'seeker') => {
  const p = me()
  const a = apps.find((x) => x.id === id)
  if (!a) throw new AppError('NOT_FOUND')
  const ok = who === 'employer' ? jobOf(a).employer_id === p.id : a.seeker_id === p.id
  if (!ok) throw new AppError('FORBIDDEN')
  return a
}
