import type { TKey } from './i18n'

/** Bump when the steps change a lot, so people see the guide again. */
export const TOUR_VERSION = '1'
export type TourRole = 'seeker' | 'employer'
export interface TourStep { target: string; title: TKey; text: TKey }

const KEY = (r: TourRole) => `vtv-tour-${r}`
export const tourSeen = (r: TourRole): boolean => { try { return localStorage.getItem(KEY(r)) === TOUR_VERSION } catch { return false } }
export const markTourSeen = (r: TourRole) => { try { localStorage.setItem(KEY(r), TOUR_VERSION) } catch { /* storage unavailable */ } }
/** "Show me the guide again" (Account): forget that it was seen and tell the host to look again. */
export const resetTour = (r: TourRole) => { try { localStorage.removeItem(KEY(r)) } catch { /* storage unavailable */ } window.dispatchEvent(new Event('vtv-tour-reset')) }

/** Where each guide starts: the page the person lands on. */
export const tourHome = (r: TourRole) => (r === 'employer' ? '/app/tin-cua-toi' : '/app')

/** Elements are found by data-tour (set in Shell, Jobs, EmployerJobs, CapyBot). A step whose element is not on screen is shown centred. */
export const tourSteps = (r: TourRole, signedIn: boolean): TourStep[] => r === 'employer'
  ? [
      { target: '[data-tour="post"]', title: 'tourEPostT', text: 'tourEPostX' },
      { target: '[data-tour="nav:/app/ca-lam"]', title: 'tourEShiftsT', text: 'tourEShiftsX' },
      { target: '[data-tour="capi"]', title: 'tourECapiT', text: 'tourECapiX' },
    ]
  : [
      { target: '[data-tour="search"]', title: 'tourSSearchT', text: 'tourSSearchX' },
      { target: 'button.job', title: 'tourSJobT', text: 'tourSJobX' },
      { target: signedIn ? '[data-tour="nav:/app/cham-cong"]' : '[data-tour="nav:/app/da-ung-tuyen"]', title: 'tourSShiftsT', text: 'tourSShiftsX' },
      { target: '[data-tour="capi"]', title: 'tourSCapiT', text: 'tourSCapiX' },
    ]
