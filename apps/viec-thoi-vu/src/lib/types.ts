import type { QuizAnswers } from './quiz'
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
  /** every application to my posts (not withdrawn), newest first — for the Ứng viên / Ca làm / Chi phí tabs */
  myHires(): Promise<Hire[]>
  /** free mode: record that I paid this worker in cash */
  markPaidCash(applicationId: string): Promise<void>
  decide(applicationId: string, decision: 'accepted' | 'rejected'): Promise<{ phone: string | null }>
  updateProfile(patch: ProfileUpdate): Promise<Profile>
  /** store a square profile photo; returns the path to save as avatar_path */
  uploadAvatar(photo: Blob): Promise<string>
  /** payment_mode: off = free (no deposit step) · test = deposit simulated · live = real money (not built yet) */
  appConfig(): Promise<AppConfig>
  quote(applicationId: string, hours?: number): Promise<Quote>
  fund(applicationId: string, hours?: number): Promise<void>
  completeShift(applicationId: string, attendance: Attendance): Promise<void>
  respondNoshow(applicationId: string, accept: boolean): Promise<void>
  openDispute(applicationId: string, reason: string): Promise<void>
  submitReview(applicationId: string, stars: number, tags: string[], comment: string): Promise<void>
  /** reputation on one side: as a worker ('seeker') or as a business ('employer') */
  reputations(userIds: string[], as: Role): Promise<Record<string, Reputation>>
  /** give this account its other role (a business needs a name and address) and switch to it */
  addRole(role: Role, business?: { business_name: string; address: string; city: string }): Promise<Profile>
  switchRole(role: Role): Promise<Profile>
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
  adminSamples(): Promise<AdminSamples>
  /** "Capy hỏi nhanh": answers kept per device, folded into the account once signed in */
  saveQuiz(device: string, answers: QuizAnswers): Promise<void>
  myQuiz(): Promise<QuizAnswers>
  /** in-app notifications of the signed-in user, newest first */
  notifications(): Promise<AppNotification[]>
  unreadCount(): Promise<number>
  /** no ids = mark them all */
  markNotificationsRead(ids?: string[]): Promise<void>
  /** the worker says "I'm here" (location is optional) and "I'm done"; later the cash they received */
  checkIn(applicationId: string, lat?: number, lng?: number): Promise<void>
  checkOut(applicationId: string): Promise<void>
  ackCashReceived(applicationId: string): Promise<void>
  /** chat of an accepted application (newest first); only the shop and that worker can read and write */
  messages(applicationId: string): Promise<ChatMessage[]>
  sendMessage(applicationId: string, body: string): Promise<void>
  /** report someone I dealt with (or the shop behind a post I am looking at); the admin reads it */
  report(target: string, reason: ReportReason, detail?: string, jobId?: string): Promise<void>
  adminReports(): Promise<AdminReport[]>
  resolveReport(id: string, note: string): Promise<void>
  /** ask for the account to be deleted (the admin does it by hand within 7 days) */
  myDeletionRequest(): Promise<DeletionRequest | null>
  requestDeletion(reason?: string): Promise<void>
  cancelDeletion(): Promise<void>
  adminDeletions(): Promise<AdminDeletion[]>
  resolveDeletion(id: string, note: string): Promise<void>
  /** invite a worker who already did a shift for me to one of my open posts */
  inviteWorker(jobId: string, workerId: string): Promise<void>
  mySentInvites(): Promise<SentInvite[]>
  /** shops: workers who switched "let shops find me" on */
  searchWorkers(f: WorkerSearch): Promise<FoundWorker[]>
  /** workers: appear in shops' search (default off) */
  myDiscoverable(): Promise<boolean>
  setDiscoverable(on: boolean): Promise<void>
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
