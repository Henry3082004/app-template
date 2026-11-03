import { useEffect } from 'react'
import { api, IS_MOCK } from '../../lib/api'
import { useAppConfig } from '../../lib/config'
import { useSession } from '../../lib/session'
import { IN_ZALO } from '../../lib/zalo'

/** The public Google "web" client id (the same one the Google provider in Supabase uses). Empty = the suggestion is switched off. */
const CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? ''
const SKIP_KEY = 'vtv-onetap-skip'
const DAY = 864e5

interface Credential { credential: string }
interface Notification { isDismissedMoment?: () => boolean; isSkippedMoment?: () => boolean }
declare global {
  interface Window {
    google?: { accounts: { id: {
      initialize(cfg: { client_id: string; callback(r: Credential): void; nonce: string; auto_select: boolean; cancel_on_tap_outside: boolean; use_fedcm_for_prompt: boolean }): void
      prompt(cb?: (n: Notification) => void): void
      cancel(): void
    } } }
  }
}

const skipped = () => { try { return Date.now() - Number(localStorage.getItem(SKIP_KEY) || 0) < DAY } catch { return false } }
const skipFor24h = () => { try { localStorage.setItem(SKIP_KEY, String(Date.now())) } catch { /* storage unavailable */ } }

let loading: Promise<void> | null = null
const loadGsi = () => (loading ??= new Promise<void>((resolve, reject) => {
  const s = document.createElement('script')
  s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.defer = true
  s.onload = () => resolve(); s.onerror = () => { loading = null; reject(new Error('gsi')) }
  document.head.appendChild(s)
}))

async function makeNonce(): Promise<{ raw: string; hashed: string }> {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const raw = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
  return { raw, hashed: Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('') }
}

/**
 * The little "Sign in with Google" card in the top-right corner (Google One Tap), for visitors on the website who are not signed in.
 * Not inside Zalo, never when signed in, and after "close" it stays away for a day. A new person lands in the usual
 * "finish your profile" step (which has the consent box), so nothing is created without them agreeing.
 */
export function GoogleOneTap() {
  const { ready, profile, refresh } = useSession()
  const cfg = useAppConfig()
  const on = !!CLIENT_ID && !IS_MOCK && !IN_ZALO && cfg?.google_login === 'on'

  useEffect(() => {
    if (!on || !ready || profile || skipped()) return
    let dead = false
    ;(async () => {
      try {
        await loadGsi()
        const nonce = await makeNonce()
        if (dead || !window.google) return
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID, nonce: nonce.hashed, auto_select: false, cancel_on_tap_outside: false, use_fedcm_for_prompt: true,
          callback: (r) => { void api.signInWithGoogleIdToken(r.credential, nonce.raw).then(() => refresh()).catch(() => undefined) },
        })
        window.google.accounts.id.prompt((n) => { if (n.isDismissedMoment?.()) skipFor24h() })
      } catch { /* blocked or offline: the normal sign-in button is still there */ }
    })()
    return () => { dead = true; try { window.google?.accounts.id.cancel() } catch { /* not loaded */ } }
  }, [on, ready, profile?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
