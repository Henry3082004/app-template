import * as Sentry from '@sentry/react'

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined
let on = false

export function initSentry() {
  if (!DSN || import.meta.env.VITE_MOCK === '1') return
  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.VITE_DEMO === '1' ? 'demo' : 'production',
    release: 'viec-thoi-vu@' + (import.meta.env.VITE_RELEASE || 'dev'),
    tracesSampleRate: 0,
    sendDefaultPii: false,
    // Shares the org's existing Sentry project (members can't create projects); filter by tag app:viec-thoi-vu.
    initialScope: { tags: { app: 'viec-thoi-vu' } },
  })
  on = true
}

export function report(err: unknown, context?: Record<string, unknown>) {
  if (on) Sentry.captureException(err, { extra: context })
  else console.warn('[report]', err, context)
}

export function setSentryUser(u: { id: string; role: string } | null) {
  if (on) Sentry.setUser(u ? { id: u.id, segment: u.role } : null)
}

/** Admin self-check: false when Sentry is not configured in this build. */
export async function sendTestError(): Promise<boolean> {
  if (!on) return false
  Sentry.captureException(new Error('Sentry test from admin page'), { tags: { test: 'admin' } })
  return Sentry.flush(5000)
}

export const ErrorBoundary = Sentry.ErrorBoundary
