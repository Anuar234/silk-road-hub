import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { BarChart3, FileText, FolderOpen, LayoutDashboard, LogOut, MessagesSquare, PieChart, Settings, Shield, Users, Package } from 'lucide-react'
import { Logo } from '../ui/Logo'
import { useAuth } from '../../auth/auth'
import { Button } from '../ui/Button'
import { cx } from '../utils/cx'

const sideItems = [
  { to: '/admin/dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { to: '/admin/deals', label: 'Сделки', icon: FolderOpen },
  { to: '/admin/documents', label: 'Документы', icon: FileText },
  { to: '/admin/messages', label: 'Сообщения', icon: MessagesSquare },
  { to: '/admin/users', label: 'Пользователи', icon: Users },
  { to: '/admin/catalog', label: 'Каталог', icon: Package },
  { to: '/admin/statistics', label: 'Статистика', icon: BarChart3 },
  { to: '/admin/analytics', label: 'Аналитика', icon: PieChart },
  { to: '/admin/reports', label: 'Отчёты', icon: FileText },
  { to: '/admin/settings', label: 'Настройки', icon: Settings },
] as const

export function AdminLayout() {
  const auth = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-full bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-border bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <NavLink to="/admin/dashboard" className="flex items-center gap-3 rounded-xl motion-tap transition-opacity duration-[var(--duration-medium)] hover:opacity-80">
            <Logo size="md" />
            <span className="hidden text-sm font-semibold text-slate-900 sm:inline">Админ · Silk Road Hub</span>
          </NavLink>
          <div className="flex-1" />
          <div className="hidden items-center gap-3 sm:flex">
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-900">Администратор · {auth.displayName ?? auth.email ?? '—'}</div>
              <div className="text-xs text-slate-500">Изолированная операционная панель</div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => auth.logout()} className="gap-2">
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
          <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            <Shield className="size-3.5" />
            Операционная панель
          </div>
          <div key={location.key} className="motion-page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
