import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from './api'
import { setSentryUser } from './sentry'
import type { Profile, Role } from './types'

export interface AuthRequest { role: Role; onDone?: (p: Profile) => void }

interface Session {
  profile: Profile | null
  ready: boolean
  setProfile(p: Profile | null): void
  signOut(): Promise<void>
  authRequest: AuthRequest | null
  askAuth(req: AuthRequest): void
  closeAuth(): void
}

const Ctx = createContext<Session>(null as unknown as Session)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<Profile | null>(null)
  const [ready, setReady] = useState(false)
  const [authRequest, setAuthRequest] = useState<AuthRequest | null>(null)

  const setProfile = useCallback((p: Profile | null) => {
    setProfileState(p)
    setSentryUser(p ? { id: p.id, role: p.role } : null)
  }, [])

  useEffect(() => {
    api.me().then(setProfile).catch(() => setProfile(null)).finally(() => setReady(true))
  }, [setProfile])

  const signOut = useCallback(async () => {
    await api.signOut()
    setProfile(null)
  }, [setProfile])

  const value = useMemo<Session>(() => ({
    profile, ready, setProfile, signOut, authRequest,
    askAuth: (r) => setAuthRequest(r),
    closeAuth: () => setAuthRequest(null),
  }), [profile, ready, setProfile, signOut, authRequest])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useSession = () => useContext(Ctx)
