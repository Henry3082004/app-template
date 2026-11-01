const KEY = 'vtv-ref'

/** A link like /app?ref=ABC123 keeps its code until the person has an account to use it with. */
export function captureRef(): void {
  try {
    const c = new URLSearchParams(location.search).get('ref')?.trim().toUpperCase()
    if (c && /^[A-Z0-9]{4,12}$/.test(c)) localStorage.setItem(KEY, c)
  } catch { /* storage unavailable */ }
}

/** The saved code, once (it is forgotten as soon as it is read). */
export function takeRef(): string | null {
  try {
    const c = localStorage.getItem(KEY)
    if (c) localStorage.removeItem(KEY)
    return c
  } catch { return null }
}
