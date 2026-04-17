import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@features/auth/auth'

/**
 * Preserves the current login redirect contract by keeping the original
 * destination in navigation state. Any router migration needs an equivalent
 * mechanism for `state.from`.
 */
export function RequireAuth() {
  const auth = useAuth()
  const location = useLocation()

  if (auth.isAuthLoading) {
    return <div className="p-6 text-sm text-slate-500">Проверяем сессию...</div>
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

