import { createClient, type PostgrestError } from '@supabase/supabase-js'
import { normalizePhone, phoneEmail } from './phone'
import {
  AppError, type AdminDispute, type AdminPayout, type Api, type Applicant, type BankAccount, type Escrow, type Job, type JobInput, type MyApplication, type MyJob,
  type Profile, type ProfileUpdate, type Reputation, type SignUpInput,
} from './types'

const URL = import.meta.env.VITE_SUPABASE_URL as string
const KEY = import.meta.env.VITE_SUPABASE_KEY as string

const sb = createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true } })

const JOB_COLS = '*, employer:profiles!jobs_employer_id_fkey(business_name, full_name)'
const KNOWN = ['FREE_PLAN_LIMIT', 'URGENT_REQUIRES_PRO', 'JOB_NOT_OPEN', 'SLOTS_BELOW_FILLED', 'FORBIDDEN',
  'ALREADY_DECIDED', 'JOB_FULL', 'NOT_FOUND', 'CANNOT_WITHDRAW', 'NOT_FUNDED', 'TOO_EARLY', 'ALREADY_FUNDED', 'ALREADY_SETTLED',
  'NOT_ACCEPTED', 'JOB_ENDED', 'PAYMENT_NOT_AVAILABLE', 'CANNOT_DISPUTE', 'NOT_COMPLETED', 'ALREADY_REVIEWED', 'REVIEW_WINDOW_CLOSED',
  'BAD_HOURS', 'BAD_STARS', 'BAD_TAGS', 'BAD_ATTENDANCE', 'BAD_BANK', 'BAD_OUTCOME', 'NOT_DISPUTED', 'PAYOUT_DONE', 'REFERENCE_REQUIRED']

function fail(e: PostgrestError | Error | null | undefined): never {
  const msg = e?.message ?? ''
  const known = KNOWN.find((k) => msg.includes(k))
  if (known) throw new AppError(known)
  if ('code' in (e ?? {}) && (e as PostgrestError).code === '23505') throw new AppError('ALREADY_APPLIED')
  if (/fetch|network/i.test(msg)) throw new AppError('NETWORK', msg)
  throw new AppError('UNKNOWN', msg)
}

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

async function phonesOf(userIds: string[]): Promise<Record<string, string>> {
  if (!userIds.length) return {}
  const { data } = await sb.from('contacts').select('user_id, phone').in('user_id', userIds)
  return Object.fromEntries((data ?? []).map((r) => [r.user_id, r.phone]))
}

const ESCROW_COLS = 'pay_status, escrow_amount, platform_fee, attendance, funding_mode'

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
const toEscrow = (r: any, reviewed: boolean): Escrow => ({
  pay_status: r.pay_status, attendance: r.attendance, funding_mode: r.funding_mode, reviewed,
  escrow_amount: r.escrow_amount == null ? null : Number(r.escrow_amount),
  platform_fee: r.platform_fee == null ? null : Number(r.platform_fee),
})

