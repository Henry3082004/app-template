export type Role = 'seeker' | 'employer'
export type Plan = 'free' | 'pro'
export type PayUnit = 'hour' | 'day' | 'shift' | 'job'
export type JobStatus = 'open' | 'closed'
export type AppStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn'
export type PayStatus = 'none' | 'held' | 'released' | 'refunded' | 'noshow_reported' | 'disputed'
export type Attendance = 'ok' | 'late' | 'noshow'
export type Category = 'service' | 'warehouse' | 'event' | 'farm' | 'retail' | 'other'
export type Locale = 'vi' | 'en'
/** Worker profile codes (labels live in i18n: exp_*, avail_*). Same lists as the database checks. */
export const EXPERIENCE = ['service', 'barista', 'kitchen', 'cashier', 'sales', 'warehouse', 'event', 'none'] as const
export const AVAILABILITY = ['morning', 'afternoon', 'evening', 'weekend'] as const
export type Experience = (typeof EXPERIENCE)[number]
export type Availability = (typeof AVAILABILITY)[number]

/** What a worker tells businesses about themselves (shown on applicant cards). */
export interface WorkerInfo {
  birth_year: number | null
  experience: Experience[]
  availability: Availability[]
  avatar_path: string | null
}

export interface Profile extends WorkerInfo {
  id: string
  /** the role in use right now */
  role: Role
  /** roles this account owns (one at sign-up, the other can be added later) */
  roles: Role[]
  full_name: string
  bio: string | null
  business_name: string | null
  address: string | null
  city: string | null
  plan: Plan
  plan_until: string | null
  locale: Locale
  phone: string | null
  is_admin?: boolean
  /** a business's logo/photo (storage path) */
  logo_path?: string | null
  /** how the account signs in; Zalo hands over a phone number Zalo has verified */
  auth_provider?: 'password' | 'zalo' | 'google'
}

export interface Job {
  id: string
  employer_id: string
  title: string
  description: string | null
  category: Category
  pay_amount: number
  pay_unit: PayUnit
  start_date: string
  end_date: string
  shift_note: string | null
  address: string
  city: string
  lat: number | null
  lng: number | null
  slots: number
  filled: number
  is_urgent: boolean
  status: JobStatus
  created_at: string
  business_name: string | null
  /** the shop's logo (storage path), if it has one */
  business_logo?: string | null
  /** sample job: only admins can see it */
  is_sample?: boolean
}

/** Escrow / shift state shared by both sides of an accepted application. */
export interface Escrow {
  pay_status: PayStatus
  escrow_amount: number | null
  platform_fee: number | null
  attendance: Attendance | null
  funding_mode: string | null
  reviewed: boolean
  /** the other side already reviewed this shift (content stays hidden until I review too) */
  other_reviewed: boolean
  /** free mode: when the shop recorded paying the worker in cash */
  paid_cash_at?: string | null
  /** free mode: when the worker confirmed receiving that cash */
  cash_received_at?: string | null
  /** the worker's "I'm here" / "I'm done" for the current day, and how far from the shop the phone was (metres, if known) */
  checked_in_at?: string | null
  checkin_distance_m?: number | null
  checked_out_at?: string | null
}

export interface MyApplication extends Escrow {
  payout: { status: 'pending' | 'paid'; reference: string | null } | null
  id: string
  status: AppStatus
  message: string | null
  created_at: string
  job: Job
  employer_phone: string | null
}

export interface MyJob extends Job {
  applicants: number
  newApplicants: number
}

export interface Applicant extends Escrow, WorkerInfo {
  id: string
  status: AppStatus
  message: string | null
  created_at: string
  seeker_id: string
  full_name: string
  bio: string | null
  phone: string | null
}

/** An accepted/pending/rejected application seen from the shop, with its post (all posts in one list). */
export interface Hire extends Applicant { job: Job }

export interface Reputation {
  user_id: string
  shifts_done: number
  on_time: number
  partners: number
  noshow: number
  late: number
  ratings: number
  avg_stars: number | null
  top_tags: string[]
}

/** In-app notification (named so it does not clash with the browser's own Notification). */
export interface AppNotification { id: string; kind: string; title: string; body: string | null; link: string | null; created_at: string; read_at: string | null }

