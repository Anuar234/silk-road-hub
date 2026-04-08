import { Menu, X, LogOut } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Button } from '../ui/Button'
import { cx } from '../utils/cx'

type DrawerItem = {
  to: string
  label: string
}

export function MobileNavDrawer({
  items,
  logoutLabel = 'Выйти',
  onLogout,
  footer,
}: {
  items: DrawerItem[]
  logoutLabel?: string
  onLogout?: () => void
  footer?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const titleId = useId()
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [open])

  return (
    <>
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white text-slate-700 md:hidden"
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
        aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
        onClick={() => setOpen(true)}
      >
        <Menu className="size-4" />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            id="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="ml-auto flex h-full w-[min(88vw,360px)] flex-col bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 id={titleId} className="text-sm font-semibold text-slate-900">
                Навигация
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-slate-700"
                onClick={() => setOpen(false)}
                aria-label="Закрыть меню"
              >
                <X className="size-4" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-3">
              <div className="grid gap-1">
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cx(
                        'rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50',
                        isActive ? 'bg-slate-100 text-slate-900' : null,
                      )
                    }
                    end={item.to === '/'}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </nav>

            <div className="border-t border-border px-3 py-3">
              {onLogout ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center gap-2"
                  onClick={() => {
                    onLogout()
                    setOpen(false)
                  }}
                >
                  <LogOut className="size-4" />
                  {logoutLabel}
                </Button>
              ) : null}
              {footer ? <div className="mt-2">{footer}</div> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
