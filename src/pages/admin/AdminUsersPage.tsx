import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Building2, User } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { getAdminUsers } from '../../data/adminData'
import { usePlatformDataVersion } from '../../hooks/usePlatformDataVersion'

export function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const version = usePlatformDataVersion()
  const users = useMemo(() => getAdminUsers(), [version])
  const sellersCount = users.filter((user) => user.role === 'seller').length
  const verifiedCount = users.filter((user) => user.verified).length

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return users
    return users.filter((user) => {
      return [user.id, user.name, user.company, user.country, user.city].some((value) => (value ?? '').toLowerCase().includes(query))
    })
  }, [search, users])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Пользователи</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="py-5">
            <div className="text-2xl font-bold text-slate-900">{users.length}</div>
            <div className="mt-1 text-sm text-slate-600">Всего профилей</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <div className="text-2xl font-bold text-slate-900">{sellersCount}</div>
            <div className="mt-1 text-sm text-slate-600">Продавцы</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <div className="text-2xl font-bold text-slate-900">{verifiedCount}</div>
            <div className="mt-1 text-sm text-slate-600">Проверенные</div>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-md">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск по имени, компании, стране..." />
      </div>

      <Card>
        <CardHeader title={`Каталог пользователей (${filtered.length})`} />
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase text-slate-500">
                <th className="pb-3 pr-4">Пользователь</th>
                <th className="pb-3 pr-4">Роль</th>
                <th className="pb-3 pr-4">Локация</th>
                <th className="pb-3 pr-4">Активные сделки</th>
                <th className="pb-3 pr-4">Завершено</th>
                <th className="pb-3 pr-4">Сообщения</th>
                <th className="pb-3 pr-4">Статус</th>
                <th className="pb-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-slate-50">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 place-items-center rounded-xl bg-slate-100">
                        {user.role === 'seller' ? <Building2 className="size-4 text-slate-600" /> : <User className="size-4 text-slate-600" />}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.company ?? user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge tone={user.role === 'seller' ? 'info' : 'neutral'}>{user.role === 'seller' ? 'Продавец' : 'Покупатель'}</Badge>
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{[user.city, user.country].filter(Boolean).join(', ') || '—'}</td>
                  <td className="py-3 pr-4 text-slate-700">{user.activeDeals}</td>
                  <td className="py-3 pr-4 text-slate-700">{user.completedDeals}</td>
                  <td className="py-3 pr-4 text-slate-700">{user.messages}</td>
                  <td className="py-3 pr-4">
                    <Badge tone={user.verified ? 'success' : 'warning'}>{user.verified ? 'Проверен' : 'На проверке'}</Badge>
                  </td>
                  <td className="py-3">
                    <Link to={`/admin/users/${user.id}`} className="inline-flex items-center gap-1 text-brand-blue hover:underline">
                      Открыть <ArrowRight className="size-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Пользователи не найдены.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
