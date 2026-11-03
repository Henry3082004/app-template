import { useEffect, useRef } from 'react'
import { IS_MOCK } from '../../lib/api'

/** The public Cloudflare Turnstile site key ("I am not a bot" box). Empty = no box and nothing is asked. */
export const TURNSTILE_SITE_KEY = IS_MOCK ? '' : ((import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) ?? '')

interface TsApi { render(el: HTMLElement, o: { sitekey: string; callback(t: string): void; 'expired-callback'(): void; 'error-callback'(): void; theme?: string; language?: string }): string; remove(id: string): void }
declare global { interface Window { turnstile?: TsApi } }

let loading: Promise<void> | null = null
const load = () => (loading ??= new Promise<void>((resolve, reject) => {
  const s = document.createElement('script')
  s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; s.async = true; s.defer = true
  s.onload = () => resolve(); s.onerror = () => { loading = null; reject(new Error('turnstile')) }
  document.head.appendChild(s)
}))

/** The box itself. It calls onToken with a fresh token when solved and with '' when the token expires or fails. Shows nothing while it is easy (Managed mode). */
export function TurnstileBox({ onToken }: { onToken(t: string): void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return
    let id: string | null = null, dead = false
    load().then(() => {
      if (dead || !ref.current || !window.turnstile) return
      id = window.turnstile.render(ref.current, { sitekey: TURNSTILE_SITE_KEY, callback: onToken, 'expired-callback': () => onToken(''), 'error-callback': () => onToken(''), language: 'vi' })
    }).catch(() => onToken('')) // blocked or offline: the form stays locked, the person can reload
    return () => { dead = true; try { if (id) window.turnstile?.remove(id) } catch { /* already gone */ } }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  if (!TURNSTILE_SITE_KEY) return null
  return <div ref={ref} className="turnstile" />
}
