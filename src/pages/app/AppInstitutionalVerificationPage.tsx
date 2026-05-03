import { useEffect, useMemo, useState } from 'react'
import { CheckCircle, XCircle, Clock, Users } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { Badge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { Input } from '@shared/ui/Input'
import { apiGetUsers, apiVerifyUser } from '@shared/api/usersApi'
import type { ApiUser, VerificationStatus } from '@shared/api/authApi'

/**
 * Institutional verification queue (ТЗ §4.4).
 * Mirrors AdminVerificationPage but lives inside AppLayout so QazTrade /
 * KazakhExport / Kazakh Invest reviewers don't need admin-panel access.
 */
export function AppInstitutionalVerificationPage() {
  const [users, setUsers] = useState<ApiUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | VerificationStatus>('pending')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    void apiGetUsers()
      .then((list) => {
        if (!cancelled) setUsers(list)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Не удалось загрузить пользователей.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleVerify = async (userId: string, status: VerificationStatus) => {
    try {
      const updated = await apiVerifyUser(userId, status)
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось обновить статус.')
    }
  }

  const filtered = useMemo(() => {
    const byStatus = filter === 'all' ? users : users.filter((u) => u.verificationStatus === filter)
    const q = search.trim().toLowerCase()
    if (!q) return byStatus
    return byStatus.filter((u) =>
      [u.displayName, u.email, u.companyName, u.bin].some((v) => (v ?? '').toLowerCase().includes(q)),
    )
  }, [users, filter, search])

  const counts = useMemo(() => {
    return {
      pending: users.filter((u) => u.verificationStatus === 'pending').length,
      verified: users.filter((u) => u.verificationStatus === 'verified').length,
      rejected: users.filter((u) => u.verificationStatus === 'rejected').length,
    }
  }, [users])

  if (loading) return <div className="py-6 text-sm text-slate-500">Загрузка очереди верификаций…</div>

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Очередь верификации</h1>
        <p className="mt-1 text-sm text-slate-600">
          Заявки от зарегистрированных компаний на подтверждение KYC. Подтверждение открывает доступ к переговорам и сделкам.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Ожидают проверки" value={counts.pending} tone="amber" />
        <KpiCard label="Подтверждены" value={counts.verified} tone="emerald" />
        <KpiCard label="Отклонены" value={counts.rejected} tone="rose" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <FilterButton active={filter === 'pending'} onClick={() => setFilter('pending')}>
            Ожидают ({counts.pending})
          </FilterButton>
          <FilterButton active={filter === 'verified'} onClick={() => setFilter('verified')}>
            Верифицированы
          </FilterButton>
          <FilterButton active={filter === 'rejected'} onClick={() => setFilter('rejected')}>
            Отклонены
          </FilterButton>
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
            Все
          </FilterButton>
        </div>
        <div className="max-w-sm flex-1">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск: имя, email, компания, БИН"
          />
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-3 py-8">
            <Users className="size-5 text-slate-400" />
            <span className="text-sm text-slate-500">В этой категории пользователей нет.</span>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((user) => (
            <Card key={user.id}>
              <CardHeader title={user.displayName} subtitle={user.companyName ?? undefined} />
              <CardContent className="grid gap-3">
                <div className="grid gap-1 text-sm">
                  <Row label="Email" value={user.email} />
                  <Row label="Роль" value={roleLabel(user.role)} />
                  {user.bin && <Row label="БИН" value={user.bin} />}
                  {user.position && <Row label="Должность" value={user.position} />}
                  {user.phone && <Row label="Телефон" value={user.phone} />}
                  <Row
                    label="Документы"
                    value={user.companyDocs.length > 0 ? `${user.companyDocs.length} файл(ов)` : 'Не загружены'}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={user.verificationStatus} />
                  {user.verificationStatus !== 'verified' && (
                    <Button size="sm" variant="primary" className="gap-1.5" onClick={() => void handleVerify(user.id, 'verified')}>
                      <CheckCircle className="size-3.5" />
                      Подтвердить
                    </Button>
                  )}
                  {user.verificationStatus !== 'rejected' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="gap-1.5 border-rose-200 text-rose-600 hover:bg-rose-50"
                      onClick={() => void handleVerify(user.id, 'rejected')}
                    >
                      <XCircle className="size-3.5" />
                      Отклонить
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function roleLabel(role: ApiUser['role']): string {
  switch (role) {
    case 'seller':
      return 'Экспортёр / Продавец'
    case 'buyer':
      return 'Покупатель'
    case 'investor':
      return 'Инвестор'
    case 'institutional':
      return 'Институциональный пользователь'
    case 'admin':
      return 'Администратор'
    default:
      return role
  }
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-28 shrink-0 text-slate-500">{label}:</span>
      <span className="text-slate-900">{value}</span>
    </div>
  )
}

function StatusBadge({ status }: { status: VerificationStatus }) {
  if (status === 'verified')
    return (
      <Badge tone="success">
        <CheckCircle className="mr-1 size-3" />
        Верифицирован
      </Badge>
    )
  if (status === 'rejected')
    return (
      <Badge tone="warning">
        <XCircle className="mr-1 size-3" />
        Отклонён
      </Badge>
    )
  return (
    <Badge tone="warning">
      <Clock className="mr-1 size-3" />
      Ожидает
    </Badge>
  )
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {children}
    </button>
  )
}

function KpiCard({ label, value, tone }: { label: string; value: number; tone: 'amber' | 'emerald' | 'rose' }) {
  const toneClasses =
    tone === 'amber'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : tone === 'emerald'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
        : 'border-rose-200 bg-rose-50 text-rose-900'
  return (
    <div className={`rounded-2xl border ${toneClasses} px-4 py-3`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="mt-0.5 text-sm">{label}</div>
    </div>
  )
}
