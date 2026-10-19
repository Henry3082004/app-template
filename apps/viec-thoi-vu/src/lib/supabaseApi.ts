import { createClient, type PostgrestError } from '@supabase/supabase-js'
import { normalizePhone, phoneEmail } from './phone'
import {
  AppError, type AdminDispute, type AdminFlag, type AdminPayout, type AdminStats, type Api, type AppConfig, type Applicant, type BankAccount, type Escrow, type Job, type JobInput, type MyApplication, type MyJob,
  type Profile, type ProfileUpdate, type Reputation, type SignUpInput,
} from './types'

const URL = import.meta.env.VITE_SUPABASE_URL as string
const KEY = import.meta.env.VITE_SUPABASE_KEY as string

const sb = createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true } })

const JOB_COLS = '*, employer:profiles!jobs_employer_id_fkey(business_name, full_name)'
const KNOWN = ['FREE_PLAN_LIMIT', 'URGENT_REQUIRES_PRO', 'JOB_NOT_OPEN', 'SLOTS_BELOW_FILLED', 'FORBIDDEN',
  'ALREADY_DECIDED', 'JOB_FULL', 'NOT_FOUND', 'CANNOT_WITHDRAW', 'NOT_FUNDED', 'TOO_EARLY', 'ALREADY_FUNDED', 'ALREADY_SETTLED',
  'NOT_ACCEPTED', 'JOB_ENDED', 'PAYMENT_NOT_AVAILABLE', 'CANNOT_DISPUTE', 'NOT_COMPLETED', 'ALREADY_REVIEWED', 'REVIEW_WINDOW_CLOSED',
  'BAD_PHONE', 'PROFILE_EXISTS', 'INVALID_ROLE', 'NAME_REQUIRED', 'BAD_HOURS', 'BAD_STARS', 'BAD_TAGS', 'BAD_ATTENDANCE', 'BAD_BANK', 'BAD_OUTCOME', 'NOT_DISPUTED', 'PAYOUT_DONE', 'REFERENCE_REQUIRED']

function fail(e: PostgrestError | Error | null | undefined): never {
  const msg = e?.message ?? ''
  const known = KNOWN.find((k) => msg.includes(k))
  if (known) throw new AppError(known)
  if ('code' in (e ?? {}) && (e as PostgrestError).code === '23505') throw new AppError('ALREADY_APPLIED')
  if (/fetch|network/i.test(msg)) throw new AppError('NETWORK', msg)
  throw new AppError('UNKNOWN', msg)
}

/** Calls a database function (every state change goes through one); database errors become AppErrors. */
async function rpc(fn: string, args?: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await sb.rpc(fn, args)
  if (error) fail(error)
  return data
}

const num = (v: unknown): number | null => (v == null ? null : Number(v))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toJob(r: any): Job {
  const { employer, ...rest } = r
  return { ...rest, pay_amount: Number(r.pay_amount), business_name: employer?.business_name || employer?.full_name || null }
}

async function uid(): Promise<string> {
  const { data } = await sb.auth.getSession()
  const id = data.session?.user.id
  if (!id) throw new AppError('NOT_SIGNED_IN')
  return id
}

async function loadProfile(id: string): Promise<Profile | null> {
  const [{ data: p, error }, { data: c }] = await Promise.all([
    sb.from('profiles').select('*').eq('id', id).maybeSingle(),
    sb.from('contacts').select('phone').eq('user_id', id).maybeSingle(),
  ])
  if (error) fail(error)
  if (!p) return null
  return { ...(p as Omit<Profile, 'phone'>), phone: c?.phone ?? null }
}

async function requireProfile(id: string): Promise<Profile> {
  const p = await loadProfile(id)
  if (!p) throw new AppError('NO_PROFILE')
  return p
}

async function phonesOf(userIds: string[]): Promise<Record<string, string>> {
  if (!userIds.length) return {}
  const { data } = await sb.from('contacts').select('user_id, phone').in('user_id', userIds)
  return Object.fromEntries((data ?? []).map((r) => [r.user_id, r.phone]))
}

const ESCROW_COLS = 'pay_status, escrow_amount, platform_fee, attendance, funding_mode'

/** Shifts where the other side already reviewed (content stays hidden until I review). */
async function otherReviewed(appIds: string[]): Promise<Set<string>> {
  if (!appIds.length) return new Set()
  const { data } = await sb.rpc('review_flags', { p_apps: appIds })
  return new Set(((data ?? []) as { application_id: string; other_reviewed: boolean }[]).filter((r) => r.other_reviewed).map((r) => r.application_id))
}

