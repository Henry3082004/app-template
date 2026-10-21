import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { api } from './api'
import { setSentryUser } from './sentry'
import type { PendingProfile, Profile, ProfileUpdate, Role } from './types'

export interface AuthRequest { role: Role; onDone?: (p: Profile) => void }

interface Session {
  profile: Profile | null
  ready: boolean
  setProfile(p: Profile | null): void
  /** save profile fields; the result is dropped if the user signed out while it was saving */
  updateProfile(patch: ProfileUpdate): Promise<Profile>
  /** signed in (e.g. Google) but the profile isn't created yet */
  pending: PendingProfile | null
  /** re-read who is signed in (after a sign-in that doesn't go through setProfile) */
  refresh(): Promise<void>
  signOut(): Promise<void>
  authRequest: AuthRequest | null
  askAuth(req: AuthRequest): void
  closeAuth(): void
  /** "Help businesses know you", asked before an application is sent; onDone runs after Done or Later */
  introRequest: IntroRequest | null
  askIntro(req: IntroRequest): void
  closeIntro(): void
  /** open "Capy hỏi nhanh" on demand (the admin's practice run asks every question again) */
  quizRequest: QuizRequest | null
  askQuiz(req: QuizRequest): void
  closeQuiz(): void
}

export interface QuizRequest { all?: boolean }

export interface IntroRequest { onDone?: () => void; /** asked right before an application goes out */ beforeApply?: boolean }

const Ctx = createContext<Session>(null as unknown as Session)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<Profile | null>(null)
  const [ready, setReady] = useState(false)
  const [pending, setPending] = useState<PendingProfile | null>(null)
  const [authRequest, setAuthRequest] = useState<AuthRequest | null>(null)
  const [introRequest, setIntroRequest] = useState<IntroRequest | null>(null)
  const [quizRequest, setQuizRequest] = useState<QuizRequest | null>(null)
  const signOuts = useRef(0)

  const setProfile = useCallback((p: Profile | null) => {
    setProfileState(p)
    setSentryUser(p ? { id: p.id, role: p.role } : null)
  }, [])

  const refresh = useCallback(async () => {
    try {
      const p = await api.me()
      setProfile(p)
      setPending(p ? null : await api.pendingProfile())
    } catch {
      setProfile(null)
    }
  }, [setProfile])

  useEffect(() => { refresh().finally(() => setReady(true)) }, [refresh])

  const updateProfile = useCallback(async (patch: ProfileUpdate) => {
    const before = signOuts.current
    const p = await api.updateProfile(patch)
    if (before === signOuts.current) setProfile(p)
    return p
  }, [setProfile])

  const signOut = useCallback(async () => {
    signOuts.current += 1
    await api.signOut()
    setProfile(null)
    setPending(null)
  }, [setProfile])

  const value = useMemo<Session>(() => ({
    profile, ready, setProfile, updateProfile, pending, refresh, signOut, authRequest,
    askAuth: (r) => setAuthRequest(r),
    closeAuth: () => setAuthRequest(null),
    introRequest,
    askIntro: (r) => setIntroRequest(r),
    closeIntro: () => setIntroRequest(null),
    quizRequest,
    askQuiz: (r) => setQuizRequest(r),
    closeQuiz: () => setQuizRequest(null),
  }), [profile, ready, setProfile, updateProfile, pending, refresh, signOut, authRequest, introRequest, quizRequest])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useSession = () => useContext(Ctx)
