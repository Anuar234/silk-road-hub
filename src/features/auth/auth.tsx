import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiLogin, apiLogout, apiMe, type ApiUser } from '@shared/api/authApi'
import { clearAuthStorage, readAuthStorage } from '@shared/api/authStorage'

export type Role = 'buyer' | 'seller' | 'admin'

export type AuthState = {
  isAuthLoading: boolean
  isAuthenticated: boolean
  userId: string | null
  email: string | null
  displayName: string | null
  role: Role | null
  /** Покупатель: верификация по email (false) или полная при сделке (true). Продавец: подтверждён компания/БИН (true) или на проверке (false). Admin: не используется. */
  verified: boolean
  /** Покупатель: подтверждена ли почта (без этого нельзя писать продавцу). Остальные роли: не используется. */
  emailVerified: boolean
  /** Только для продавца */
  companyName: string | null
  bin: string | null
  position: string | null
}

type AuthContextValue = AuthState & {
  login: (args: { email: string; password: string }) => Promise<{ role: Role }>
  logout: () => Promise<void>
  /** Покупатель: пометить почту подтверждённой (демо: "Я уже подтвердил почту"). */
  setEmailVerified: (value: boolean) => void
  /** Re-fetch profile from server and update state. */
  refreshProfile: () => Promise<void>
}

function getInitialState(): AuthState {
  return {
    isAuthLoading: true,
    isAuthenticated: false,
    userId: null,
    email: null,
    displayName: null,
    role: null,
    verified: false,
    emailVerified: false,
    companyName: null,
    bin: null,
    position: null,
  }
}

function mapApiUserToAuthState(user: ApiUser): AuthState {
  return {
    isAuthLoading: false,
    isAuthenticated: true,
    userId: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    verified: user.verified,
    emailVerified: user.emailVerified,
    companyName: user.companyName,
    bin: user.bin,
    position: user.position,
  }
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Central auth provider for the whole product.
 * The current implementation models demo credentials plus local persistence;
 * migration work should wrap this behavior before replacing it.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => getInitialState())

  useEffect(() => {
    let cancelled = false
    const bootstrap = async () => {
      try {
        const user = await apiMe()
        if (cancelled) return
        if (!user) {
          setState({ ...getInitialState(), isAuthLoading: false })
          return
        }
        setState(mapApiUserToAuthState(user))
      } catch {
        if (cancelled) return
        setState({ ...getInitialState(), isAuthLoading: false })
      } finally {
        // Migration cleanup: keep key for one release window, then clear it.
        if (typeof window !== 'undefined' && readAuthStorage()) {
          clearAuthStorage()
        }
      }
    }
    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    return {
      ...state,
      async login({ email, password }) {
        setState((prev) => ({ ...prev, isAuthLoading: true }))
        const user = await apiLogin({ email, password })
        setState(mapApiUserToAuthState(user))
        return { role: user.role }
      },
      async logout() {
        try {
          await apiLogout()
        } finally {
          clearAuthStorage()
          setState({ ...getInitialState(), isAuthLoading: false })
        }
      },
      setEmailVerified(value: boolean) {
        if (state.role !== 'buyer' || !state.isAuthenticated) return
        const next: AuthState = { ...state, emailVerified: value, isAuthLoading: false }
        setState(next)
      },
      async refreshProfile() {
        const user = await apiMe()
        if (user) setState(mapApiUserToAuthState(user))
      },
    }
  }, [state])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
