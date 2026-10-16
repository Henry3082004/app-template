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
}

export interface MyApplication extends Escrow {
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
  noshow: number
  late: number
  ratings: number
  avg_stars: number | null
  top_tags: string[]
}

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
  /** 'test' = nothing is charged; 'live' = real payments (not available yet) */
  paymentMode(): Promise<'test' | 'live'>
  quote(applicationId: string, hours?: number): Promise<Quote>
  fund(applicationId: string, hours?: number): Promise<void>
  completeShift(applicationId: string, attendance: Attendance): Promise<void>
  respondNoshow(applicationId: string, accept: boolean): Promise<void>
  openDispute(applicationId: string, reason: string): Promise<void>
  submitReview(applicationId: string, stars: number, tags: string[], comment: string): Promise<void>
  reputations(userIds: string[]): Promise<Record<string, Reputation>>
  receivedReviews(): Promise<ReceivedReview[]>
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
