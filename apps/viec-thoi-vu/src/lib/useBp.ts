import { useEffect, useState } from 'react'

/** m: phone <600 · t: tablet 600–1023 · l: tablet landscape 1024–1279 · d: desktop ≥1280 */
export type Bp = 'm' | 't' | 'l' | 'd'
const read = (): Bp => {
  const w = typeof window === 'undefined' ? 390 : window.innerWidth
  return w < 600 ? 'm' : w < 1024 ? 't' : w < 1280 ? 'l' : 'd'
}

export function useBp(): Bp {
  const [bp, setBp] = useState<Bp>(read)
  useEffect(() => {
    const f = () => setBp(read())
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])
  return bp
}
