import { useState } from 'react'
import type React from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { apiRegister } from '@shared/api/authApi'
import { apiGetCsrfToken } from '@shared/api/authApi'
import { useAuth } from '@features/auth/auth'
import { Container } from '@widgets/layout/Container'
import { Button } from '@shared/ui/Button'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { Input } from '@shared/ui/Input'

type SelectedRole = 'buyer' | 'seller' | 'investor'

export function RegisterPage() {
  const navigate = useNavigate()
  const auth = useAuth()

  const [step, setStep] = useState<'role' | 'form'>('role')
  const [role, setRole] = useState<SelectedRole>('buyer')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [bin, setBin] = useState('')
  const [position, setPosition] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Введите корректный email')
      setLoading(false)
      return
    }
    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов')
      setLoading(false)
      return
    }

    try {
      // ensure CSRF token exists before registration
      await apiGetCsrfToken()
      await apiRegister({
        email,
        password,
        displayName,
        role,
        phone: phone || undefined,
        companyName: companyName || undefined,
        bin: bin || undefined,
        position: position || undefined,
      })
      // After registration the session cookie is set, reload auth
      await auth.login({ email, password })
      if (role === 'seller' || role === 'investor') {
        navigate('/app/verification', { replace: true })
      } else {
        navigate('/app/home', { replace: true })
      }
    } catch (e) {
      setError((e as Error).message || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'role') {
    return (
      <Container className="py-12">
        <div className="mx-auto grid max-w-xl gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Регистрация</h1>
            <p className="mt-2 text-base text-slate-600">Выберите вашу роль на платформе</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <RoleCard
              title="Покупатель / Импортёр"
              description="Ищу поставщиков и товары для импорта. Хочу отправлять запросы и заключать сделки."
              selected={role === 'buyer'}
              onClick={() => setRole('buyer')}
            />
            <RoleCard
              title="Экспортёр / Продавец"
              description="Размещаю товары в каталоге, принимаю запросы от покупателей и веду сделки."
              selected={role === 'seller'}
              onClick={() => setRole('seller')}
            />
            <RoleCard
              title="Инвестор"
              description="Просматриваю инвестиционные проекты, отправляю запросы, размещаю собственные инициативы."
              selected={role === 'investor'}
              onClick={() => setRole('investor')}
            />
          </div>
          <p className="text-xs text-slate-500">
            Кабинет институционального пользователя (QazTrade, KazakhExport, Kazakh Invest и партнёры) предоставляется
            администратором платформы по запросу и не доступен для открытой регистрации.
          </p>

          <Button onClick={() => setStep('form')} className="gap-2">
            <UserPlus className="size-4" />
            Продолжить
          </Button>
        </div>
      </Container>
    )
  }

  return (
    <Container className="py-12">
      <div className="mx-auto grid max-w-xl gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Регистрация</h1>
          <p className="mt-2 text-base text-slate-600">
            {role === 'seller' ? 'Заполните данные компании-экспортёра' : 'Заполните данные для доступа к платформе'}
          </p>
        </div>

        <Card>
          <CardHeader title="Данные аккаунта" />
          <CardContent className="grid gap-3">
            <Field label="Имя / Название *" htmlFor="reg-name">
              <Input id="reg-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="ТОО «Company» или ФИО" />
            </Field>

            <Field label="Email *" htmlFor="reg-email">
              <Input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
            </Field>

            <Field label="Пароль *" htmlFor="reg-password">
              <Input id="reg-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Минимум 6 символов" />
            </Field>

            <Field label="Телефон" htmlFor="reg-phone">
              <Input id="reg-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 (7xx) xxx-xx-xx" />
            </Field>

            {role === 'seller' || role === 'investor' ? (
              <>
                <Field label={role === 'investor' ? 'Название организации / фонда *' : 'Название компании *'} htmlFor="reg-company">
                  <Input id="reg-company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="ТОО «Компания»" />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="БИН / ИИН" htmlFor="reg-bin">
                    <Input id="reg-bin" value={bin} onChange={(e) => setBin(e.target.value)} placeholder="12 цифр" />
                  </Field>
                  <Field label="Должность" htmlFor="reg-position">
                    <Input id="reg-position" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Директор, менеджер..." />
                  </Field>
                </div>
              </>
            ) : null}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="secondary" onClick={() => setStep('role')}>Назад</Button>
              <Button
                disabled={loading || !email || !password || !displayName || ((role === 'seller' || role === 'investor') && !companyName)}
                onClick={() => void handleSubmit()}
                className="gap-2"
              >
                <UserPlus className="size-4" />
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
              </Button>
            </div>

            {error ? <div role="alert" className="text-sm text-red-600">{error}</div> : null}
          </CardContent>
        </Card>

        <div className="rounded-2xl border border-border bg-white p-5 text-sm text-slate-600">
          После регистрации вы попадёте в личный кабинет. Для полного доступа потребуется загрузить документы верификации и дождаться проверки администратором.
        </div>
      </div>
    </Container>
  )
}

function RoleCard({ title, description, selected, onClick }: { title: string; description: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border-2 p-5 text-left transition-colors ${selected ? 'border-brand-blue bg-brand-blue/5' : 'border-border bg-white hover:border-slate-300'}`}
    >
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{description}</div>
    </button>
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
