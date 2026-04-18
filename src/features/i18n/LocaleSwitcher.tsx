import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { useLocale } from '@features/i18n/i18n'
import { SUPPORTED_LOCALES, type LocaleCode } from '@features/i18n/locales'

type Variant = 'header' | 'compact'

type Props = {
  variant?: Variant
}

export function LocaleSwitcher({ variant = 'header' }: Props) {
  const { locale, setLocale, t } = useLocale()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  const active = SUPPORTED_LOCALES.find((l) => l.code === locale) ?? SUPPORTED_LOCALES[0]

  const buttonClass =
    variant === 'compact'
      ? 'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      : 'inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={buttonClass}
        aria-label={t('common.language', 'Язык')}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe className="size-3.5" />
        <span className="uppercase">{active.code}</span>
        <ChevronDown className="size-3.5" />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t('common.language', 'Язык')}
          className="absolute right-0 z-40 mt-1 min-w-[140px] overflow-hidden rounded-lg border border-border bg-white py-1 shadow-lg"
        >
          {SUPPORTED_LOCALES.map((l) => {
            const selected = l.code === locale
            return (
              <li key={l.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    setLocale(l.code as LocaleCode)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm ${
                    selected ? 'bg-slate-50 font-medium text-slate-900' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-6 text-xs uppercase text-slate-500">{l.code}</span>
                  <span>{l.nativeName}</span>
                  {selected && <Check className="ml-auto size-3.5 text-brand-blue" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
