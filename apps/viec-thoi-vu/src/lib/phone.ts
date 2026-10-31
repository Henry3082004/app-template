/** Normalize a Vietnamese/international phone number to digits with country code (0xxx → 84xxx). */
export function normalizePhone(raw: string): string | null {
  let d = raw.replace(/[^\d+]/g, '')
  if (d.startsWith('+')) d = d.slice(1)
  else if (d.startsWith('00')) d = d.slice(2)
  else if (d.startsWith('0')) d = '84' + d.slice(1)
  if (!/^\d{9,15}$/.test(d)) return null
  if (d.startsWith('84') && d.length !== 11) return null
  return d
}

/** Login e-mail of Zalo (and older) accounts. */
export const phoneEmail = (digits: string) => `${digits}@phone.viecthoivu.app`
/** Login e-mail of phone + password accounts: a different domain, so a typed phone can never collide with a phone proven by Zalo. */
export const passwordEmail = (digits: string) => `${digits}@pw.viecthoivu.app`

/** +84901234567 → 0901 234 567 for display */
export function displayPhone(p: string | null): string {
  if (!p) return ''
  const d = p.replace(/\D/g, '')
  if (d.startsWith('84') && d.length === 11) {
    const local = '0' + d.slice(2)
    return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`
  }
  return '+' + d
}

export function telHref(p: string): string {
  return 'tel:+' + p.replace(/\D/g, '')
}

export function zaloHref(p: string): string {
  const d = p.replace(/\D/g, '')
  return 'https://zalo.me/' + (d.startsWith('84') ? '0' + d.slice(2) : d)
}
