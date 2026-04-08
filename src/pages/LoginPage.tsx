import { Lock, LogIn } from 'lucide-react'
import { useMemo, useState } from 'react'
import type React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getNavigationFrom } from '../adapters/navigationState'
import { useAuth } from '../auth/auth'
import { Container } from '../components/layout/Container'
import { Button } from '../components/ui/Button'
import { ButtonLink } from '../components/ui/ButtonLink'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'

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
  const demoEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN !== 'false'
  const demoAccounts = [
    { label: 'Покупатель', login: 'Test', password: 'Test123' },
    { label: 'Продавец', login: 'Test123', password: 'Test123' },
    { label: 'Админ', login: 'Admin', password: 'Admin' },
  ] as const

  const handleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await auth.login({ email, password })
      const target = result.role === 'admin' ? '/admin/dashboard' : from
      navigate(target, { replace: true })
    } catch (e) {
      setError((e as Error).message || 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container className="py-12">
      <div className="mx-auto grid max-w-xl gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Вход</h1>
          <p className="mt-2 text-base text-slate-600">Логин + пароль</p>
        </div>

        <Card>
          <CardHeader title="Введите данные" />
          <CardContent className="grid gap-3">
            <div aria-live="polite">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Быстрый вход для демо</div>
              <div className="flex flex-wrap gap-2">
                {demoEnabled ? (
                  demoAccounts.map((account) => (
                    <Button
                      key={account.label}
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEmail(account.login)
                        setPassword(account.password)
                      }}
                    >
                      {account.label}
                    </Button>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">Демо-аккаунты отключены в production.</span>
                )}
              </div>
            </div>
            <Field label="Логин" htmlFor="login-email">
              <Input id="login-email" value={email} onChange={(e) => setEmail(e.target.value)} type="text" placeholder="name@company.com" aria-describedby={error ? 'login-error' : undefined} />
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
                placeholder="••••••••"
                aria-describedby={error ? 'login-error' : undefined}
              />
            </Field>

            <Button
              className="gap-2"
              disabled={loading || !email || !password}
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
              <div className="rounded-xl border border-border bg-slate-50 px-3 py-2 text-xs text-slate-600">
                {demoEnabled ? 'Для локального демо используйте быстрый вход.' : 'В production вход доступен только через серверные учетные записи.'}
              </div>
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
                Silk Road Hub — закрытая B2B‑платформа. Если у вас нет доступа, отправьте заявку на подтверждение компании.
              </div>
              {demoEnabled ? (
                <div className="mt-2 text-xs text-slate-500">
                  Покупатель: <span className="font-semibold">Test / Test123</span>. Продавец: <span className="font-semibold">Test123 / Test123</span>. Админ: <span className="font-semibold">Admin / Admin</span>.
                </div>
              ) : null}
              <div className="mt-2 text-xs text-slate-500">
                После входа покупатель попадает в рабочий кабинет и каталог, продавец в управление товарами и сделками, администратор в операционную панель.
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

