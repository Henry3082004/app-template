export type Role = 'seeker' | 'employer'
export type Plan = 'free' | 'pro'
export type PayUnit = 'hour' | 'day' | 'shift' | 'job'
export type JobStatus = 'open' | 'closed'
export type AppStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn'
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

export interface MyApplication {
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

export interface Applicant {
  id: string
  status: AppStatus
  message: string | null
  created_at: string
  seeker_id: string
  full_name: string
  bio: string | null
  phone: string | null
}

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
}

/** Error carrying a machine code mapped to a friendly message in errors.ts */
export class AppError extends Error {
  code: string
  constructor(code: string, detail?: string) {
    super(detail || code)
    this.code = code
  }
}
