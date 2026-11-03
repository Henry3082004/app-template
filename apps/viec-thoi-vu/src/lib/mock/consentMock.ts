import type { Api } from '../types'
import { admin, me, users, wait } from './core'

const rows: { user_id: string; kind: string; version: string }[] = []

export const consentMock: Pick<Api, 'recordConsent' | 'adminConsentStats'> = {
  async recordConsent(kind, version) {
    const uid = me().id
    if (!rows.some((r) => r.user_id === uid && r.kind === kind && r.version === version)) rows.push({ user_id: uid, kind, version })
    return wait(undefined)
  },
  async adminConsentStats(version) {
    admin()
    const ids = (k: string, v?: string) => new Set(rows.filter((r) => r.kind === k && (!v || r.version === v)).map((r) => r.user_id)).size
    return wait({ users: Object.keys(users).length, terms_current: ids('terms', version), location: ids('location') })
  },
}
