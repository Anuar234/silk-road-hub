import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, FolderOpen, Package } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../auth/auth'
import { getDealProduct, getDealSeller, DEAL_STATUS_LABELS, DEAL_STATUS_TONE } from '../../data/dealData'
import { getParticipantId, getSellerIdFromAuth } from '../../data/messagingData'
import { getDealsForAuth } from '../../data/platformSelectors'
import { usePlatformDataVersion } from '../../hooks/usePlatformDataVersion'

type TabKey = 'all' | 'active' | 'completed'

export function AppDealsPage() {
  const auth = useAuth()
  const [tab, setTab] = useState<TabKey>('all')
  const version = usePlatformDataVersion()

  const myId = useMemo(() => getParticipantId(auth), [auth])
  const mySellerId = useMemo(() => getSellerIdFromAuth(auth), [auth])
  const isSeller = auth.role === 'seller'

  const allDeals = useMemo(() => getDealsForAuth(auth), [auth, version])

  const filtered = useMemo(() => {
    if (tab === 'active') return allDeals.filter((d) => !['completed', 'cancelled'].includes(d.status))
    if (tab === 'completed') return allDeals.filter((d) => ['completed', 'cancelled'].includes(d.status))
    return allDeals
  }, [allDeals, tab])

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'all', label: 'Все', count: allDeals.length },
    { key: 'active', label: 'Активные', count: allDeals.filter((d) => !['completed', 'cancelled'].includes(d.status)).length },
    { key: 'completed', label: 'Завершённые', count: allDeals.filter((d) => ['completed', 'cancelled'].includes(d.status)).length },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Мои сделки</h1>

      <Card className="border-brand-blue/10 bg-gradient-to-br from-white to-brand-blue/5">
        <CardContent className="py-5 text-sm text-slate-600">
          Здесь собраны все DealCase по вашим переговорам. Откройте карточку сделки, чтобы увидеть статус, документы, историю изменений и общий поток с администратором.
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${tab === t.key ? 'border-brand-blue bg-brand-blue/5 text-brand-blue' : 'border-border text-slate-600 hover:bg-slate-50'}`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="mx-auto size-10 text-slate-300" />
            <p className="mt-3 text-sm text-slate-600">
              {tab === 'completed' ? 'Завершённых сделок пока нет.' : tab === 'active' ? 'Активных сделок сейчас нет.' : 'Сделок пока нет.'}
            </p>
            <Link to="/app/catalog" className="mt-4 inline-block">
              <Button variant="primary" size="sm" className="gap-2"><Package className="size-4" /> Перейти в каталог</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((deal) => {
            const product = getDealProduct(deal)
            const seller = getDealSeller(deal)
            const amBuyer = deal.buyerId === myId || deal.buyerId === mySellerId
            return (
              <Link key={deal.id} to={`/app/deals/${deal.id}`} className="block">
                <Card>
                  <CardContent className="flex flex-wrap items-center gap-4 py-4">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{product?.name ?? '—'}</span>
                        {isSeller && (
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${amBuyer ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                            {amBuyer ? 'Покупаю' : 'Продаю'}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {amBuyer ? `Продавец: ${seller?.name ?? '—'}` : `Покупатель: ${deal.buyerId}`} · {deal.quantity}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {deal.destinationCountry} · {deal.targetTimeline}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge tone="neutral" className={DEAL_STATUS_TONE[deal.status]}>{DEAL_STATUS_LABELS[deal.status]}</Badge>
                      {deal.totalValue && <span className="text-sm font-medium text-slate-700">{deal.totalValue}</span>}
                      <ArrowRight className="size-4 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
