import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './auth'

export function RequireAppUser() {
  const auth = useAuth()

  if (auth.isAuthLoading) {
    return <div className="p-6 text-sm text-slate-500">Проверяем доступ...</div>
  }

  if (auth.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  }

  return <Outlet />
}
