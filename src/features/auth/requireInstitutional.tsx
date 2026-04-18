import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@features/auth/auth'

export function RequireInstitutional() {
  const auth = useAuth()

  if (auth.isAuthLoading) {
    return <div className="p-6 text-sm text-slate-500">Проверяем права доступа...</div>
  }

  if (auth.role !== 'institutional' && auth.role !== 'admin') {
    return <Navigate to="/app" replace />
  }

  return <Outlet />
}
