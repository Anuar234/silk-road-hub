import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { MessageCircle, Send } from 'lucide-react'
import { useState, useMemo } from 'react'
import { getNavigationFrom } from '@shared/api/navigationState'
import { Badge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { applyOfflineImageFallback } from '@shared/ui/imageFallback'
import { DealModal } from '@widgets/deal/DealModal'
import { useAuth } from '@features/auth/auth'
import { getParticipantId, getSellerIdFromAuth } from '@features/messaging/messagingData'
import { products } from '@mocks/mockData'
import { getExistingDealThreadForAuth } from '@features/platform/platformSelectors'
import { usePlatformDataVersion } from '@shared/hooks/usePlatformDataVersion'
import { getTrustBadgeLabel } from '@features/platform/trustBadges'

export function AppCatalogProductPage() {
  const { slug } = useParams()
  const product = products.find((p) => p.slug === slug)
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showDealModal, setShowDealModal] = useState(false)
  const version = usePlatformDataVersion()
  const backTo = getNavigationFrom(location.state) ?? (location.search ? `/app/catalog${location.search}` : '/app/catalog')

  const myId = useMemo(() => getParticipantId(auth), [auth])
  const mySellerIdRaw = useMemo(() => getSellerIdFromAuth(auth), [auth])
  const isBuyer = auth.role === 'buyer'
  const isSeller = auth.role === 'seller'
  const isOwnProduct = isSeller && mySellerIdRaw === product?.seller.id
  const canMessage = isBuyer ? auth.emailVerified : !isOwnProduct
  const linkedFlow = useMemo(
    () => (product ? getExistingDealThreadForAuth(auth, product.seller.id, product.id) : { thread: null, deal: null }),
    [auth, product, version],
  )

  if (!product) {
    return (
      <div className="py-6">
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="text-lg font-semibold text-slate-900">Товар не найден</div>
          <div className="mt-2 text-sm text-slate-600">Проверьте ссылку или вернитесь в каталог.</div>
          <Link to={backTo} className="mt-4 inline-block text-sm font-medium text-brand-blue hover:underline">
            В каталог
          </Link>
        </div>
      </div>
    )
  }

  const handleMessageSeller = () => {
    if (!canMessage) return
    // If the deal-thread already exists in the local store, open it directly.
    // Otherwise hand off to /app/messages with query params and let the
    // messaging page call apiOpenThread against the real backend. Mock-only
    // seller IDs won't resolve there — that path is only meaningful for real
    // DB-backed catalog rows.
    if (linkedFlow.thread) {
      navigate(`/app/messages/${linkedFlow.thread.id}`)
      return
    }
    const params = new URLSearchParams()
    params.set('seller', product.seller.id)
    params.set('product', product.id)
    navigate(`/app/messages?${params.toString()}`)
  }

  return (
    <div className="py-6">
      <Link to={backTo} className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 transition-colors duration-200 hover:text-slate-900">
        ← Назад в каталог
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-2xl border border-border bg-slate-100">
          <img src={product.imageUrl} alt={product.name} className="h-full w-full max-h-[360px] object-cover" onError={applyOfflineImageFallback} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{product.name}</h1>
          <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-700">
            <Badge tone="neutral">HS: {product.hsCode}</Badge>
            <Badge tone="neutral">MOQ: {product.moq}</Badge>
            <Badge tone="neutral">Incoterms: {product.incoterms}</Badge>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {product.trustBadges.map((b) => (
              <Badge key={b} tone={b === 'Verified' ? 'success' : 'warning'}>
                {getTrustBadgeLabel(b)}
              </Badge>
            ))}
          </div>

          {/* CTA area */}
          <div className="mt-6 space-y-3">
            {isBuyer && !auth.emailVerified && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-medium">Подтвердите почту, чтобы написать продавцу</p>
                <p className="mt-1 text-amber-700">Доступ к переписке откроется после подтверждения email.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="primary" size="sm" onClick={() => auth.setEmailVerified(true)}>
                    Я уже подтвердил почту
                  </Button>
                </div>
              </div>
            )}
            {isOwnProduct && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                Это ваш товар. Вы не можете написать самому себе.
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              {!isOwnProduct && (
                <>
                  {linkedFlow.deal ? (
                    <>
                      <Button variant="primary" className="gap-2" onClick={() => navigate(`/app/deals/${linkedFlow.deal?.id}`)}>
                        <Send className="size-4" />
                        Открыть сделку
                      </Button>
                      <Button variant="secondary" className="gap-2" onClick={handleMessageSeller}>
                        <MessageCircle className="size-4" />
                        Открыть диалог
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="primary"
                        className="gap-2"
                        disabled={!canMessage}
                        onClick={handleMessageSeller}
                      >
                        <MessageCircle className="size-4" />
                        {linkedFlow.thread ? 'Открыть диалог' : 'Написать продавцу'}
                      </Button>
                      {linkedFlow.thread && (
                        <Button variant="secondary" className="gap-2" onClick={() => setShowDealModal(true)} disabled={!canMessage}>
                          <Send className="size-4" />
                          Оформить сделку
                        </Button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
            {!isOwnProduct && !linkedFlow.thread && (
              <p className="text-sm text-slate-500">
                Сначала откройте переписку с продавцом. После согласования условий здесь появится действие для оформления сделки.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-6">
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
              </ul>
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
        <div className="grid gap-6">
          <Card>
            <CardHeader title="Кто продаёт" subtitle="Продавец (контакт для запросов)" />
            <CardContent className="grid gap-3">
              <div>
                <div className="text-base font-semibold text-slate-900">{product.seller.name}</div>
                <div className="mt-1 text-sm text-slate-600">
                  {product.seller.city}, {product.seller.country}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="info">Ответ: {product.seller.responseTime}</Badge>
                {product.seller.trustBadges.map((b) => (
                  <Badge key={b} tone={b === 'Verified' ? 'success' : 'warning'}>{getTrustBadgeLabel(b)}</Badge>
                ))}
              </div>
              {!isOwnProduct && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  disabled={!canMessage}
                  onClick={handleMessageSeller}
                >
                  <MessageCircle className="size-4" />
                  Написать продавцу
                </Button>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader title="Комментарий продавца" />
            <CardContent>
              <p className="text-sm leading-relaxed text-slate-700">{product.sellerComment}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {showDealModal && (
        <div className="motion-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowDealModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="motion-modal-panel max-w-md w-full">
            <DealModal
              product={product}
              buyerId={myId}
              threadId={linkedFlow.thread?.id ?? null}
              onClose={() => setShowDealModal(false)}
              onSuccess={(dealId) => navigate(`/app/deals/${dealId}`)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