export const supabaseApi: Api = {
  async me() {
    const { data } = await sb.auth.getSession()
    if (!data.session) return null
    return loadProfile(data.session.user.id)
  },

  async signUp(input: SignUpInput) {
    const digits = normalizePhone(input.phone)
    if (!digits) throw new AppError('INVALID_PHONE')
    let res: Response
    try {
      res = await fetch(`${URL}/functions/v1/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: KEY, Authorization: `Bearer ${KEY}` },
        body: JSON.stringify({ ...input, phone: digits }),
      })
    } catch (e) {
      throw new AppError('NETWORK', String(e))
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new AppError(body.error || 'SIGNUP_FAILED')
    }
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
    const p = await loadProfile(data.user.id)
    if (!p) throw new AppError('NO_PROFILE')
    return p
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
    const [phones, done, payouts] = await Promise.all([phonesOf(accepted), reviewedSet(rows.map((r) => r.id), id), payoutsOf(rows.map((r) => r.id))])
    return rows.map((r): MyApplication => ({
      id: r.id, status: r.status, message: r.message, created_at: r.created_at, ...toEscrow(r, done.has(r.id)), payout: payouts[r.id] ?? null,
      job: toJob(r.job), employer_phone: r.status === 'accepted' ? phones[r.job.employer_id] ?? null : null,
    }))
  },

  async withdraw(applicationId) {
    const { error } = await sb.rpc('withdraw_application', { p_application: applicationId })
    if (error) fail(error)
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
      .select(`id, status, message, created_at, seeker_id, ${ESCROW_COLS}, seeker:profiles!applications_seeker_id_fkey(full_name, bio)`)
      .eq('job_id', jobId).neq('status', 'withdrawn').order('created_at', { ascending: true })
    if (error) fail(error)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (data ?? []) as any[]
    const me = await uid()
    const [phones, done] = await Promise.all([phonesOf(rows.filter((r) => r.status === 'accepted').map((r) => r.seeker_id)), reviewedSet(rows.map((r) => r.id), me)])
    sb.rpc('mark_applications_seen', { p_job: jobId }).then(() => undefined)
    return rows.map((r): Applicant => ({
      id: r.id, status: r.status, message: r.message, created_at: r.created_at, seeker_id: r.seeker_id, ...toEscrow(r, done.has(r.id)),
      full_name: r.seeker?.full_name ?? '—', bio: r.seeker?.bio ?? null, phone: phones[r.seeker_id] ?? null,
    }))
  },

  async decide(applicationId, decision) {
    const { error } = await sb.rpc('decide_application', { p_application: applicationId, p_decision: decision })
    if (error) fail(error)
    if (decision !== 'accepted') return { phone: null }
    const { data } = await sb.from('applications').select('seeker_id').eq('id', applicationId).single()
    const phones = await phonesOf(data ? [data.seeker_id] : [])
    return { phone: data ? phones[data.seeker_id] ?? null : null }
  },

  async updateProfile(patch: ProfileUpdate) {
    const id = await uid()
    const { error } = await sb.from('profiles').update(patch).eq('id', id)
    if (error) fail(error)
    const p = await loadProfile(id)
    if (!p) throw new AppError('NO_PROFILE')
    return p
  },

  async paymentMode() {
    const { data } = await sb.rpc('payment_mode')
    return data === 'live' ? 'live' : 'test'
  },

  async quote(applicationId, hours) {
    const { data, error } = await sb.rpc('quote_application', { p_application: applicationId, p_hours: hours ?? null })
    if (error) fail(error)
    return data as { amount: number; fee: number; net: number }
  },

  async fund(applicationId, hours) {
    const { error } = await sb.rpc('fund_application', { p_application: applicationId, p_hours: hours ?? null })
    if (error) fail(error)
  },

  async completeShift(applicationId, attendance) {
    const { error } = await sb.rpc('complete_shift', { p_application: applicationId, p_attendance: attendance })
    if (error) fail(error)
  },

  async respondNoshow(applicationId, accept) {
    const { error } = await sb.rpc('respond_noshow', { p_application: applicationId, p_accept: accept })
    if (error) fail(error)
  },

  async openDispute(applicationId, reason) {
    const { error } = await sb.rpc('open_dispute', { p_application: applicationId, p_reason: reason })
    if (error) fail(error)
  },

  async submitReview(applicationId, stars, tags, comment) {
    const { error } = await sb.rpc('submit_review', { p_application: applicationId, p_stars: stars, p_tags: tags, p_comment: comment })
    if (error) fail(error)
  },

  async reputations(userIds) {
    const ids = [...new Set(userIds)].filter(Boolean)
    if (!ids.length) return {}
    const { data, error } = await sb.rpc('reputations', { p_users: ids })
    if (error) fail(error)
    return Object.fromEntries(((data ?? []) as Reputation[]).map((r) => [r.user_id, { ...r, avg_stars: r.avg_stars == null ? null : Number(r.avg_stars) }]))
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
    const { error } = await sb.rpc('save_bank_account', { p_bank: b.bank_name, p_account: b.account_no, p_holder: b.holder_name })
    if (error) fail(error)
  },

  async adminDisputes() {
    const { data, error } = await sb.rpc('admin_disputes')
    if (error) fail(error)
    return ((data ?? []) as AdminDispute[]).map((d) => ({ ...d, amount: d.amount == null ? null : Number(d.amount), fee: d.fee == null ? null : Number(d.fee) }))
  },

  async resolveDispute(applicationId, outcome, note) {
    const { error } = await sb.rpc('resolve_dispute', { p_application: applicationId, p_outcome: outcome, p_note: note })
    if (error) fail(error)
  },

  async adminPayouts() {
    const { data, error } = await sb.rpc('admin_payouts')
    if (error) fail(error)
    return ((data ?? []) as AdminPayout[]).map((p) => ({ ...p, amount: Number(p.amount) }))
  },

  async markPayoutPaid(payoutId, reference) {
    const { error } = await sb.rpc('mark_payout_paid', { p_payout: payoutId, p_reference: reference })
    if (error) fail(error)
  },

  async sweep() {
    await sb.rpc('sweep_overdue')
  },
}
