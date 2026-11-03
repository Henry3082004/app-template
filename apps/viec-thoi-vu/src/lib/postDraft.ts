import type { JobInput } from './types'

/**
 * A job post typed by someone who is not signed in yet. It is kept on this phone, so the form survives the sign-up
 * (also the Google sign-in that leaves the page and comes back); it is cleared once the post is published.
 */
const KEY = 'vtv-post-draft'
const DAY = 864e5
export interface PostDraft { f: JobInput; guide: string; at: number }

export function savePostDraft(f: JobInput, guide: string) {
  try {
    if (!f.title.trim() && !f.description.trim() && !guide.trim()) { localStorage.removeItem(KEY); return } // nothing typed: nothing to keep
    localStorage.setItem(KEY, JSON.stringify({ f, guide, at: Date.now() } satisfies PostDraft))
  } catch { /* storage unavailable */ }
}
export function loadPostDraft(): PostDraft | null {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || 'null') as PostDraft | null
    return d && d.f && typeof d.f.title === 'string' && Date.now() - d.at < DAY ? d : null
  } catch { return null }
}
export const clearPostDraft = () => { try { localStorage.removeItem(KEY) } catch { /* storage unavailable */ } }
