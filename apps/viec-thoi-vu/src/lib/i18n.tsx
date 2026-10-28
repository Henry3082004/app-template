import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { en } from './i18n/en'
import { vi, type Dict } from './i18n/vi'
import type { Locale } from './types'

export type TKey = keyof Dict
const dicts: Record<Locale, Dict> = { vi, en }

export function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem('locale')
    if (saved === 'vi' || saved === 'en') return saved
  } catch { /* storage unavailable */ }
  // Vietnamese first for everyone; English only once someone picks it (the choice is remembered)
  return 'vi'
}

interface I18n { locale: Locale; setLocale(l: Locale): void; t(k: TKey, vars?: Record<string, string | number>): string }
const Ctx = createContext<I18n>(null as unknown as I18n)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLoc] = useState<Locale>(detectLocale)
  const setLocale = useCallback((l: Locale) => {
    setLoc(l)
    document.documentElement.lang = l
    try { localStorage.setItem('locale', l) } catch { /* ignore */ }
  }, [])
  const t = useCallback((k: TKey, vars?: Record<string, string | number>) => {
    let s = dicts[locale][k] ?? vi[k] ?? k
    if (vars) for (const [n, v] of Object.entries(vars)) s = s.replace(`{${n}}`, String(v))
    return s
  }, [locale])
  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useI18n = () => useContext(Ctx)
