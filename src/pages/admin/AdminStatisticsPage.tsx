import { useMemo } from 'react'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { getAverageDocumentPreparationDays, getAverageMessageToDealHours, getAverageResponseHours, getStatusCounts } from '@features/admin/adminData'
import { DEAL_STATUS_LABELS, DEAL_STATUS_TONE, getAllDeals, getDealProduct } from '@features/deals/dealData'
import { CATALOG_SECTORS } from '@features/catalog/catalogStructure'
import { usePlatformDataVersion } from '@shared/hooks/usePlatformDataVersion'

export function AdminStatisticsPage() {
  const version = usePlatformDataVersion()
  const deals = useMemo(() => getAllDeals(), [version])
  const statusCounts = useMemo(() => getStatusCounts(), [deals])
  const avgResponse = useMemo(() => getAverageResponseHours(), [deals])
  const avgMessageToDeal = useMemo(() => getAverageMessageToDealHours(), [deals])
  const avgDocDays = useMemo(() => getAverageDocumentPreparationDays(), [deals])

  const byCountry = useMemo(() => {
    const map: Record<string, number> = {}
    for (const deal of deals) map[deal.destinationCountry] = (map[deal.destinationCountry] || 0) + 1
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [deals])

  const bySector = useMemo(() => {
    const map: Record<string, number> = {}
    for (const deal of deals) {
      const product = getDealProduct(deal)
      const sectorName = CATALOG_SECTORS.find((sector) => sector.id === product?.sectorId)?.name ?? 'Другое'
      map[sectorName] = (map[sectorName] || 0) + 1
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [deals])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Статистика</h1>
      <p className="text-sm text-slate-600">
        Операционные метрики по скорости реакции, структуре спроса и загрузке deal workflow в офлайн-демо.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Средний ответ" value={avgResponse ? `${avgResponse.toFixed(1)} ч` : '—'} />
        <StatCard label="Сообщение → сделка" value={avgMessageToDeal ? `${avgMessageToDeal.toFixed(1)} ч` : '—'} />
        <StatCard label="Подготовка документов" value={avgDocDays ? `${avgDocDays.toFixed(1)} дн` : '—'} />
        <StatCard label="Всего сделок" value={deals.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Статусы" />
          <CardContent className="space-y-2">
            {Object.entries(DEAL_STATUS_LABELS).map(([status, label]) => (
              <div key={status} className="flex items-center gap-3 text-sm">
                <span className={`w-56 shrink-0 rounded-xl border px-3 py-1 ${DEAL_STATUS_TONE[status as keyof typeof DEAL_STATUS_TONE]}`}>{label}</span>
                <div className="flex-1 rounded-full bg-slate-100">
                  <div
                    className="h-3 rounded-full bg-brand-blue/70"
                    style={{ width: `${deals.length ? Math.max((statusCounts[status as keyof typeof statusCounts] / deals.length) * 100, 3) : 0}%` }}
                  />
                </div>
                <span className="w-8 text-right font-mono text-slate-600">{statusCounts[status as keyof typeof statusCounts]}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Страны назначения" />
          <CardContent className="space-y-2">
            {byCountry.map(([country, count]) => (
              <DataRow key={country} label={country} value={count} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Секторы" />
          <CardContent className="space-y-2">
            {bySector.map(([sector, count]) => (
              <DataRow key={sector} label={sector} value={count} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Ожидание информации" />
          <CardContent className="space-y-2">
            <DataRow label="Ждём покупателя" value={statusCounts.waiting_buyer_info} />
            <DataRow label="Ждём продавца" value={statusCounts.waiting_seller_info} />
            <DataRow label="На проверке" value={statusCounts.under_review} />
            <DataRow label="Документы" value={statusCounts.documents_preparation} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="py-5 text-center">
        <div className="text-3xl font-bold text-slate-900">{value}</div>
        <div className="mt-1 text-sm text-slate-600">{label}</div>
      </CardContent>
    </Card>
  )
}

function DataRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm">
      <span className="text-slate-700">{label}</span>
      <span className="font-mono text-slate-900">{value}</span>
    </div>
  )
}
