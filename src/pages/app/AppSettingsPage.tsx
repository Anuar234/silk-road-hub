import { Building2, CheckCircle, Mail, User } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { useAuth } from '../../auth/auth'

export function AppSettingsPage() {
  const auth = useAuth()
  const isSeller = auth.role === 'seller'

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Аккаунт" subtitle="Тип и верификация" />
        <CardContent className="grid gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-slate-100">
              <User className="size-5 text-slate-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {isSeller ? 'Продавец' : 'Покупатель'}
              </div>
              <div className="text-sm text-slate-600">{auth.displayName ?? auth.email ?? '—'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-slate-50/50 px-3 py-2">
            {auth.verified ? (
              <CheckCircle className="size-4 text-emerald-600" />
            ) : (
              <Mail className="size-4 text-slate-500" />
            )}
            <span className="text-sm text-slate-700">
              {isSeller
                ? auth.verified
                  ? 'Компания подтверждена'
                  : 'На проверке (БИН, должность)'
                : auth.verified
                  ? 'Верифицирован (в сделке)'
                  : 'Верификация по email'}
            </span>
          </div>
        </CardContent>
      </Card>

      {isSeller && (auth.companyName || auth.bin || auth.position) && (
        <Card>
          <CardHeader title="Компания" subtitle="Данные продавца" />
          <CardContent className="grid gap-3">
            {auth.companyName && (
              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-slate-500" />
                <span className="text-sm text-slate-700">{auth.companyName}</span>
              </div>
            )}
            {auth.bin && (
              <div className="text-sm text-slate-600">
                <span className="text-slate-500">БИН:</span> {auth.bin}
              </div>
            )}
            {auth.position && (
              <div className="text-sm text-slate-600">
                <span className="text-slate-500">Должность:</span> {auth.position}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-slate-600">
            Изменение email, пароля и данных компании — через поддержку{' '}
            <a className="font-medium text-brand-blue transition-opacity duration-200 hover:underline hover:opacity-90" href="mailto:hello@silkroadhub.io">
              hello@silkroadhub.io
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
