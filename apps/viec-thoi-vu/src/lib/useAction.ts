import { useState } from 'react'

/** One button action at a time: which one is running (by key), and the last error. `run` resolves true when it worked. */
export function useAction() {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<unknown>(null)
  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key); setError(null)
    try { await fn(); return true } catch (e) { setError(e); return false } finally { setBusy(null) }
  }
  return { busy, error, setError, run }
}
