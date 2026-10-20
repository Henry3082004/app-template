import { useEffect, useState } from 'react'
import { IN_ZALO } from './zalo'

/** Chrome / Edge / Samsung Internet hand us this event when the site can be installed as an app. */
interface InstallEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const KEY = 'vtv-install-later'
const SNOOZE_MS = 7 * 864e5

// The event can fire before React mounts, so keep the latest one at module level.
let deferred: InstallEvent | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((f) => f())
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as InstallEvent; notify() })
  window.addEventListener('appinstalled', () => { deferred = null; notify() })
}

const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true)

// iPhones and iPads have no install event: the only way is Share → Add to Home Screen.
const isIos = () =>
  typeof navigator !== 'undefined' &&
  (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

const snoozed = () => {
  try { return Date.now() - Number(localStorage.getItem(KEY) || 0) < SNOOZE_MS } catch { return false }
}

export type InstallState = { show: boolean; ios: boolean; install(): Promise<void>; later(): void }

/** Whether to suggest installing the app, and how. Never inside the Zalo Mini App or an already-installed app. */
export function useInstall(): InstallState {
  const [, rerender] = useState(0)
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    const f = () => rerender((n) => n + 1)
    listeners.add(f)
    return () => { listeners.delete(f) }
  }, [])
  const ios = isIos()
  const show = !hidden && !IN_ZALO && !isStandalone() && !snoozed() && (deferred != null || ios)
  return {
    show,
    ios: ios && deferred == null,
    async install() {
      const e = deferred
      if (!e) return
      await e.prompt()
      const { outcome } = await e.userChoice
      deferred = null
      if (outcome === 'accepted') setHidden(true)
      notify()
    },
    later() {
      try { localStorage.setItem(KEY, String(Date.now())) } catch { /* private mode: only hide for this visit */ }
      setHidden(true)
    },
  }
}
