import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, FolderOpen, Mail, Package, ShoppingBag } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { Badge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { useAuth } from '@features/auth/auth'
import { useT } from '@features/i18n/i18n'
import { getDealProduct, DEAL_STATUS_LABELS, DEAL_STATUS_TONE } from '@features/deals/dealData'
import { products } from '@mocks/mockData'
import { appProducts } from '@mocks/appMockData'
import { getDealsForAuth, getUnreadCountForAuth } from '@features/platform/platformSelectors'
import { getSellerIdFromAuth } from '@features/messaging/messagingData'
import { usePlatformDataVersion } from '@shared/hooks/usePlatformDataVersion'
import { AppInvestorHomePage } from '@pages/app/AppInvestorHomePage'
import { AppInstitutionalHomePage } from '@pages/app/AppInstitutionalHomePage'

export function AppHomePage() {
  const auth = useAuth()

  if (auth.role === 'seller') return <SellerDashboard />
  if (auth.role === 'investor') return <AppInvestorHomePage />
  if (auth.role === 'institutional') return <AppInstitutionalHomePage />
  return <BuyerDashboard />
}

function BuyerDashboard() {
  const auth = useAuth()
  const version = usePlatformDataVersion()
  const myDeals = useMemo(() => getDealsForAuth(auth), [auth, version])
  const activeDeals = useMemo(() => myDeals.filter((d) => !['completed', 'cancelled'].includes(d.status)), [myDeals])
  const unread = useMemo(() => getUnreadCountForAuth(auth), [auth, version])
  const recentDeals = useMemo(() => myDeals.slice(0, 5), [myDeals])
  const recommended = useMemo(() => {
    return selectStableProducts(products, 'buyer-demo').slice(0, 4)
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">{useT()('home.buyer.title', 'Кабинет покупателя')}</h1>

      <Card className="border-brand-blue/10 bg-gradient-to-br from-white to-brand-blue/5">
        <CardContent className="flex flex-col gap-3 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">Ваш следующий шаг</div>
            <div className="mt-1 text-sm text-slate-600">
              Найдите товар в каталоге, откройте переписку с продавцом и переводите договорённость в сделку без потери контекста.
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
            <span className="rounded-full border border-border bg-white px-3 py-1.5">Каталог</span>
            <span className="rounded-full border border-border bg-white px-3 py-1.5">Переписка</span>
            <span className="rounded-full border border-border bg-white px-3 py-1.5">DealCase</span>
            <span className="rounded-full border border-border bg-white px-3 py-1.5">Документы</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <QuickStat icon={<FolderOpen className="size-5 text-brand-blue" />} label="Активные сделки" value={activeDeals.length} />
        <QuickStat icon={<Mail className="size-5 text-amber-600" />} label="Непрочитанные" value={unread} />
        <QuickStat icon={<ShoppingBag className="size-5 text-emerald-600" />} label="Всего сделок" value={myDeals.length} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/app/catalog"><Button variant="primary" size="sm" className="gap-2"><Package className="size-4" /> Каталог</Button></Link>
        <Link to="/app/messages"><Button variant="secondary" size="sm" className="gap-2"><Mail className="size-4" /> Сообщения</Button></Link>
        <Link to="/app/deals"><Button variant="secondary" size="sm" className="gap-2"><FolderOpen className="size-4" /> Мои сделки</Button></Link>
      </div>

      {recentDeals.length > 0 && (
        <Card>
          <CardHeader title="Последние сделки" />
          <CardContent className="divide-y divide-border">
            {recentDeals.map((deal) => {
              const product = getDealProduct(deal)
              return (
                <Link key={deal.id} to={`/app/deals/${deal.id}`} className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-slate-50">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{product?.name ?? '—'}</div>
                    <div className="text-xs text-slate-500">{deal.quantity} → {deal.destinationCountry}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="neutral" className={DEAL_STATUS_TONE[deal.status]}>{DEAL_STATUS_LABELS[deal.status]}</Badge>
                    <ArrowRight className="size-4 text-slate-400" />
                  </div>
                </Link>
              )
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader title="Рекомендуемые товары" />
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {recommended.map((p) => (
              <Link key={p.id} to={`/app/catalog/product/${p.slug}`} className="rounded-xl border border-border p-3 transition-colors hover:bg-slate-50">
                <div className="text-sm font-medium text-slate-900">{p.name}</div>
                <div className="mt-1 text-xs text-slate-500">{p.seller.name} · {p.price}</div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SellerDashboard() {
  const auth = useAuth()
  const version = usePlatformDataVersion()
  const mySellerId = useMemo(() => getSellerIdFromAuth(auth), [auth])
  const allMyDeals = useMemo(() => getDealsForAuth(auth), [auth, version])
  const activeDeals = useMemo(() => allMyDeals.filter((d) => !['completed', 'cancelled'].includes(d.status)), [allMyDeals])
  const unread = useMemo(() => getUnreadCountForAuth(auth), [auth, version])
  const recentDeals = useMemo(() => allMyDeals.slice(0, 5), [allMyDeals])

  const productStats = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const p of appProducts) counts[p.status] = (counts[p.status] || 0) + 1
    return counts
  }, [])

  const recommended = useMemo(() => {
    const otherSellers = products.filter((p) => p.seller.id !== mySellerId)
    return selectStableProducts(otherSellers, mySellerId ?? 'seller-demo').slice(0, 4)
  }, [mySellerId])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">{useT()('home.seller.title', 'Кабинет продавца')}</h1>

      <Card className="border-brand-blue/10 bg-gradient-to-br from-white to-brand-blue/5">
        <CardContent className="flex flex-col gap-3 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">Операционный фокус</div>
            <div className="mt-1 text-sm text-slate-600">
              Следите за сообщениями, подтверждайте интерес покупателей, загружайте документы и держите сделки в одном процессе.
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
            <span className="rounded-full border border-border bg-white px-3 py-1.5">Мои товары</span>
            <span className="rounded-full border border-border bg-white px-3 py-1.5">Покупатели</span>
            <span className="rounded-full border border-border bg-white px-3 py-1.5">Документы</span>
            <span className="rounded-full border border-border bg-white px-3 py-1.5">Статусы</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-4">
        <QuickStat icon={<FolderOpen className="size-5 text-brand-blue" />} label="Активные сделки" value={activeDeals.length} />
        <QuickStat icon={<Package className="size-5 text-emerald-600" />} label="Товаров" value={appProducts.length} />
        <QuickStat icon={<ShoppingBag className="size-5 text-purple-600" />} label="Покупаю" value={allMyDeals.filter((deal) => deal.buyerId === mySellerId).length} />
        <QuickStat icon={<Mail className="size-5 text-amber-600" />} label="Непрочитанные" value={unread} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/app/products"><Button variant="primary" size="sm" className="gap-2"><Package className="size-4" /> Мои товары</Button></Link>
        <Link to="/app/catalog"><Button variant="secondary" size="sm" className="gap-2"><Package className="size-4" /> Каталог</Button></Link>
        <Link to="/app/messages"><Button variant="secondary" size="sm" className="gap-2"><Mail className="size-4" /> Сообщения</Button></Link>
        <Link to="/app/deals"><Button variant="secondary" size="sm" className="gap-2"><FolderOpen className="size-4" /> Сделки</Button></Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {recentDeals.length > 0 && (
          <Card>
            <CardHeader title="Сделки" subtitle="Входящие и исходящие" />
            <CardContent className="divide-y divide-border">
              {recentDeals.map((deal) => {
                const product = getDealProduct(deal)
                const amBuyer = deal.buyerId === mySellerId
                return (
                  <Link key={deal.id} to={`/app/deals/${deal.id}`} className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-slate-50">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">{product?.name ?? '—'}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${amBuyer ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {amBuyer ? 'Покупаю' : 'Продаю'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">{deal.quantity} → {deal.destinationCountry}</div>
                    </div>
                    <Badge tone="neutral" className={DEAL_STATUS_TONE[deal.status]}>{DEAL_STATUS_LABELS[deal.status]}</Badge>
                  </Link>
                )
              })}
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          <Card>
            <CardHeader title="Товары по статусам" />
            <CardContent>
              <div className="grid gap-2">
                {Object.entries(productStats).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                    <span className="text-slate-700">{status}</span>
                    <span className="font-mono font-medium text-slate-900">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {recommended.length > 0 && (
            <Card>
              <CardHeader title="Товары других продавцов" subtitle="Можете закупить" />
              <CardContent>
                <div className="grid gap-2">
                  {recommended.map((p) => (
                    <Link key={p.id} to={`/app/catalog/product/${p.slug}`} className="rounded-xl border border-border p-3 transition-colors hover:bg-slate-50">
                      <div className="text-sm font-medium text-slate-900">{p.name}</div>
                      <div className="mt-1 text-xs text-slate-500">{p.seller.name} · {p.price}</div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function selectStableProducts<T extends { id: string }>(items: T[], seed: string): T[] {
  return [...items].sort((left, right) => getStableScore(left.id, seed) - getStableScore(right.id, seed))
}

function getStableScore(value: string, seed: string): number {
  const source = `${seed}:${value}`
  let hash = 0
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) % 1000003
  }
  return hash
}

function QuickStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className="grid size-11 place-items-center rounded-xl bg-slate-100">{icon}</div>
        <div>
          <div className="text-2xl font-bold text-slate-900">{value}</div>
          <div className="text-sm text-slate-600">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}
