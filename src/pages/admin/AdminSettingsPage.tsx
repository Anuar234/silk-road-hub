import { Bell, ShieldCheck, UserCog } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { useAuth } from '../../auth/auth'

export function AdminSettingsPage() {
  const auth = useAuth()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Профиль администратора" subtitle="Изолированные настройки admin-панели" />
        <CardContent className="grid gap-4">
          <SettingRow icon={<UserCog className="size-4 text-slate-500" />} label="Пользователь" value={auth.displayName ?? auth.email ?? '—'} />
          <SettingRow icon={<ShieldCheck className="size-4 text-emerald-600" />} label="Роль" value="Администратор Silk Road Hub" />
          <SettingRow icon={<Bell className="size-4 text-amber-500" />} label="Уведомления" value="Системные, сделки, документы и запросы сторон" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Режим работы панели" />
        <CardContent className="grid gap-3 text-sm text-slate-600">
          <div className="rounded-2xl border border-border bg-slate-50 p-4">
            Админская панель теперь полностью отделена от buyer/seller кабинета: управление сделками, документами, сообщениями, пользователями и каталогом выполняется только внутри `/admin`.
          </div>
          <div className="rounded-2xl border border-border bg-slate-50 p-4">
            Изменение email, доступа и служебных политик выполняется через внутреннюю поддержку платформы.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SettingRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3">
      <div className="grid size-10 place-items-center rounded-xl bg-slate-100">{icon}</div>
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
        <div className="text-sm font-medium text-slate-900">{value}</div>
      </div>
    </div>
  )
}
