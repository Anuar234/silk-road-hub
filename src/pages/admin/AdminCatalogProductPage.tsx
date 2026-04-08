import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BadgeInfo, Factory, ShoppingBag } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { getAdminProductById } from '../../data/adminData'
import { DEAL_STATUS_LABELS, DEAL_STATUS_TONE } from '../../data/dealData'
import { usePlatformDataVersion } from '../../hooks/usePlatformDataVersion'

export function AdminCatalogProductPage() {
  const { id } = useParams()
  const version = usePlatformDataVersion()
  const product = useMemo(() => getAdminProductById(id ?? ''), [id, version])

  if (!product) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Товар не найден.</p>
        <Link to="/admin/catalog" className="text-sm font-medium text-brand-blue hover:underline">Вернуться к каталогу</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link to="/admin/catalog" className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900">
        <ArrowLeft className="size-4" />
        К каталогу
      </Link>

      <Card>
        <CardHeader title={product.name} subtitle={`${product.sectorName} · ${product.seller.name}`} />
        <CardContent className="grid gap-4 md:grid-cols-2">
          <MetaRow icon={<Factory className="size-4 text-slate-500" />} label="Продавец" value={`${product.seller.name} (${product.seller.country})`} />
          <MetaRow icon={<BadgeInfo className="size-4 text-slate-500" />} label="HS-код" value={product.hsCode} />
          <MetaRow icon={<ShoppingBag className="size-4 text-slate-500" />} label="MOQ" value={product.moq} />
          <MetaRow icon={<ShoppingBag className="size-4 text-slate-500" />} label="Incoterms" value={product.incoterms} />
          <div className="md:col-span-2">
            <div className="rounded-2xl border border-border bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Карточка используется в публичном каталоге и в buyer/seller flow. Через связанные сделки можно быстро открыть операционный контекст.
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Связанные сделки" subtitle={`${product.activeDeals.length} кейсов`} />
        <CardContent className="space-y-3">
          {product.activeDeals.map((deal) => (
            <Link key={deal.id} to={`/admin/deals/${deal.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3 transition-colors hover:bg-slate-50">
              <div>
                <div className="text-sm font-semibold text-slate-900">{deal.id}</div>
                <div className="text-xs text-slate-500">{deal.quantity} · {deal.destinationCountry}</div>
              </div>
              <Badge tone="neutral" className={DEAL_STATUS_TONE[deal.status]}>{DEAL_STATUS_LABELS[deal.status]}</Badge>
            </Link>
          ))}
          {product.activeDeals.length === 0 && <p className="text-sm text-slate-500">По товару пока нет сделок.</p>}
        </CardContent>
      </Card>
    </div>
  )
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
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
