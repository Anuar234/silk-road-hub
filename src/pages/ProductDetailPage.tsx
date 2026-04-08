import { ArrowLeft, MessageCircle, Send } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { buildFromState, getNavigationFrom } from '../adapters/navigationState'
import { Container } from '../components/layout/Container'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { ButtonLink } from '../components/ui/ButtonLink'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { applyOfflineImageFallback } from '../components/ui/imageFallback'
import { products } from '../data/mockData'
import { useAuth } from '../auth/auth'
import { getExistingDealThreadForAuth } from '../data/platformSelectors'
import { usePlatformDataVersion } from '../hooks/usePlatformDataVersion'
import { useMemo } from 'react'
import { getSellerIdFromAuth } from '../data/messagingData'
import { getTrustBadgeLabel } from '../data/trustBadges'

export function ProductDetailPage() {
  const { slug } = useParams()
  const product = products.find((p) => p.slug === slug)
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const version = usePlatformDataVersion()
  const mySellerId = useMemo(() => getSellerIdFromAuth(auth), [auth])
  const backTo = getNavigationFrom(location.state) ?? (location.search ? `/catalog${location.search}` : '/catalog')
  const linkedFlow = useMemo(() => {
    void version
    if (!product) return { thread: null, deal: null }
    return getExistingDealThreadForAuth(auth, product.seller.id, product.id)
  }, [auth, product, version])

  if (!product) {
    return (
      <Container className="py-10">
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="text-lg font-semibold text-slate-900">Товар не найден</div>
          <div className="mt-2 text-sm text-slate-600">Проверьте ссылку или вернитесь в каталог.</div>
          <ButtonLink to={backTo} variant="secondary" className="mt-4">
            В каталог
          </ButtonLink>
        </div>
      </Container>
    )
  }

  const isOwnProduct = auth.role === 'seller' && mySellerId === product.seller.id

  const handleMessageSeller = () => {
    if (isOwnProduct) return
    if (auth.isAuthenticated) {
      if (linkedFlow.thread) {
        navigate(`/app/messages/${linkedFlow.thread.id}`)
      } else {
        navigate(`/app/messages?seller=${product.seller.id}&product=${product.id}`)
      }
    } else {
      navigate('/login', { state: buildFromState(`${location.pathname}${location.search}`) })
    }
  }

  const handleDeal = () => {
    if (isOwnProduct) return
    if (auth.isAuthenticated) {
      if (linkedFlow.deal) {
        navigate(`/app/deals/${linkedFlow.deal.id}`)
      } else if (linkedFlow.thread) {
        navigate(`/app/catalog/product/${product.slug}${location.search}`, { state: buildFromState(backTo) })
      } else {
        navigate(`/app/messages?seller=${product.seller.id}&product=${product.id}`)
      }
    } else {
      navigate('/login', { state: buildFromState(`${location.pathname}${location.search}`) })
    }
  }

  return (
    <div>
      <section className="border-b border-border bg-white">
        <Container className="py-8 sm:py-10">
          <Link to={backTo} className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 transition-colors duration-200 hover:text-slate-900">
            <ArrowLeft className="size-4" />
            Назад в каталог
          </Link>

          <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-slate-100">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-[280px] w-full object-cover sm:h-[320px]"
              onError={applyOfflineImageFallback}
            />
          </div>

          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{product.name}</h1>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <Badge tone="neutral">HS: {product.hsCode}</Badge>
                <Badge tone="neutral">MOQ: {product.moq}</Badge>
                <Badge tone="neutral">Incoterms: {product.incoterms}</Badge>
                <Badge tone="neutral">{product.seller.country}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.trustBadges.map((b) => (
                  <Badge key={b} tone={b === 'Verified' ? 'success' : 'warning'}>
                    {getTrustBadgeLabel(b)}
                  </Badge>
                ))}
              </div>
              {isOwnProduct && (
                <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                  Это ваш товар. Для продолжения откройте карточку через кабинет продавца или проверьте, как её видят покупатели.
                </div>
              )}
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Button variant="primary" className="gap-2" onClick={handleMessageSeller} disabled={isOwnProduct}>
                <MessageCircle className="size-4" />
                {isOwnProduct ? 'Это ваш товар' : linkedFlow.thread ? 'Открыть диалог' : 'Написать продавцу'}
              </Button>
              <Button variant="secondary" className="gap-2" onClick={handleDeal} disabled={isOwnProduct}>
                <Send className="size-4" />
                {isOwnProduct ? 'Сделка недоступна' : linkedFlow.deal ? 'Открыть сделку' : linkedFlow.thread ? 'Оформить сделку' : 'Начать сделку'}
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader title="Подробное описание" />
              <CardContent>
                <p className="text-sm leading-relaxed text-slate-700">{product.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Характеристики" />
              <CardContent>
                <ul className="grid gap-2 text-sm text-slate-700">
                  <li><span className="text-slate-500">Цена:</span> {product.price}</li>
                  <li><span className="text-slate-500">Срок производства:</span> {product.leadTimeDays} дней</li>
                  <li><span className="text-slate-500">Упаковка:</span> {product.packaging}</li>
                  <li><span className="text-slate-500">Страна:</span> {product.seller.country}</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader title="Кто продаёт" subtitle="Продавец (контакт для запросов)" />
              <CardContent className="grid gap-3">
                <div>
                  <div className="font-semibold text-slate-900">{product.seller.name}</div>
                  <div className="mt-0.5 text-sm text-slate-600">
                    {product.seller.city}, {product.seller.country}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="info">Ответ: {product.seller.responseTime}</Badge>
                  {product.seller.trustBadges.map((b) => (
                    <Badge key={b} tone={b === 'Verified' ? 'success' : 'warning'}>{getTrustBadgeLabel(b)}</Badge>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="secondary" className="gap-2" onClick={handleMessageSeller} disabled={isOwnProduct}>
                    <MessageCircle className="size-4" />
                    {isOwnProduct ? 'Это ваш профиль продавца' : 'Написать продавцу'}
                  </Button>
                  <ButtonLink to={`/catalog/seller/${product.seller.id}${location.search}`} state={buildFromState(backTo)} variant="ghost" size="sm">
                    Профиль продавца
                  </ButtonLink>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Комментарий продавца" />
              <CardContent>
                <p className="text-sm leading-relaxed text-slate-700">{product.sellerComment}</p>
              </CardContent>
            </Card>

            {product.additionalInfo && (
              <Card>
                <CardHeader title="Дополнительная информация" />
                <CardContent>
                  <p className="text-sm leading-relaxed text-slate-700">{product.additionalInfo}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </Container>
    </div>
  )
}
