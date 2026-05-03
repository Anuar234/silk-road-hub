import { Lock, LogIn } from 'lucide-react'
import { useMemo, useState } from 'react'
import type React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getNavigationFrom } from '@shared/api/navigationState'
import { useAuth } from '@features/auth/auth'
import { Container } from '@widgets/layout/Container'
import { Button } from '@shared/ui/Button'
import { ButtonLink } from '@shared/ui/ButtonLink'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { Input } from '@shared/ui/Input'

export function LoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = useMemo(() => {
    return getNavigationFrom(location.state) ?? '/'
  }, [location.state])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pilot/test default ON: there are no real users yet and operators rely on
  // these buttons to navigate the app. Set NEXT_PUBLIC_ENABLE_DEMO_LOGIN=false
  // before public launch to hide the credentials.
  const demoEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN !== 'false'

  const demoAccounts = [
    { label: 'Покупатель', email: 'buyer.demo@silkroadhub.kz', password: 'BuyerDemo123!' },
    { label: 'Продавец', email: 'seller.demo@silkroadhub.kz', password: 'SellerDemo123!' },
    { label: 'Админ', email: 'admin@silkroadhub.kz', password: 'Admin123!SRH' },
  ] as const

  const performLogin = async (loginEmail: string, loginPassword: string) => {
    const normalizedEmail = loginEmail.trim()
    if (!normalizedEmail || !loginPassword) return
    setLoading(true)
    setError(null)
    try {
      const result = await auth.login({ email: normalizedEmail, password: loginPassword })
      const target = result.role === 'admin' ? '/admin/dashboard' : from
      navigate(target, { replace: true })
    } catch (e) {
      setError((e as Error).message || 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    await performLogin(email, password)
  }

  const handleDemoLogin = async (account: (typeof demoAccounts)[number]) => {
    setEmail(account.email)
    setPassword(account.password)
    await performLogin(account.email, account.password)
  }

  return (
    <Container className="py-12">
      <div className="mx-auto grid max-w-xl gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Вход</h1>
          <p className="mt-2 text-base text-slate-600">Введите email и пароль</p>
        </div>

        <Card>
          <CardHeader title="Данные для входа" />
          <CardContent className="grid gap-3">
            {demoEnabled && (
              <div aria-live="polite">
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Быстрый вход для demo</div>
                <div className="flex flex-wrap gap-2">
                  {demoAccounts.map((account) => (
                    <Button
                      key={account.label}
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={loading}
                      onClick={() => void handleDemoLogin(account)}
                    >
                      {account.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Field label="Email" htmlFor="login-email">
              <Input
                id="login-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                placeholder="name@company.com"
                aria-describedby={error ? 'login-error' : undefined}
              />
            </Field>

            <Field label="Пароль" htmlFor="login-password">
              <Input
                id="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading && email && password) {
                    e.preventDefault()
                    void handleLogin()
                  }
                }}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                aria-describedby={error ? 'login-error' : undefined}
              />
            </Field>

            <Button
              className="gap-2"
              disabled={loading || !email.trim() || !password}
              onClick={() => void handleLogin()}
            >
              <LogIn className="size-4" />
              Войти
            </Button>

            {error ? <div id="login-error" role="alert" className="text-sm text-red-600">{error}</div> : null}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <ButtonLink to="/request-access" variant="secondary" size="sm">
                Запросить доступ
              </ButtonLink>
              <ButtonLink to="/register" variant="secondary" size="sm">
                Регистрация
              </ButtonLink>
            </div>
          </CardContent>
        </Card>

        <div className="rounded-2xl border border-border bg-white p-5">
          <div className="flex items-start gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-brand-yellow-soft text-brand-blue">
              <Lock className="size-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">Закрытый доступ</div>
              <div className="mt-1 text-sm text-slate-600">
                Silk Road Hub — закрытая B2B-платформа. Если у вас нет доступа, отправьте заявку на подтверждение компании.
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-slate-700">{label}</label>
      {children}
    </div>
  )
}