export interface ChatMessage { id: string; sender_id: string; body: string; created_at: string }
export const REPORT_REASONS = ['scam', 'fee', 'no_show', 'harassment', 'fake_info', 'other'] as const
export type ReportReason = (typeof REPORT_REASONS)[number]
export interface AdminReport { id: string; reporter_name: string; target_id: string; target_name: string; reason: ReportReason; detail: string | null; job_title: string | null; status: 'open' | 'resolved'; note: string | null; created_at: string }
export interface DeletionRequest { status: 'open'; requested_at: string }
export interface AdminDeletion { id: string; user_id: string; name: string; email: string | null; reason: string | null; status: 'open' | 'done' | 'cancelled'; requested_at: string }
export interface SentInvite { job_id: string; worker_id: string }
/** Capy, the AI helper. A job seeker's request becomes a search (filters the app applies to the real list); a shop's becomes a draft post. */
export interface CapyMsg { role: 'user' | 'assistant'; text: string }
export interface CapySearch {
  keywords: string[]; category: Category | ''; city: string; urgent: boolean; min_pay: number | null; pay_unit: PayUnit | ''
  near: { name: string; lat: number; lng: number } | null; radius_km: number
}
export interface CapyDraft {
  title: string; description: string; category: Category; pay_amount: number | null; pay_unit: PayUnit; slots: number
  start_date: string; end_date: string; shift_note: string; address: string; city: string; is_urgent: boolean
}
export interface CapyReply { role: Role; reply: string; search?: CapySearch; draft?: CapyDraft }
/** Numbers and news for the home banner: counts only, plus links an admin chose. */
export interface Highlights {
  open_jobs: number; new_jobs_7d: number; urgent_jobs: number; ready_workers: number
  top_city: { name: string; n: number } | null
  top_category: { name: string; n: number } | null
  news: { title: string; sub: string; url: string; source: string }[]
}
/** A worker who chose to be found: shortened name, no phone. */
export interface FoundWorker {
  user_id: string; name: string; city: string | null; birth_year: number | null; experience: Experience[]; availability: Availability[]
  avatar_path: string | null; shifts_done: number; avg_stars: number | null; ratings: number
}
export interface WorkerSearch { city?: string; exp?: string; when?: string }

export interface BankAccount { bank_name: string; account_no: string; holder_name: string }

export interface AdminDispute {
  application_id: string; job_title: string; employer_name: string; seeker_name: string; employer_phone: string | null; seeker_phone: string | null
  amount: number | null; fee: number | null; reason: string | null; attendance: Attendance | null; funding_mode: string | null
  start_date: string; end_date: string; completed_at: string | null
}

export interface AdminPayout {
  id: string; application_id: string; seeker_name: string; amount: number; mode: 'test' | 'live'; status: 'pending' | 'paid'; reference: string | null
  created_at: string; paid_at: string | null; bank_name: string | null; account_no: string | null; holder_name: string | null
}

export interface AdminFlag { kind: 'repeat_pair' | 'new_accounts'; employer_name: string; seeker_name: string; shifts: number; total: number; last_at: string }

export interface AdminStats {
  employers: number; seekers: number; new_users_today: number; new_users_7d: number
  open_jobs: number; jobs_7d: number; applications_today: number; applications_7d: number
  accepted_total: number; shifts_done: number; reviews_total: number; open_disputes: number
}

/** Sample shops and workers (profiles.is_sample): only admins can see them. */
export interface AdminSamples {
  shops: { id: string; name: string | null; owner: string; address: string | null; city: string | null; logo_path: string | null; jobs: number }[]
  workers: { id: string; name: string; city: string | null; birth_year: number | null; avatar_path: string | null; experience: string[] | null; availability: string[] | null; applications: number }[]
}

export interface AppConfig { payment_mode: 'off' | 'test' | 'live'; billing: 'on' | 'off'; google_login?: 'on' | 'off'; zalo_web_login?: 'on' | 'off'; zalo_published?: 'on' | 'off'; ai_assistant?: 'on' | 'off' }

export interface CompleteProfileInput { role: Role; full_name: string; phone: string; locale: Locale; business_name?: string; address?: string; city?: string; bio?: string }
export interface PendingProfile { email: string | null; name: string | null }

export interface Quote { amount: number; fee: number; net: number }

export interface ReceivedReview { id: string; stars: number; tags: string[]; comment: string | null; created_at: string; reviewer_role: Role }

export interface SignUpInput {
  phone: string
  password: string
  full_name: string
  role: Role
  locale: Locale
  bio?: string
  business_name?: string
  address?: string
  city?: string
}

export interface JobInput {
  title: string
  description: string
  category: Category
  pay_amount: number
  pay_unit: PayUnit
  start_date: string
  end_date: string
  shift_note: string
  address: string
  city: string
  lat: number | null
  lng: number | null
  slots: number
  is_urgent: boolean
}

export type ZaloLoginResult = { profile: Profile } | { ticket: string; phone: string }

export interface ProfileUpdate {
  logo_path?: string | null
  full_name?: string
  bio?: string | null
  business_name?: string | null
  address?: string | null
  city?: string | null
  locale?: Locale
  birth_year?: number | null
  experience?: Experience[]
  availability?: Availability[]
  avatar_path?: string | null
}


/** Error carrying a machine code mapped to a friendly message in errors.ts */
export class AppError extends Error {
  code: string
  constructor(code: string, detail?: string) {
    super(detail || code)
    this.code = code
  }
}

export type { Api } from './apiTypes'
