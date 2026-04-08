import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { DEAL_STATUS_LABELS, DEAL_STATUS_TONE, getAllDeals, getDealProduct, getDealSeller, type DealStatus } from '../../data/dealData'
import { usePlatformDataVersion } from '../../hooks/usePlatformDataVersion'

const STATUS_OPTIONS: Array<DealStatus | ''> = [
  '',
  'new',
  'under_review',
  'waiting_buyer_info',
  'waiting_seller_info',
  'documents_preparation',
  'negotiating',
  'approved',
  'completed',
  'cancelled',
]

export function AdminDealsPage() {
  const [statusFilter, setStatusFilter] = useState<DealStatus | ''>('')
  const [search, setSearch] = useState('')
  const [buyerFilter, setBuyerFilter] = useState('')
  const [managerFilter, setManagerFilter] = useState('')
  const [missingDocsOnly, setMissingDocsOnly] = useState(false)
  const version = usePlatformDataVersion()

  const allDeals = useMemo(() => getAllDeals(), [version])
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return allDeals.filter((deal) => {
      if (statusFilter && deal.status !== statusFilter) return false
      if (buyerFilter.trim() && !deal.buyerId.toLowerCase().includes(buyerFilter.trim().toLowerCase())) return false
      if (managerFilter.trim() && !(deal.assignedManager ?? '').toLowerCase().includes(managerFilter.trim().toLowerCase())) return false
      if (missingDocsOnly && !deal.documents.some((doc) => ['requested', 'missing_info', 'rejected'].includes(doc.status))) return false
      if (!query) return true
      const product = getDealProduct(deal)
      const seller = getDealSeller(deal)
      return [deal.id, deal.destinationCountry, deal.buyerId, deal.assignedManager, product?.name, seller?.name].some((value) => (value ?? '').toLowerCase().includes(query))
    })
  }, [allDeals, buyerFilter, managerFilter, missingDocsOnly, search, statusFilter])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const deal of allDeals) counts[deal.status] = (counts[deal.status] || 0) + 1
    return counts
  }, [allDeals])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Сделки</h1>

      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status || 'all'}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === status ? 'border-brand-blue bg-brand-blue/5 text-brand-blue' : 'border-border text-slate-600 hover:bg-slate-50'}`}
          >
            {status ? `${DEAL_STATUS_LABELS[status]} (${statusCounts[status] || 0})` : `Все (${allDeals.length})`}
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-4">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск по ID, товару, продавцу..." />
        <Input value={buyerFilter} onChange={(event) => setBuyerFilter(event.target.value)} placeholder="Фильтр по покупателю" />
        <Input value={managerFilter} onChange={(event) => setManagerFilter(event.target.value)} placeholder="Фильтр по менеджеру" />
        <label className="flex min-h-[44px] items-center gap-2 rounded-xl border border-border bg-white px-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={missingDocsOnly}
            onChange={(event) => setMissingDocsOnly(event.target.checked)}
            className="rounded border-border"
          />
          Только с missing docs
        </label>
      </div>

      <Card>
        <CardHeader title={`Результаты (${filtered.length})`} subtitle="Единый admin pipeline по всем DealCase" />
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase text-slate-500">
                <th className="pb-3 pr-4">Сделка</th>
                <th className="pb-3 pr-4">Товар</th>
                <th className="pb-3 pr-4">Продавец</th>
                <th className="pb-3 pr-4">Покупатель</th>
                <th className="pb-3 pr-4">Документы</th>
                <th className="pb-3 pr-4">Статус</th>
                <th className="pb-3 pr-4">Менеджер</th>
                <th className="pb-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((deal) => {
                const product = getDealProduct(deal)
                const seller = getDealSeller(deal)
                const blockers = deal.documents.filter((doc) => ['requested', 'missing_info', 'rejected'].includes(doc.status)).length
                return (
                  <tr key={deal.id} className="transition-colors hover:bg-slate-50">
                    <td className="py-3 pr-4">
                      <div className="font-mono text-xs text-slate-500">{deal.id}</div>
                      <div className="text-xs text-slate-500">{new Date(deal.createdAt).toLocaleDateString('ru-RU')}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-medium text-slate-900">{product?.name ?? '—'}</div>
                      <div className="text-xs text-slate-500">{deal.destinationCountry} · {deal.quantity}</div>
                    </td>
                    <td className="py-3 pr-4 text-slate-700">{seller?.name ?? deal.sellerId}</td>
                    <td className="py-3 pr-4 text-slate-700">{deal.buyerId}</td>
                    <td className="py-3 pr-4">
                      <div className="text-slate-700">{deal.documents.length}</div>
                      <div className="text-xs text-amber-600">Блокеры: {blockers}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge tone="neutral" className={DEAL_STATUS_TONE[deal.status]}>{DEAL_STATUS_LABELS[deal.status]}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{deal.assignedManager ?? '—'}</td>
                    <td className="py-3">
                      <Link to={`/admin/deals/${deal.id}`} className="inline-flex items-center gap-1 text-brand-blue hover:underline">
                        Открыть <ArrowRight className="size-3" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Сделок не найдено.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
