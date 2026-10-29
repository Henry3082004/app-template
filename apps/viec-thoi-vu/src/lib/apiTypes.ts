// The contract every backend (Supabase or the in-memory mock) implements.
import type { Highlights, Role, JobStatus, AppStatus, Attendance, Profile, Job, MyApplication, MyJob, Applicant, Hire, Reputation, AppNotification, ChatMessage, ReportReason, AdminReport, DeletionRequest, AdminDeletion, SentInvite, FoundWorker, WorkerSearch, BankAccount, AdminDispute, AdminPayout, AdminFlag, AdminStats, AdminSamples, AppConfig, CompleteProfileInput, PendingProfile, Quote, ReceivedReview, SignUpInput, JobInput, ZaloLoginResult, ProfileUpdate } from './types'
import type { QuizAnswers } from './quiz'

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
  /** "Việc đã lưu" of the signed-in person (newest first) */
  savedJobIds(): Promise<string[]>
  saveJobs(jobIds: string[]): Promise<void>
  unsaveJob(jobId: string): Promise<void>
  /** the jobs with these ids that I may see (open ones, or ones I applied to) */
  jobsByIds(ids: string[]): Promise<Job[]>
  /** counts + news for the home banner (anyone can read) */
  homeHighlights(): Promise<Highlights>
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
