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

/** Pro features are free for everyone while billing is off. */
export const isProFor = (profile: Profile | null | undefined, c: AppConfig | undefined) =>
  profile?.plan === 'pro' || c?.billing === 'off'
