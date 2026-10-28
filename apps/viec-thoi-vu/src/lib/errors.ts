import type { TKey } from './i18n'
import { AppError } from './types'

const CODES = ['NETWORK', 'INVALID_PHONE', 'WEAK_PASSWORD', 'NAME_REQUIRED', 'PHONE_TAKEN', 'INVALID_LOGIN', 'FREE_PLAN_LIMIT',
  'URGENT_REQUIRES_PRO', 'JOB_NOT_OPEN', 'ALREADY_APPLIED', 'JOB_FULL', 'ALREADY_DECIDED', 'CANNOT_WITHDRAW', 'FORBIDDEN',
  'NOT_SIGNED_IN', 'SLOTS_BELOW_FILLED',
  'NOT_FUNDED', 'TOO_EARLY', 'ALREADY_FUNDED', 'ALREADY_SETTLED', 'NOT_ACCEPTED', 'JOB_ENDED', 'PAYMENT_NOT_AVAILABLE', 'CANNOT_DISPUTE', 'NOT_COMPLETED', 'ALREADY_REVIEWED', 'REVIEW_WINDOW_CLOSED', 'BAD_HOURS', 'BAD_STARS', 'BAD_TAGS', 'BAD_ATTENDANCE',
  'BAD_PHONE', 'PROFILE_EXISTS', 'INVALID_ROLE', 'ZALO_DENIED', 'ZALO_VERIFY_FAILED', 'ZALO_NOT_CONFIGURED', 'TICKET_INVALID', 'ACCOUNT_DISABLED', 'LOGIN_FAILED',
  'BAD_BANK', 'BAD_OUTCOME', 'NOT_DISPUTED', 'PAYOUT_DONE', 'REFERENCE_REQUIRED', 'PHOTO_FAILED', 'ROLE_EXISTS', 'BUSINESS_REQUIRED', 'ROLE_NOT_OWNED',
  'ALREADY_CHECKED_IN', 'NOT_CHECKED_IN', 'ALREADY_CHECKED_OUT', 'BAD_LOCATION', 'NOT_CASH',
  'BAD_MESSAGE', 'TOO_MANY', 'BAD_REASON', 'NOT_A_REGULAR']

export function errorCode(e: unknown): string {
  if (e instanceof AppError) return e.code
  if (e instanceof TypeError && /fetch/i.test(e.message)) return 'NETWORK'
  return 'UNKNOWN'
}

/** Friendly message key; unknown codes fall back to a generic message (never shown raw). */
export function errorKey(e: unknown): TKey {
  const c = errorCode(e)
  return (CODES.includes(c) ? `e${c}` : 'eUNKNOWN') as TKey
}

/** Errors that are the user's to fix — not worth reporting to Sentry. */
export function errorReport(e: unknown, where: string): string {
  const err = e as Error
  return [
    `Lỗi trong app Việc Thời Vụ (apps/viec-thoi-vu) tại: ${where}`,
    `Mã: ${errorCode(e)}`,
    `Chi tiết: ${err?.message ?? String(e)}`,
    `Trang: ${location.href}`,
    `Trình duyệt: ${navigator.userAgent}`,
    `Thời điểm: ${new Date().toISOString()}`,
    'Hãy tìm nguyên nhân và sửa giúp mình.',
  ].join('\n')
}
