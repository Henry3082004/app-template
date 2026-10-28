import type { Locale, PayUnit } from './types'

export function money(n: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US').format(n) + 'đ'
}

const d = (s: string) => {
  const [y, m, day] = s.split('-').map(Number)
  return { y, m, day }
}

/** 2026-10-18 → 2026-10-20 ⇒ "18–20/10"; across months "28/10–3/11"; same day "18/10" */
export function dateRange(start: string, end: string): string {
  const a = d(start), b = d(end)
  if (start === end) return `${a.day}/${a.m}`
  if (a.m === b.m && a.y === b.y) return `${a.day}–${b.day}/${a.m}`
  return `${a.day}/${a.m}–${b.day}/${b.m}`
}

export function payUnitKey(u: PayUnit) {
  return `per${u}` as const
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return (parts.length === 1 ? parts[0][0] : parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export const today = () => new Date().toISOString().slice(0, 10)
/** The date in Vietnam (UTC+7), which is what the database uses to decide "today" for check-in. */
export const vnDate = (d: Date | string) => new Date(new Date(d).getTime() + 7 * 36e5).toISOString().slice(0, 10)
export const vnToday = () => vnDate(new Date())
/** "08:05" in Vietnam time. */
export const vnClock = (iso: string) => new Date(new Date(iso).getTime() + 7 * 36e5).toISOString().slice(11, 16)
export const addDays = (s: string, n: number) => {
  const x = new Date(s + 'T00:00:00Z')
  x.setUTCDate(x.getUTCDate() + n)
  return x.toISOString().slice(0, 10)
}
