import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Building2, MessageSquare, ShoppingBag } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { getAdminUserById } from '../../data/adminData'
import { getAllDeals, getDealProduct, DEAL_STATUS_LABELS, DEAL_STATUS_TONE } from '../../data/dealData'
import { usePlatformDataVersion } from '../../hooks/usePlatformDataVersion'

export function AdminUserDetailPage() {
  const { id } = useParams()
  const version = usePlatformDataVersion()
  const user = useMemo(() => getAdminUserById(id ?? ''), [id, version])
  const relatedDeals = useMemo(() => getAllDeals().filter((deal) => deal.buyerId === id || deal.sellerId === id), [id, version])

  if (!user) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Пользователь не найден.</p>
        <Link to="/admin/users" className="text-sm font-medium text-brand-blue hover:underline">Вернуться к списку</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link to="/admin/users" className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900">
        <ArrowLeft className="size-4" />
        К пользователям
      </Link>

      <Card>
        <CardHeader title={user.name} subtitle={user.company ?? user.id} />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <InfoRow icon={<Building2 className="size-4 text-slate-500" />} label="Роль" value={user.role === 'seller' ? 'Продавец' : 'Покупатель'} />
          <InfoRow icon={<ShoppingBag className="size-4 text-slate-500" />} label="Активные сделки" value={String(user.activeDeals)} />
          <InfoRow icon={<ShoppingBag className="size-4 text-slate-500" />} label="Завершено" value={String(user.completedDeals)} />
          <InfoRow icon={<MessageSquare className="size-4 text-slate-500" />} label="Сообщения" value={String(user.messages)} />
          <div className="md:col-span-2">
            <div className="rounded-2xl border border-border bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Статус профиля:{' '}
              <span className="font-medium text-slate-900">{user.verified ? 'проверен и готов к работе в сделках' : 'на проверке, требует внимания команды'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Связанные сделки" subtitle={`${relatedDeals.length} записей`} />
        <CardContent className="space-y-3">
          {relatedDeals.map((deal) => {
            const product = getDealProduct(deal)
            return (
              <Link key={deal.id} to={`/admin/deals/${deal.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3 transition-colors hover:bg-slate-50">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{product?.name ?? deal.productId}</div>
                  <div className="text-xs text-slate-500">{deal.quantity} · {deal.destinationCountry}</div>
                </div>
                <Badge tone="neutral" className={DEAL_STATUS_TONE[deal.status]}>{DEAL_STATUS_LABELS[deal.status]}</Badge>
              </Link>
            )
          })}
          {relatedDeals.length === 0 && <p className="text-sm text-slate-500">У пользователя пока нет сделок.</p>}
        </CardContent>
      </Card>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
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
