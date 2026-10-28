import { createClient, type PostgrestError } from '@supabase/supabase-js'
import { AppError, type Escrow, type Job, type Profile } from '../types'

export const URL = import.meta.env.VITE_SUPABASE_URL as string
export const KEY = import.meta.env.VITE_SUPABASE_KEY as string

export const sb = createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true } })

export const JOB_COLS = '*, employer:profiles!jobs_employer_id_fkey(business_name, full_name, logo_path)'
export const KNOWN = ['FREE_PLAN_LIMIT', 'URGENT_REQUIRES_PRO', 'JOB_NOT_OPEN', 'SLOTS_BELOW_FILLED', 'FORBIDDEN',
  'ALREADY_DECIDED', 'JOB_FULL', 'NOT_FOUND', 'CANNOT_WITHDRAW', 'NOT_FUNDED', 'TOO_EARLY', 'ALREADY_FUNDED', 'ALREADY_SETTLED',
  'NOT_ACCEPTED', 'JOB_ENDED', 'PAYMENT_NOT_AVAILABLE', 'CANNOT_DISPUTE', 'NOT_COMPLETED', 'ALREADY_REVIEWED', 'REVIEW_WINDOW_CLOSED',
  'BAD_PHONE', 'PROFILE_EXISTS', 'INVALID_ROLE', 'NAME_REQUIRED', 'BAD_HOURS', 'BAD_STARS', 'BAD_TAGS', 'BAD_ATTENDANCE', 'BAD_BANK', 'BAD_OUTCOME', 'NOT_DISPUTED', 'PAYOUT_DONE', 'REFERENCE_REQUIRED', 'ROLE_EXISTS', 'BUSINESS_REQUIRED', 'ROLE_NOT_OWNED',
  'ALREADY_CHECKED_IN', 'NOT_CHECKED_IN', 'ALREADY_CHECKED_OUT', 'BAD_LOCATION', 'NOT_CASH',
  'BAD_MESSAGE', 'TOO_MANY', 'BAD_REASON', 'NOT_A_REGULAR', 'ALREADY_APPLIED']

export function fail(e: PostgrestError | Error | null | undefined): never {
  const msg = e?.message ?? ''
  const known = KNOWN.find((k) => msg.includes(k))
  if (known) throw new AppError(known)
  if ('code' in (e ?? {}) && (e as PostgrestError).code === '23505') throw new AppError('ALREADY_APPLIED')
  if (/fetch|network/i.test(msg)) throw new AppError('NETWORK', msg)
  throw new AppError('UNKNOWN', msg)
}

/** Calls a database function (every state change goes through one); database errors become AppErrors. */
export async function rpc(fn: string, args?: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await sb.rpc(fn, args)
  if (error) fail(error)
  return data
}

export const num = (v: unknown): number | null => (v == null ? null : Number(v))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toJob(r: any): Job {
  const { employer, ...rest } = r
  return { ...rest, pay_amount: Number(r.pay_amount), business_name: employer?.business_name || employer?.full_name || null, business_logo: employer?.logo_path ?? null }
}

export async function uid(): Promise<string> {
  const { data } = await sb.auth.getSession()
  const id = data.session?.user.id
  if (!id) throw new AppError('NOT_SIGNED_IN')
  return id
}

export const WORKER_COLS = 'bio, birth_year, experience, availability, avatar_path'
export const WORKER_KEYS = ['bio', 'birth_year', 'experience', 'availability', 'avatar_path'] as const
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const toWorker = (w: any) => ({
  bio: w?.bio ?? null, birth_year: w?.birth_year ?? null, experience: w?.experience ?? [], availability: w?.availability ?? [], avatar_path: w?.avatar_path ?? null,
})

/** Profile = public account row + phone + the worker details (own table, private to businesses the worker applied to). */
export async function loadProfile(id: string): Promise<Profile | null> {
  const [{ data: p, error }, { data: c }, { data: w }] = await Promise.all([
    sb.from('profiles').select('*').eq('id', id).maybeSingle(),
    sb.from('contacts').select('phone').eq('user_id', id).maybeSingle(),
    sb.from('worker_profiles').select(WORKER_COLS).eq('user_id', id).maybeSingle(),
  ])
  if (error) fail(error)
  if (!p) return null
  return { ...(p as Omit<Profile, 'phone'>), ...toWorker(w), phone: c?.phone ?? null }
}

export async function requireProfile(id: string): Promise<Profile> {
  const p = await loadProfile(id)
  if (!p) throw new AppError('NO_PROFILE')
  return p
}

export async function phonesOf(userIds: string[]): Promise<Record<string, string>> {
  if (!userIds.length) return {}
  const { data } = await sb.from('contacts').select('user_id, phone').in('user_id', userIds)
  return Object.fromEntries((data ?? []).map((r) => [r.user_id, r.phone]))
}

export const ESCROW_COLS = 'pay_status, escrow_amount, platform_fee, attendance, funding_mode, paid_cash_at, cash_received_at, checked_in_at, checkin_distance_m, checked_out_at'

/** Shifts where the other side already reviewed (content stays hidden until I review). */
export async function otherReviewed(appIds: string[]): Promise<Set<string>> {
  if (!appIds.length) return new Set()
  const { data } = await sb.rpc('review_flags', { p_apps: appIds })
  return new Set(((data ?? []) as { application_id: string; other_reviewed: boolean }[]).filter((r) => r.other_reviewed).map((r) => r.application_id))
}

/** Which of these applications did the signed-in user already review? */
export async function reviewedSet(appIds: string[], me: string): Promise<Set<string>> {
  if (!appIds.length) return new Set()
  const { data } = await sb.from('reviews').select('application_id').eq('reviewer_id', me).in('application_id', appIds)
  return new Set((data ?? []).map((r) => r.application_id))
}

/** My payout rows (RLS: workers only ever see their own). Never blocks the list if it fails. */
export async function payoutsOf(appIds: string[]): Promise<Record<string, { status: 'pending' | 'paid'; reference: string | null }>> {
  if (!appIds.length) return {}
  const { data } = await sb.from('payouts').select('application_id, status, reference').in('application_id', appIds)
  return Object.fromEntries((data ?? []).map((r) => [r.application_id, { status: r.status, reference: r.reference }]))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const toEscrow = (r: any, reviewed: boolean, other: boolean): Escrow => ({
  pay_status: r.pay_status, attendance: r.attendance, funding_mode: r.funding_mode, reviewed, other_reviewed: other,
  escrow_amount: num(r.escrow_amount),
  platform_fee: num(r.platform_fee),
  paid_cash_at: r.paid_cash_at ?? null,
  cash_received_at: r.cash_received_at ?? null,
  checked_in_at: r.checked_in_at ?? null,
  checkin_distance_m: r.checkin_distance_m ?? null,
  checked_out_at: r.checked_out_at ?? null,
})

/** POSTs to one of our Edge Functions; a non-2xx answer becomes an AppError with the function's error code. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function callFunction(name: string, payload: Record<string, unknown>, fallback: string): Promise<any> {
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
export async function sessionFromHash(body: any): Promise<Profile> {
  const { data, error } = await sb.auth.verifyOtp({ token_hash: String(body.token_hash), type: 'magiclink' })
  if (error || !data.user) throw new AppError('LOGIN_FAILED', error?.message)
  return requireProfile(data.user.id)
}
