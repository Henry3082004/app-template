export type Role = 'seeker' | 'employer'
export type Plan = 'free' | 'pro'
export type PayUnit = 'hour' | 'day' | 'shift' | 'job'
export type JobStatus = 'open' | 'closed'
export type AppStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn'
export type PayStatus = 'none' | 'held' | 'released' | 'refunded' | 'noshow_reported' | 'disputed'
export type Attendance = 'ok' | 'late' | 'noshow'
export type Category = 'service' | 'warehouse' | 'event' | 'farm' | 'retail' | 'other'
export type Locale = 'vi' | 'en'

export interface Profile {
  id: string
  role: Role
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

export interface Applicant extends Escrow {
  id: string
  status: AppStatus
  message: string | null
  created_at: string
  seeker_id: string
  full_name: string
  bio: string | null
  phone: string | null
}

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

export interface AppConfig { payment_mode: 'off' | 'test' | 'live'; billing: 'on' | 'off'; google_login?: 'on' | 'off'; zalo_web_login?: 'on' | 'off'; zalo_published?: 'on' | 'off' }

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
  full_name?: string
  bio?: string | null
  business_name?: string | null
  address?: string | null
  city?: string | null
  locale?: Locale
}

export interface Api {
  me(): Promise<Profile | null>
  signUp(input: SignUpInput): Promise<Profile>
  signIn(phone: string, password: string): Promise<Profile>
  /** Zalo Mini App: exchange Zalo's tokens for a session, or (new user) a signup ticket */
  zaloLogin(creds: { access_token: string; phone_token: string }): Promise<ZaloLoginResult>
  zaloSignUp(ticket: string, input: Omit<SignUpInput, 'phone' | 'password'>): Promise<Profile>
  /** International users: Google sign-in (leaves the page; the session is there when it comes back) */
  signInWithGoogle(): Promise<void>
  /** Signed in with Google but no profile yet → we still need role, name and phone */
  pendingProfile(): Promise<PendingProfile | null>
  completeProfile(input: CompleteProfileInput): Promise<Profile>
  signOut(): Promise<void>
  listOpenJobs(): Promise<Job[]>
  getJob(id: string): Promise<Job | null>
  /** jobId → status of my application (seekers only; empty when signed out) */
  myApplicationStatus(): Promise<Record<string, AppStatus>>
  apply(jobId: string, message: string): Promise<void>
  myApplications(): Promise<MyApplication[]>
  withdraw(applicationId: string): Promise<void>
  myJobs(): Promise<MyJob[]>
  createJob(input: JobInput): Promise<Job>
  setJobStatus(jobId: string, status: JobStatus): Promise<void>
  applicantsFor(jobId: string): Promise<Applicant[]>
  decide(applicationId: string, decision: 'accepted' | 'rejected'): Promise<{ phone: string | null }>
  updateProfile(patch: ProfileUpdate): Promise<Profile>
  /** payment_mode: off = free (no deposit step) · test = deposit simulated · live = real money (not built yet) */
  appConfig(): Promise<AppConfig>
  quote(applicationId: string, hours?: number): Promise<Quote>
  fund(applicationId: string, hours?: number): Promise<void>
  completeShift(applicationId: string, attendance: Attendance): Promise<void>
  respondNoshow(applicationId: string, accept: boolean): Promise<void>
  openDispute(applicationId: string, reason: string): Promise<void>
  submitReview(applicationId: string, stars: number, tags: string[], comment: string): Promise<void>
  reputations(userIds: string[]): Promise<Record<string, Reputation>>
  receivedReviews(): Promise<ReceivedReview[]>
  myBank(): Promise<BankAccount | null>
  saveBank(b: BankAccount): Promise<void>
  /** admin only (enforced by the database) */
  adminDisputes(): Promise<AdminDispute[]>
  resolveDispute(applicationId: string, outcome: 'release' | 'refund', note: string): Promise<void>
  adminPayouts(): Promise<AdminPayout[]>
  markPayoutPaid(payoutId: string, reference: string): Promise<void>
  adminFlags(): Promise<AdminFlag[]>
  adminStats(): Promise<AdminStats>
  /** finished shifts (last 30 days) I still have to review */
  pendingReviews(): Promise<number>
  /** settle overdue shifts for the signed-in user (also done hourly on the server) */
  sweep(): Promise<void>
}

/** Error carrying a machine code mapped to a friendly message in errors.ts */
export class AppError extends Error {
  code: string
  constructor(code: string, detail?: string) {
    super(detail || code)
    this.code = code
  }
}
