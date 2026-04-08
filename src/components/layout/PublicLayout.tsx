import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/auth'
import { Container } from './Container'
import { Button } from '../ui/Button'
import { ButtonLink } from '../ui/ButtonLink'
import { Logo } from '../ui/Logo'
import { cx } from '../utils/cx'
import { MobileNavDrawer } from './MobileNavDrawer'

const navItems = [
  { to: '/', label: 'Главная' },
  { to: '/catalog', label: 'Каталог' },
  { to: '/analytics', label: 'Аналитика' },
  { to: '/about', label: 'О нас' },
  { to: '/investments', label: 'Инвестпроекты' },
] as const

export function PublicLayout() {
  const auth = useAuth()
  const location = useLocation()
  const cabinetTarget = auth.role === 'admin' ? '/admin/dashboard' : '/app/home'

  return (
    <div className="min-h-full bg-white">
      <header className="sticky top-0 z-20 border-b border-border bg-white/80 backdrop-blur">
        <Container className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <NavLink to="/" className="flex items-center gap-3 rounded-xl motion-tap transition-opacity duration-[var(--duration-medium)] hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30 focus-visible:ring-offset-2">
              <Logo size="md" />
              <span className="text-sm font-semibold tracking-tight text-slate-900 hidden sm:inline">Silk Road Hub</span>
            </NavLink>

            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cx(
                      'rounded-xl px-3 py-2 text-sm font-medium text-slate-700 motion-tap transition-[color,background-color] duration-[var(--duration-medium)] ease-[var(--ease-primary)] hover:bg-slate-50',
                      isActive ? 'bg-slate-100 text-slate-900' : null,
                    )
                  }
                  end={item.to === '/'}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <MobileNavDrawer
              items={[...navItems]}
              onLogout={auth.isAuthenticated ? () => void auth.logout() : undefined}
              footer={
                auth.isAuthenticated ? (
                  <ButtonLink to={cabinetTarget} variant="secondary" size="sm" className="w-full justify-center">
                    Кабинет
                  </ButtonLink>
                ) : (
                  <div className="grid gap-2">
                    <ButtonLink to="/login" variant="ghost" size="sm" className="w-full justify-center">
                      Войти
                    </ButtonLink>
                    <ButtonLink to="/request-access" variant="primary" size="sm" className="w-full justify-center">
                      Запросить доступ
                    </ButtonLink>
                  </div>
                )
              }
            />
            {auth.isAuthenticated ? (
              <>
                <ButtonLink to={cabinetTarget} variant="secondary" size="sm" className="hidden sm:inline-flex">
                  Кабинет
                </ButtonLink>
                <Button variant="ghost" size="sm" onClick={() => void auth.logout()} className="hidden sm:inline-flex">
                  Выйти
                </Button>
              </>
            ) : (
              <>
                <ButtonLink to="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
                  Войти
                </ButtonLink>
                <ButtonLink to="/request-access" variant="primary" size="sm">
                  Запросить доступ
                </ButtonLink>
              </>
            )}
          </div>
        </Container>
      </header>

      <main>
        <div key={location.key} className="motion-page-enter">
          <Outlet />
        </div>
      </main>

      <footer className="mt-16 border-t border-border bg-white">
        <Container className="grid gap-6 py-10 md:grid-cols-2 md:items-center">
          <div className="flex items-center gap-3">
            <Logo size="sm" className="opacity-90" />
            <div>
              <div className="text-sm font-semibold text-slate-900">Silk Road Hub</div>
              <div className="mt-1 text-sm text-slate-600">
              Контакт: <a className="font-medium text-brand-blue transition-opacity duration-200 hover:underline hover:opacity-90" href="mailto:hello@silkroadhub.io">hello@silkroadhub.io</a>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <NavLink className="text-sm font-medium text-slate-700 transition-colors duration-200 hover:text-slate-900" to="/about">
              О нас
            </NavLink>
            <span className="text-slate-300">/</span>
            <NavLink className="text-sm font-medium text-slate-700 transition-colors duration-200 hover:text-slate-900" to="/analytics">
              Аналитика
            </NavLink>
            <span className="text-slate-300">/</span>
            <NavLink className="text-sm font-medium text-slate-700 transition-colors duration-200 hover:text-slate-900" to="/request-access">
              Доступ
            </NavLink>
            <span className="text-slate-300">/</span>
            <a className="text-sm font-medium text-slate-700 transition-colors duration-200 hover:text-slate-900" href="mailto:hello@silkroadhub.io">
              Контакты
            </a>
          </div>
        </Container>
      </footer>
    </div>
  )
}

