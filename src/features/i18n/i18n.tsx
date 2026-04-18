import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  DEFAULT_LOCALE,
  detectBrowserLocale,
  LOCALE_DICTS,
  SUPPORTED_LOCALES,
  type LocaleCode,
} from '@features/i18n/locales'

const STORAGE_KEY = 'srh.locale'

type LocaleContextValue = {
  locale: LocaleCode
  setLocale: (code: LocaleCode) => void
  t: (key: string, fallback?: string) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

function readStoredLocale(): LocaleCode | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw && SUPPORTED_LOCALES.some((l) => l.code === raw)) return raw as LocaleCode
  } catch {
    // ignore (SSR / disabled storage)
  }
  return null
}

function writeStoredLocale(code: LocaleCode): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, code)
  } catch {
    // ignore
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  // Lazy initializer: read stored locale / detect browser locale once during
  // mount instead of via useEffect + setState (blocked by react-hooks/set-state-in-effect
  // in React 19 / Next 15 strict mode). LocaleProvider is mounted inside
  // ClientAppShell with ssr:false, so `window` is safe here.
  const [locale, setLocaleState] = useState<LocaleCode>(() => {
    if (typeof window === 'undefined') return DEFAULT_LOCALE
    const stored = readStoredLocale()
    if (stored) return stored
    return detectBrowserLocale()
  })

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', locale === 'kz' ? 'kk' : locale === 'cn' ? 'zh' : locale)
    }
  }, [locale])

  const setLocale = useCallback((code: LocaleCode) => {
    setLocaleState(code)
    writeStoredLocale(code)
  }, [])

  const t = useCallback(
    (key: string, fallback?: string) => {
      const dict = LOCALE_DICTS[locale]
      if (dict && key in dict && dict[key]) return dict[key]
      const ruValue = LOCALE_DICTS.ru[key]
      if (ruValue) return ruValue
      return fallback ?? key
    },
    [locale],
  )

  const value = useMemo<LocaleContextValue>(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    // Fail open: provide identity translator so components still render
    // in environments where the provider wasn't mounted (e.g. tests).
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: (_key, fallback) => fallback ?? _key,
    }
  }
  return ctx
}

export function useT() {
  return useLocale().t
}
