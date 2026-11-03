import type { Profile } from './types'
import { writeQuiz } from './quiz'

/** What an admin can look at: a brand-new visitor, a sample shop, a sample worker (both with a history), or the admin's own view. */
export type AdminMode = 'new' | 'employer' | 'seeker' | 'admin'
export const ADMIN_MODES: AdminMode[] = ['new', 'employer', 'seeker', 'admin']

/** Which mode the person is in right now. */
export const currentMode = (p: Profile | null): AdminMode => (!p ? 'new' : p.is_admin ? 'admin' : p.role === 'employer' ? 'employer' : 'seeker')

/** Where to land after switching: the home page of that mode (the admin stays in Account, where the switch is). */
export const modeHome = (m: AdminMode): string => (m === 'employer' ? '/app/tin-cua-toi' : m === 'admin' ? '/app/tai-khoan' : '/app')

/** "A new visitor": forget what this phone knows, so the quick questions and the guide start again. */
export function resetFirstVisit() {
  writeQuiz({ answers: {}, synced: null })
  try {
    localStorage.removeItem('vtv-tour-seeker'); localStorage.removeItem('vtv-tour-employer'); localStorage.removeItem('vtv-consent-location')
    sessionStorage.removeItem('vtv-capy-hi')
  } catch { /* storage unavailable */ }
}
