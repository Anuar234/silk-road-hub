import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, Clock, XCircle } from 'lucide-react'
import { Container } from '@widgets/layout/Container'
import { Card, CardContent } from '@shared/ui/Card'
import { ButtonLink } from '@shared/ui/ButtonLink'
import { apiVerifyEmail } from '@shared/api/authApi'

type State = 'idle' | 'pending' | 'success' | 'error'

// Lands here from the link in the verification email. The token is in the
// query string; we POST it to /api/auth/verify-email and surface the outcome.
export function EmailVerifyPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [state, setState] = useState<State>(token ? 'pending' : 'error')
  const [error, setError] = useState<string>(token ? '' : 'Ссылка не содержит токен подтверждения.')

  useEffect(() => {
    if (!token) return
    let cancelled = false
    void apiVerifyEmail(token)
      .then(() => {
        if (!cancelled) setState('success')
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Не удалось подтвердить email.')
        setState('error')
      })
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <Container className="py-16">
      <Card className="mx-auto max-w-xl">
        <CardContent className="grid gap-4 p-8 text-center">
          {state === 'pending' && (
            <>
              <Clock className="mx-auto size-10 text-amber-500" />
              <h1 className="text-xl font-semibold text-slate-900">Подтверждаем email…</h1>
              <p className="text-sm text-slate-600">Это займёт пару секунд.</p>
            </>
          )}

          {state === 'success' && (
            <>
              <CheckCircle className="mx-auto size-10 text-emerald-600" />
              <h1 className="text-xl font-semibold text-slate-900">Email подтверждён</h1>
              <p className="text-sm text-slate-600">
                Вы можете войти в систему — статус «Почта подтверждена» уже отображается в кабинете.
              </p>
              <div className="flex justify-center">
                <ButtonLink to="/login" variant="primary" size="sm">Перейти ко входу</ButtonLink>
              </div>
            </>
          )}

          {state === 'error' && (
            <>
              <XCircle className="mx-auto size-10 text-rose-600" />
              <h1 className="text-xl font-semibold text-slate-900">Ссылка недействительна</h1>
              <p className="text-sm text-slate-600">{error}</p>
              <p className="text-sm text-slate-600">
                Войдите в кабинет и нажмите «Отправить ссылку повторно» в разделе «Верификация».
              </p>
              <div className="flex justify-center gap-3">
                <ButtonLink to="/login" variant="primary" size="sm">Войти</ButtonLink>
                <Link to="/" className="text-sm text-slate-600 underline-offset-2 hover:underline">На главную</Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </Container>
  )
}
