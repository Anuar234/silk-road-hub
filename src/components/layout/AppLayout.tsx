import { Bell, Home, Mail, Package, Search, Settings, LogOut, ShoppingBag, ShieldAlert } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth, type Role } from '../../auth/auth'
import { cx } from '../utils/cx'
import { Button } from '../ui/Button'
import { Logo } from '../ui/Logo'
import { getUnreadCountForAuth } from '../../data/platformSelectors'
import { usePlatformDataVersion } from '../../hooks/usePlatformDataVersion'
import { MobileNavDrawer } from './MobileNavDrawer'

const buyerSideItems = [
  { to: '/app/home', label: 'Главная', icon: Home },
  { to: '/app/catalog', label: 'Каталог', icon: Package },
  { to: '/app/messages', label: 'Сообщения', icon: Mail },
  { to: '/app/deals', label: 'Сделки', icon: ShoppingBag },
  { to: '/app/settings', label: 'Настройки', icon: Settings },
] as const

const sellerSideItems = [
  { to: '/app/home', label: 'Главная', icon: Home },
  { to: '/app/catalog', label: 'Каталог', icon: Package },
  { to: '/app/products', label: 'Товары', icon: Package },
  { to: '/app/messages', label: 'Сообщения', icon: Mail },
  { to: '/app/deals', label: 'Сделки', icon: ShoppingBag },
  { to: '/app/settings', label: 'Настройки', icon: Settings },
] as const

function getRoleLabel(role: Role): string {
  return role === 'seller' ? 'Продавец' : 'Покупатель'
}

function getVerificationLabel(role: Role, verified: boolean, emailVerified: boolean): string {
  if (role === 'seller') return verified ? 'Подтверждён' : 'На проверке'
  return emailVerified ? 'Почта подтверждена' : 'Подтвердите почту'
}

export function AppLayout() {
  const auth = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const version = usePlatformDataVersion()
  const role = auth.role ?? 'buyer'
  const sideItems = role === 'seller' ? sellerSideItems : buyerSideItems
  const isBuyerUnverified = role === 'buyer' && !auth.emailVerified
  const unreadCount = useMemo(() => getUnreadCountForAuth(auth), [auth, version])
  const currentSearchQuery = useMemo(() => new URLSearchParams(location.search).get('q') ?? '', [location.search])
  const [searchValue, setSearchValue] = useState(currentSearchQuery)

  useEffect(() => {
    setSearchValue(currentSearchQuery)
  }, [currentSearchQuery])

  const handleCatalogSearch = () => {
    const next = searchValue.trim()
    const params = new URLSearchParams()
    if (next) params.set('q', next)
    navigate(params.toString() ? `/app/catalog?${params.toString()}` : '/app/catalog')
  }

  return (
    <div className="min-h-full bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-border bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <NavLink to="/" className="flex items-center gap-3 rounded-xl motion-tap transition-opacity duration-[var(--duration-medium)] hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30 focus-visible:ring-offset-2">
            <Logo size="md" />
            <span className="hidden text-sm font-semibold text-slate-900 sm:inline">Silk Road Hub</span>
          </NavLink>

          <div className="flex flex-1 items-center gap-2">
            <form
              className="relative w-full max-w-xl"
              onSubmit={(event) => {
                event.preventDefault()
                handleCatalogSearch()
              }}
            >
              <label htmlFor="app-layout-catalog-search" className="sr-only">
                Поиск в каталоге
              </label>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                id="app-layout-catalog-search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-white pl-9 pr-12 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                placeholder={role === 'seller' ? 'Поиск по каталогу и товарам…' : 'Поиск товаров в каталоге…'}
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 grid size-8 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                aria-label="Найти в каталоге"
              >
                <Search className="size-4" />
              </button>
            </form>
          </div>

          <button
            type="button"
            onClick={() => navigate('/app/messages')}
            className="relative grid size-11 place-items-center rounded-xl border border-border bg-white text-slate-700 motion-tap transition-[color,background-color] duration-[var(--duration-medium)] ease-[var(--ease-primary)] hover:bg-slate-50"
            aria-label="Открыть сообщения"
            title="Открыть сообщения"
          >
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 min-w-4 rounded-full bg-brand-blue px-1 text-[10px] font-semibold leading-4 text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <MobileNavDrawer
            items={sideItems.map((item) => ({ to: item.to, label: item.label }))}
            onLogout={() => void auth.logout()}
            footer={
              <div className="rounded-lg border border-border bg-slate-50 px-3 py-2 text-xs text-slate-600">
                {getRoleLabel(role)} · {auth.displayName ?? auth.email ?? '—'}
              </div>
            }
          />

          <div className="hidden items-center gap-3 sm:flex">
            {isBuyerUnverified && (
              <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800">
                <ShieldAlert className="size-3.5" />
                Почта не подтверждена
              </div>
            )}
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-900">
                {getRoleLabel(role)} · {auth.displayName ?? auth.email ?? '—'}
              </div>
              {(role === 'buyer' || role === 'seller') && (
                <div className="text-xs text-slate-600">
                  {getVerificationLabel(role, auth.verified, auth.emailVerified)}
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => void auth.logout()} className="gap-2">
              <LogOut className="size-4" />
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
        <aside className="rounded-2xl border border-border bg-white p-2 lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] lg:self-start">
          <nav className="grid gap-1">
            {sideItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cx(
                      'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 motion-tap transition-[color,background-color] duration-[var(--duration-medium)] ease-[var(--ease-primary)] hover:bg-slate-50',
                      isActive ? 'bg-slate-100 text-slate-900' : null,
                    )
                  }
                >
                  <Icon className="size-4" />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>
        </aside>

        <main className="min-w-0">
          <div key={location.key} className="motion-page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
