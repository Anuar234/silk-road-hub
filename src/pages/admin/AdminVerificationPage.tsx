import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Clock, Users } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { apiGetUsers, apiVerifyUser } from '../../adapters/usersApi'
import type { ApiUser, VerificationStatus } from '../../adapters/authApi'

export function AdminVerificationPage() {
  const [users, setUsers] = useState<ApiUser[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | VerificationStatus>('pending')

  useEffect(() => {
    void apiGetUsers()
      .then(setUsers)
      .finally(() => setLoading(false))
  }, [])

  const handleVerify = async (userId: string, status: VerificationStatus) => {
    const updated = await apiVerifyUser(userId, status)
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
  }

  const filtered = filter === 'all' ? users : users.filter((u) => u.verificationStatus === filter)

  if (loading) {
    return <div className="py-6 text-sm text-slate-500">Загрузка...</div>
  }

  const pendingCount = users.filter((u) => u.verificationStatus === 'pending').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Верификация пользователей</h1>
        <p className="mt-1 text-sm text-slate-600">
          Заявки на верификацию от зарегистрированных пользователей
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterButton active={filter === 'pending'} onClick={() => setFilter('pending')}>
          Ожидают ({pendingCount})
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

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-3 py-8">
            <Users className="size-5 text-slate-400" />
            <span className="text-sm text-slate-500">Нет пользователей в этой категории</span>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((user) => (
            <Card key={user.id}>
              <CardHeader title={user.displayName} />
              <CardContent className="grid gap-3">
                <div className="grid gap-1 text-sm">
                  <Row label="Email" value={user.email} />
                  <Row label="Роль" value={user.role === 'seller' ? 'Продавец' : user.role === 'buyer' ? 'Покупатель' : 'Админ'} />
                  {user.companyName && <Row label="Компания" value={user.companyName} />}
                  {user.bin && <Row label="БИН" value={user.bin} />}
                  {user.phone && <Row label="Телефон" value={user.phone} />}
                  <Row label="Документы" value={user.companyDocs.length > 0 ? `${user.companyDocs.length} файл(ов)` : 'Не загружены'} />
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge status={user.verificationStatus} />

                  {user.verificationStatus !== 'verified' && (
                    <Button size="sm" variant="primary" className="gap-1.5" onClick={() => void handleVerify(user.id, 'verified')}>
                      <CheckCircle className="size-3.5" />
                      Подтвердить
                    </Button>
                  )}
                  {user.verificationStatus !== 'rejected' && (
                    <Button size="sm" variant="secondary" className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50" onClick={() => void handleVerify(user.id, 'rejected')}>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-28 shrink-0 text-slate-500">{label}:</span>
      <span className="text-slate-900">{value}</span>
    </div>
  )
}

function StatusBadge({ status }: { status: VerificationStatus }) {
  if (status === 'verified') return <Badge tone="success"><CheckCircle className="mr-1 size-3" />Верифицирован</Badge>
  if (status === 'rejected') return <Badge tone="warning"><XCircle className="mr-1 size-3" />Отклонён</Badge>
  return <Badge tone="warning"><Clock className="mr-1 size-3" />Ожидает</Badge>
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${active ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
    >
      {children}
    </button>
  )
}
