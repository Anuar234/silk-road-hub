import { Link, useNavigate, useLocation, useParams } from 'react-router-dom'
import { Building2, Globe, MessageCircle } from 'lucide-react'
import { buildFromState, getNavigationFrom } from '@shared/api/navigationState'
import { Container } from '@widgets/layout/Container'
import { Badge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { Card, CardContent } from '@shared/ui/Card'
import { applyOfflineImageFallback } from '@shared/ui/imageFallback'
import { sellers, products } from '@mocks/mockData'
import { getSectorById } from '@features/catalog/catalogStructure'
import { useAuth } from '@features/auth/auth'
import { getSellerIdFromAuth } from '@features/messaging/messagingData'
import { getTrustBadgeLabel } from '@features/platform/trustBadges'

export function SellerDetailPage() {
  const { id } = useParams()
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const backTo = getNavigationFrom(location.state) ?? (location.search ? `/catalog${location.search}` : '/catalog')
  const seller = sellers.find((s) => s.id === id)
  const sellerProducts = seller ? products.filter((p) => p.seller.id === seller.id) : []
  const mySellerId = getSellerIdFromAuth(auth)
  const isOwnSellerProfile = auth.role === 'seller' && mySellerId === seller?.id

  if (!seller) {
    return (
      <Container className="py-10">
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="text-lg font-semibold text-slate-900">Продавец не найден</div>
          <Link to={backTo} className="mt-4 inline-block text-sm font-medium text-brand-blue hover:underline">
            В каталог
          </Link>
        </div>
      </Container>
    )
  }

  const mainSector = seller.mainSectorId ? getSectorById(seller.mainSectorId) : null

  const handleMessageSeller = () => {
    if (isOwnSellerProfile) return
    if (auth.isAuthenticated) {
      navigate(`/app/messages?seller=${seller.id}`)
    } else {
      navigate('/login', { state: buildFromState(`${location.pathname}${location.search}`) })
    }
  }

  return (
    <Container className="py-8 sm:py-10">
      <Link to={backTo} className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 transition-colors duration-200 hover:text-slate-900">
        ← Назад в каталог
      </Link>

      <Card className="mt-6 overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl border border-border bg-slate-50 text-3xl font-bold text-brand-blue">
              {seller.logoUrl ? <img src={seller.logoUrl} alt="" className="size-full rounded-2xl object-cover" onError={applyOfflineImageFallback} /> : <Building2 className="size-10" />}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{seller.name}</h1>
              <div className="mt-2 flex items-center gap-2 text-slate-600">
                <Globe className="size-4" />
                {seller.city}, {seller.country}
              </div>
              {mainSector && (
                <p className="mt-1 text-sm text-slate-500">Основной сектор: {mainSector.name}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {seller.trustBadges.map((b) => (
                  <Badge key={b} tone={b === 'Verified' ? 'success' : 'warning'}>{getTrustBadgeLabel(b)}</Badge>
                ))}
              </div>
              <Badge tone="info" className="mt-2">Ответ: {seller.responseTime}</Badge>
              {seller.about && <p className="mt-4 text-sm leading-relaxed text-slate-700">{seller.about}</p>}
              {seller.topCategoryNames && seller.topCategoryNames.length > 0 && (
                <p className="mt-2 text-sm text-slate-600">Категории товаров: {seller.topCategoryNames.join(', ')}</p>
              )}
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                <span className="rounded-full border border-border bg-white px-3 py-1.5">Каталог поставщика</span>
                <span className="rounded-full border border-border bg-white px-3 py-1.5">Переписка по товару</span>
                <span className="rounded-full border border-border bg-white px-3 py-1.5">Переход в сделку</span>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button variant="primary" size="sm" className="gap-2" onClick={handleMessageSeller} disabled={isOwnSellerProfile}>
                  <MessageCircle className="size-4" />
                  {isOwnSellerProfile ? 'Это ваш профиль' : 'Написать продавцу'}
                </Button>
                <Link
                  to={`/catalog?tab=products&seller=${encodeURIComponent(seller.name)}`}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
                >
                  Смотреть товары в каталоге
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {sellerProducts.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-slate-900">Товары поставщика</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sellerProducts.slice(0, 9).map((p) => (
              <Card key={p.id} className="overflow-hidden">
                <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                  <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" loading="lazy" onError={applyOfflineImageFallback} />
                </div>
                <CardContent className="p-4">
                  <div className="font-medium text-slate-900 line-clamp-2">{p.name}</div>
                  <div className="mt-1 text-sm text-slate-600">{p.shortMeta}</div>
                  <Link
                    to={auth.isAuthenticated ? `/app/catalog/product/${p.slug}${location.search}` : `/catalog/product/${p.slug}${location.search}`}
                    state={buildFromState(`${location.pathname}${location.search}`)}
                    className="mt-2 inline-block text-sm font-medium text-brand-blue hover:underline"
                  >
                    Открыть
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          {sellerProducts.length > 9 && (
            <p className="mt-4 text-sm text-slate-500">Показано 9 из {sellerProducts.length}. Остальные — в каталоге по фильтру «Продавец».</p>
          )}
        </div>
      )}
    </Container>
  )
}
