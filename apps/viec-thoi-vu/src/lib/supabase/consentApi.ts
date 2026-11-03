import type { Api } from '../types'
import { rpc } from './core'

/** Proof of consent: sign-up terms and location sharing. */
export const consentApi: Pick<Api, 'recordConsent' | 'adminConsentStats'> = {
  async recordConsent(kind, version) {
    await rpc('record_consent', { p_kind: kind, p_version: version })
  },
  async adminConsentStats(version) {
    return (await rpc('admin_consent_stats', { p_version: version })) as unknown as { users: number; terms_current: number; location: number }
  },
}
