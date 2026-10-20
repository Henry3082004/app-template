import type { Profile } from './types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

/** Public URL of a stored profile photo (the mock keeps photos as data: URLs). */
export function avatarUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('data:') || path.startsWith('/')) return path // mock photos and the bundled sample pictures
  return `${SUPABASE_URL}/storage/v1/object/public/avatars/${path}`
}

export const ageOf = (birthYear: number | null) => (birthYear ? new Date().getFullYear() - birthYear : null)

/** Birth years offered in the picker: 15 to 65 years old, youngest first. */
export function birthYears(): number[] {
  const now = new Date().getFullYear()
  return Array.from({ length: 51 }, (_, i) => now - 15 - i)
}

// "Help businesses know you" is asked once after sign-in; if skipped, once more on the first Apply.
// Kept per device — losing it only means the friendly question shows one extra time.
const flag = (kind: 'skip' | 'nudged', id: string) => `vtv-intro-${kind}-${id}`
const memory = new Set<string>()
const read = (k: string) => { try { return localStorage.getItem(k) === '1' } catch { return memory.has(k) } }
const write = (k: string) => { try { localStorage.setItem(k, '1') } catch { memory.add(k) } }

const missing = (p: Profile | null): p is Profile => !!p && p.role === 'seeker' && p.birth_year == null
/** Show the intro on its own (right after sign-in)? */
export const introDue = (p: Profile | null) => missing(p) && !read(flag('skip', p.id)) && !read(flag('nudged', p.id))
/** Ask before this application is sent? */
export const introNudgeDue = (p: Profile | null) => missing(p) && !read(flag('nudged', p.id))
export const markIntroSkipped = (id: string) => write(flag('skip', id))
export const markIntroNudged = (id: string) => write(flag('nudged', id))

/** Centre-crops a picked photo to a small square JPEG so uploads stay tiny on mobile data. */
export async function squarePhoto(file: Blob, size = 320): Promise<Blob> {
  const img = await createImageBitmap(file)
  const side = Math.min(img.width, img.height)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  canvas.getContext('2d')!.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size)
  img.close()
  return new Promise((ok, fail) => canvas.toBlob((b) => (b ? ok(b) : fail(new Error('PHOTO_FAILED'))), 'image/jpeg', 0.85))
}
