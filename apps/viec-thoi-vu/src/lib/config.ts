import { useQuery } from '@tanstack/react-query'
import { api } from './api'
import { qk } from './query'
import type { AppConfig } from './types'
import type { Profile } from './types'

// Server-side switches (app_settings): money and paid plans can be turned on later without a code change.
let cached: Promise<AppConfig> | null = null
export function getConfig(): Promise<AppConfig> {
  cached ??= api.appConfig().catch(() => { cached = null; return { payment_mode: 'off', billing: 'off' } as AppConfig })
  return cached
}

/** undefined until loaded — callers render nothing money-related until then. */
export function useAppConfig(): AppConfig | undefined {
  return useQuery({ queryKey: qk.config, queryFn: getConfig, staleTime: Infinity }).data
}

/** Until when the app is free for everyone (shown to shops and workers; anything we charge later is announced 30 days before). */
export const FREE_UNTIL = '2027-06-30'
export const freeUntilLabel = (locale: string) => new Date(FREE_UNTIL + 'T12:00:00').toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-GB')

/** Pro features are free for everyone while billing is off. */
export const isProFor = (profile: Profile | null | undefined, c: AppConfig | undefined) =>
  profile?.plan === 'pro' || c?.billing === 'off'
