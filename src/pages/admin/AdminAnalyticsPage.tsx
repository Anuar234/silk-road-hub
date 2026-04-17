import { useMemo } from 'react'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { getAdminFunnel, getTopProductsByDeals, getTopSellersByDeals } from '@features/admin/adminData'
import { getAllDeals } from '@features/deals/dealData'
import { usePlatformDataVersion } from '@shared/hooks/usePlatformDataVersion'

export function AdminAnalyticsPage() {
  const version = usePlatformDataVersion()
  const deals = useMemo(() => getAllDeals(), [version])
  const funnel = useMemo(() => getAdminFunnel(), [deals])
  const topProducts = useMemo(() => getTopProductsByDeals(10), [deals])
  const topSellers = useMemo(() => getTopSellersByDeals(10), [deals])

  const averageDocsPerDeal = useMemo(() => {
    if (!deals.length) return 0
    return deals.reduce((sum, deal) => sum + deal.documents.length, 0) / deals.length
  }, [deals])

  const readinessRate = useMemo(() => {
    if (!deals.length) return 0
    const ready = deals.filter((deal) => deal.readiness.readyForPreparation).length
    return Math.round((ready / deals.length) * 100)
  }, [deals])

  const maxFunnel = Math.max(...funnel.map((item) => item.count), 1)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Аналитика</h1>
      <p className="text-sm text-slate-600">
        Сводка по конверсии, качеству подготовки кейсов и самым результативным товарам и продавцам.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniCard label="Среднее кол-во документов" value={averageDocsPerDeal.toFixed(1)} />
        <MiniCard label="Готовность к подготовке" value={`${readinessRate}%`} />
        <MiniCard label="Одобрено / завершено" value={String(deals.filter((deal) => ['approved', 'completed'].includes(deal.status)).length)} />
        <MiniCard label="Отменено" value={String(deals.filter((deal) => deal.status === 'cancelled').length)} />
      </div>

      <Card>
        <CardHeader title="Конверсионная воронка" subtitle="Переписка → сделка → документы → завершено" />
        <CardContent className="space-y-3">
          {funnel.map((item, index) => {
            const prev = index === 0 ? item.count : funnel[index - 1].count
            const conversion = prev ? Math.round((item.count / prev) * 100) : 100
            return (
              <div key={item.label} className="flex items-center gap-3 text-sm">
                <span className="w-28 shrink-0 font-medium text-slate-700">{item.label}</span>
                <div className="flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-7 rounded-full bg-brand-blue/70 px-3 text-xs font-semibold leading-7 text-white" style={{ width: `${Math.max((item.count / maxFunnel) * 100, 8)}%` }}>
                    {item.count}
                  </div>
                </div>
                <span className="w-14 text-right text-xs text-slate-500">{index === 0 ? '—' : `${conversion}%`}</span>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Топ товаров по сделкам" />
          <CardContent>
            <RankedList items={topProducts.map((item) => ({ label: item.product.name, value: item.count }))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Топ продавцов по сделкам" />
          <CardContent>
            <RankedList items={topSellers.map((item) => ({ label: item.seller.name, value: item.count }))} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-5 text-center">
        <div className="text-3xl font-bold text-slate-900">{value}</div>
        <div className="mt-1 text-sm text-slate-600">{label}</div>
      </CardContent>
    </Card>
  )
}

function RankedList({ items }: { items: Array<{ label: string; value: number }> }) {
  if (!items.length) return <p className="text-sm text-slate-500">Нет данных.</p>
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={item.label} className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm">
          <span className="text-slate-900">
            <span className="mr-2 font-mono text-xs text-slate-400">{index + 1}.</span>
            {item.label}
          </span>
          <span className="font-mono font-medium text-slate-700">{item.value}</span>
        </div>
      ))}
    </div>
  )
}
