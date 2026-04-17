import { useEffect, useState } from 'react'
import { Building2, CheckCircle, Mail, Save, User } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { Input } from '@shared/ui/Input'
import { Button } from '@shared/ui/Button'
import { Badge } from '@shared/ui/Badge'
import { useAuth } from '@features/auth/auth'
import { apiUpdateProfile } from '@shared/api/authApi'

export function AppSettingsPage() {
  const auth = useAuth()
  const isSeller = auth.role === 'seller'

  const [displayName, setDisplayName] = useState(auth.displayName ?? '')
  const [phone, setPhone] = useState('')
  const [companyName, setCompanyName] = useState(auth.companyName ?? '')
  const [bin, setBin] = useState(auth.bin ?? '')
  const [position, setPosition] = useState(auth.position ?? '')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDisplayName(auth.displayName ?? '')
    setCompanyName(auth.companyName ?? '')
    setBin(auth.bin ?? '')
    setPosition(auth.position ?? '')
  }, [auth.displayName, auth.companyName, auth.bin, auth.position])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      await apiUpdateProfile({
        displayName,
        phone: phone || undefined,
        companyName: isSeller ? companyName : undefined,
        bin: isSeller ? bin : undefined,
        position: isSeller ? position : undefined,
      })
      await auth.refreshProfile()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

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
              <div className="text-sm text-slate-600">{auth.email ?? '—'}</div>
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

      <Card>
        <CardHeader title="Профиль" subtitle="Редактирование данных" />
        <CardContent className="grid gap-3">
          <Field label="Имя / Название">
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="ТОО «Company» или ФИО" />
          </Field>

          <Field label="Телефон">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 (7xx) xxx-xx-xx" />
          </Field>

          {isSeller && (
            <>
              <Field label="Название компании">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 shrink-0 text-slate-500" />
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="ТОО «Компания»" />
                </div>
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="БИН / ИИН">
                  <Input value={bin} onChange={(e) => setBin(e.target.value)} placeholder="12 цифр" />
                </Field>
                <Field label="Должность">
                  <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Директор, менеджер..." />
                </Field>
              </div>
            </>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="primary"
              disabled={saving || !displayName.trim()}
              onClick={() => void handleSave()}
              className="gap-2"
            >
              <Save className="size-4" />
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>

            {success && <Badge tone="success">Сохранено</Badge>}
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-slate-600">
            Изменение email и пароля — через поддержку{' '}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-slate-700">{label}</div>
      {children}
    </div>
  )
}
