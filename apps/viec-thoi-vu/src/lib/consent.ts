/** Version of the terms + privacy policy people agree to at sign-up. Change it when the legal pages change materially. */
export const TERMS_VERSION = '2026-11-03'
export type ConsentKind = 'terms' | 'location'

const KEY = 'vtv-consent-location'
/** Remembered on this phone so the location question is asked once (the database keeps the proof). */
export const locationAgreed = (): boolean => { try { return localStorage.getItem(KEY) === TERMS_VERSION } catch { return false } }
export const rememberLocationAgreed = () => { try { localStorage.setItem(KEY, TERMS_VERSION) } catch { /* storage unavailable */ } }
