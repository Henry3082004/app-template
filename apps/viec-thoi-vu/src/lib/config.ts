import { useEffect, useState } from 'react'
import { api } from './api'
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
  const [c, setC] = useState<AppConfig>()
  useEffect(() => { let live = true; getConfig().then((x) => { if (live) setC(x) }); return () => { live = false } }, [])
  return c
}

/** Pro features are free for everyone while billing is off. */
export const isProFor = (profile: Profile | null | undefined, c: AppConfig | undefined) =>
  profile?.plan === 'pro' || c?.billing === 'off'