/** Which of these applications did the signed-in user already review? */
async function reviewedSet(appIds: string[], me: string): Promise<Set<string>> {
  if (!appIds.length) return new Set()
  const { data } = await sb.from('reviews').select('application_id').eq('reviewer_id', me).in('application_id', appIds)
  return new Set((data ?? []).map((r) => r.application_id))
}

/** My payout rows (RLS: workers only ever see their own). Never blocks the list if it fails. */
async function payoutsOf(appIds: string[]): Promise<Record<string, { status: 'pending' | 'paid'; reference: string | null }>> {
  if (!appIds.length) return {}
  const { data } = await sb.from('payouts').select('application_id, status, reference').in('application_id', appIds)
  return Object.fromEntries((data ?? []).map((r) => [r.application_id, { status: r.status, reference: r.reference }]))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toEscrow = (r: any, reviewed: boolean, other: boolean): Escrow => ({
  pay_status: r.pay_status, attendance: r.attendance, funding_mode: r.funding_mode, reviewed, other_reviewed: other,
  escrow_amount: num(r.escrow_amount),
  platform_fee: num(r.platform_fee),
})

/** POSTs to one of our Edge Functions; a non-2xx answer becomes an AppError with the function's error code. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callFunction(name: string, payload: Record<string, unknown>, fallback: string): Promise<any> {
  let res: Response
  try {
    res = await fetch(`${URL}/functions/v1/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: KEY, Authorization: `Bearer ${KEY}` },
      body: JSON.stringify(payload),
    })
  } catch (e) {
    throw new AppError('NETWORK', String(e))
  }
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new AppError(body.error || fallback)
  return body
}

/** The function returns a one-time token hash; exchanging it gives a normal Supabase session. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sessionFromHash(body: any): Promise<Profile> {
  const { data, error } = await sb.auth.verifyOtp({ token_hash: String(body.token_hash), type: 'magiclink' })
  if (error || !data.user) throw new AppError('LOGIN_FAILED', error?.message)
  return requireProfile(data.user.id)
}

export const supabaseApi: Api = {
  async me() {
    const { data } = await sb.auth.getSession()
    if (!data.session) return null
    return loadProfile(data.session.user.id)
  },

  async signUp(input: SignUpInput) {
    const digits = normalizePhone(input.phone)
    if (!digits) throw new AppError('INVALID_PHONE')
    await callFunction('signup', { ...input, phone: digits }, 'SIGNUP_FAILED')
    return this.signIn(digits, input.password)
  },

  async signIn(phone, password) {
    const digits = normalizePhone(phone)
    if (!digits) throw new AppError('INVALID_PHONE')
    const { data, error } = await sb.auth.signInWithPassword({ email: phoneEmail(digits), password })
    if (error || !data.user) {
      if (error && /invalid login/i.test(error.message)) throw new AppError('INVALID_LOGIN')
      fail(error)
    }
    return requireProfile(data.user.id)
  },

  async signInWithGoogle() {
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/app`, queryParams: { prompt: 'select_account' } },
    })
    if (error) fail(error)
  },

  async pendingProfile() {
    const { data } = await sb.auth.getSession()
    const u = data.session?.user
    if (!u) return null
    const p = await loadProfile(u.id)
    if (p) return null
    const meta = (u.user_metadata ?? {}) as Record<string, unknown>
    return { email: u.email ?? null, name: String(meta.full_name ?? meta.name ?? '') || null }
  },

  async completeProfile(i) {
    await rpc('complete_profile', {
      p_role: i.role, p_full_name: i.full_name, p_phone: i.phone, p_bio: i.bio ?? null,
      p_business: i.business_name ?? null, p_address: i.address ?? null, p_city: i.city ?? null, p_locale: i.locale,
    })
    return requireProfile(await uid())
  },

  async zaloLogin(creds) {
    const body = await callFunction('zalo-login', { ...creds }, 'LOGIN_FAILED')
    if (body.needs_signup) return { ticket: String(body.ticket), phone: String(body.phone) }
    return { profile: await sessionFromHash(body) }
  },

  async zaloSignUp(ticket, input) {
    return sessionFromHash(await callFunction('zalo-login', { ...input, ticket }, 'LOGIN_FAILED'))
  },

  async signOut() {
    await sb.auth.signOut()
  },

  async listOpenJobs() {
    const { data, error } = await sb.from('jobs').select(JOB_COLS).eq('status', 'open')
      .order('is_urgent', { ascending: false }).order('created_at', { ascending: false }).limit(200)
    if (error) fail(error)
    return (data ?? []).map(toJob)
  },

  async getJob(id) {
    const { data, error } = await sb.from('jobs').select(JOB_COLS).eq('id', id).maybeSingle()
    if (error) fail(error)
    return data ? toJob(data) : null
  },

  async myApplicationStatus() {
    const { data } = await sb.auth.getSession()
    if (!data.session) return {}
    const { data: rows } = await sb.from('applications').select('job_id, status').eq('seeker_id', data.session.user.id)
    return Object.fromEntries((rows ?? []).map((r) => [r.job_id, r.status]))
  },

  async apply(jobId, message) {
    const id = await uid()
    // A withdrawn application blocks re-applying (unique job+seeker); treat it as "already applied".
    const { error } = await sb.from('applications').insert({ job_id: jobId, seeker_id: id, message: message.trim() || null })
    if (error) fail(error)
  },

  async myApplications() {
    const id = await uid()
    const { data, error } = await sb.from('applications')
      .select(`id, status, message, created_at, ${ESCROW_COLS}, job:jobs(${JOB_COLS})`)
      .eq('seeker_id', id).order('created_at', { ascending: false })
    if (error) fail(error)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (data ?? []).filter((r: any) => r.job) as any[]
    const accepted = rows.filter((r) => r.status === 'accepted').map((r) => r.job.employer_id)
    // The database only returns an employer's phone once the money for that shift is held.
    const ids = rows.map((r) => r.id)
    const [phones, done, payouts, other] = await Promise.all([phonesOf(accepted), reviewedSet(ids, id), payoutsOf(ids), otherReviewed(ids)])
    return rows.map((r): MyApplication => ({
      id: r.id, status: r.status, message: r.message, created_at: r.created_at, ...toEscrow(r, done.has(r.id), other.has(r.id)), payout: payouts[r.id] ?? null,
      job: toJob(r.job), employer_phone: r.status === 'accepted' ? phones[r.job.employer_id] ?? null : null,
    }))
  },

  async withdraw(applicationId) {
    await rpc('withdraw_application', { p_application: applicationId })
  },

  async myJobs() {
    const id = await uid()
    const { data, error } = await sb.from('jobs').select(`${JOB_COLS}, applications(id, status, seen_by_employer)`)
      .eq('employer_id', id).order('created_at', { ascending: false })
    if (error) fail(error)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((r: any): MyJob => {
      const apps = (r.applications ?? []).filter((a: { status: string }) => a.status !== 'withdrawn')
      const { applications: _a, ...job } = r
      return {
        ...toJob(job),
        applicants: apps.length,
        newApplicants: apps.filter((a: { seen_by_employer: boolean; status: string }) => !a.seen_by_employer && a.status === 'pending').length,
      }
    })
  },

  async createJob(input: JobInput) {
    const id = await uid()
    const { data, error } = await sb.from('jobs').insert({ ...input, employer_id: id }).select(JOB_COLS).single()
    if (error) fail(error)
    return toJob(data)
  },

  async setJobStatus(jobId, status) {
    const { error } = await sb.from('jobs').update({ status }).eq('id', jobId)
    if (error) fail(error)
  },

  async applicantsFor(jobId) {
    const { data, error } = await sb.from('applications')
      .select(`id, status, message, created_at, seeker_id, ${ESCROW_COLS}, seeker:profiles!applications_seeker_id_fkey(full_name, bio, birth_year, experience, availability, avatar_path)`)
      .eq('job_id', jobId).neq('status', 'withdrawn').order('created_at', { ascending: true })
    if (error) fail(error)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (data ?? []) as any[]
    const me = await uid()
    const ids = rows.map((r) => r.id)
    const [phones, done, other] = await Promise.all([phonesOf(rows.filter((r) => r.status === 'accepted').map((r) => r.seeker_id)), reviewedSet(ids, me), otherReviewed(ids)])
    sb.rpc('mark_applications_seen', { p_job: jobId }).then(() => undefined)
    return rows.map((r): Applicant => ({
      id: r.id, status: r.status, message: r.message, created_at: r.created_at, seeker_id: r.seeker_id, ...toEscrow(r, done.has(r.id), other.has(r.id)),
      full_name: r.seeker?.full_name ?? '—', bio: r.seeker?.bio ?? null, phone: phones[r.seeker_id] ?? null,
      birth_year: r.seeker?.birth_year ?? null, experience: r.seeker?.experience ?? [], availability: r.seeker?.availability ?? [], avatar_path: r.seeker?.avatar_path ?? null,
    }))
  },

  async decide(applicationId, decision) {
    await rpc('decide_application', { p_application: applicationId, p_decision: decision })
    if (decision !== 'accepted') return { phone: null }
    const { data } = await sb.from('applications').select('seeker_id').eq('id', applicationId).single()
    const phones = await phonesOf(data ? [data.seeker_id] : [])
    return { phone: data ? phones[data.seeker_id] ?? null : null }
  },

  async updateProfile(patch: ProfileUpdate) {
    const id = await uid()
    const { error } = await sb.from('profiles').update(patch).eq('id', id)
    if (error) fail(error)
    return requireProfile(id)
  },

  async uploadAvatar(photo) {
    const path = `${await uid()}/${Date.now().toString(36)}.jpg`
    const { error } = await sb.storage.from('avatars').upload(path, photo, { contentType: 'image/jpeg' })
    if (error) throw new AppError(/fetch|network/i.test(error.message) ? 'NETWORK' : 'PHOTO_FAILED', error.message)
    return path
  },

  async appConfig() {
    return (await rpc('app_config')) as AppConfig
  },

  async quote(applicationId, hours) {
    return (await rpc('quote_application', { p_application: applicationId, p_hours: hours ?? null })) as { amount: number; fee: number; net: number }
  },

  async fund(applicationId, hours) {
    await rpc('fund_application', { p_application: applicationId, p_hours: hours ?? null })
  },

  async completeShift(applicationId, attendance) {
    await rpc('complete_shift', { p_application: applicationId, p_attendance: attendance })
  },

  async respondNoshow(applicationId, accept) {
    await rpc('respond_noshow', { p_application: applicationId, p_accept: accept })
  },

  async openDispute(applicationId, reason) {
    await rpc('open_dispute', { p_application: applicationId, p_reason: reason })
  },

  async submitReview(applicationId, stars, tags, comment) {
    await rpc('submit_review', { p_application: applicationId, p_stars: stars, p_tags: tags, p_comment: comment })
  },

  async reputations(userIds) {
    const ids = [...new Set(userIds)].filter(Boolean)
    if (!ids.length) return {}
    const data = await rpc('reputations', { p_users: ids })
    return Object.fromEntries(((data ?? []) as Reputation[]).map((r) => [r.user_id, { ...r, avg_stars: num(r.avg_stars) }]))
  },

  async receivedReviews() {
    const id = await uid()
    const { data, error } = await sb.from('reviews').select('id, stars, tags, comment, created_at, reviewer_role')
      .eq('reviewee_id', id).order('created_at', { ascending: false }).limit(20)
    if (error) fail(error)
    return data ?? []
  },

  async myBank() {
    const id = await uid()
    const { data, error } = await sb.from('bank_accounts').select('bank_name, account_no, holder_name').eq('user_id', id).maybeSingle()
    if (error) fail(error)
    return data as BankAccount | null
  },

  async saveBank(b) {
    await rpc('save_bank_account', { p_bank: b.bank_name, p_account: b.account_no, p_holder: b.holder_name })
  },

  async adminDisputes() {
    const data = await rpc('admin_disputes')
    return ((data ?? []) as AdminDispute[]).map((d) => ({ ...d, amount: num(d.amount), fee: num(d.fee) }))
  },

  async resolveDispute(applicationId, outcome, note) {
    await rpc('resolve_dispute', { p_application: applicationId, p_outcome: outcome, p_note: note })
  },

  async adminPayouts() {
    const data = await rpc('admin_payouts')
    return ((data ?? []) as AdminPayout[]).map((p) => ({ ...p, amount: Number(p.amount) }))
  },

  async markPayoutPaid(payoutId, reference) {
    await rpc('mark_payout_paid', { p_payout: payoutId, p_reference: reference })
  },

  async adminFlags() {
    const data = await rpc('admin_flags')
    return ((data ?? []) as AdminFlag[]).map((f) => ({ ...f, total: Number(f.total) }))
  },

  async adminStats() {
    return (await rpc('admin_stats')) as AdminStats
  },

  async pendingReviews() {
    const { data, error } = await sb.rpc('my_pending_reviews')
    if (error) return 0
    return Number(data ?? 0)
  },

  async sweep() {
    await sb.rpc('sweep_overdue')
  },
}
