import { ArrowLeft, Edit3, ExternalLink, Package } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '@shared/ui/Badge'
import { ButtonLink } from '@shared/ui/ButtonLink'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { appProducts, type ProductStatus } from '@mocks/appMockData'
import { getTrustBadgeLabel } from '@features/platform/trustBadges'

function statusTone(status: ProductStatus) {
  switch (status) {
    case 'Опубликовано':
      return 'success' as const
    case 'На модерации':
      return 'info' as const
    case 'Отклонено':
      return 'warning' as const
    default:
      return 'neutral' as const
  }
}

export function AppProductsDetailPage() {
  const { id } = useParams()
  const product = appProducts.find((p) => p.id === id)

  if (!product) {
    return (
      <Card>
        <CardContent>
          <div className="text-base font-semibold text-slate-900">Товар не найден</div>
          <div className="mt-2 text-sm text-slate-600">Проверьте ссылку или откройте список товаров.</div>
          <div className="mt-4">
            <ButtonLink to="/app/products" variant="secondary">
              К списку
            </ButtonLink>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/app/products" className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 transition-colors duration-200 hover:text-slate-900">
          <ArrowLeft className="size-4" />
          Назад
        </Link>
        <ButtonLink to={`/app/products/${product.id}/edit`} variant="secondary" size="sm" className="gap-2">
          <Edit3 className="size-4" />
          Редактировать
        </ButtonLink>
      </div>

      <Card className="overflow-hidden">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-slate-100 to-white p-8">
            <div className="flex items-center justify-center">
              <div className="grid size-14 place-items-center rounded-2xl border border-border bg-white">
                <Package className="size-6 text-slate-500" />
              </div>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-2xl font-bold tracking-tight text-slate-900">{product.name}</div>
              <Badge tone={statusTone(product.status)}>{product.status}</Badge>
            </div>
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
            <div className="mt-4 rounded-2xl border border-border bg-slate-50 px-4 py-3 text-sm text-slate-600">
              В офлайн-демо эта карточка показывает, как buyer увидит ваш товар в каталоге, деталях и будущем переходе в сообщение/сделку.
            </div>
            <div className="mt-6">
              <ButtonLink to={`/app/catalog/product/${product.slug}`} variant="secondary" size="sm" className="gap-2">
                <ExternalLink className="size-4" />
                Открыть в каталоге
              </ButtonLink>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
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
                <li>
                  <span className="text-slate-500">Цена:</span> {product.price}
                </li>
                <li>
                  <span className="text-slate-500">Срок производства:</span> {product.leadTimeDays} дней
                </li>
                <li>
                  <span className="text-slate-500">Упаковка:</span> {product.packaging}
                </li>
                {product.additionalInfo ? (
                  <li>
                    <span className="text-slate-500">Доп. информация:</span> {product.additionalInfo}
                  </li>
                ) : null}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader title="Информация о продавце" />
            <CardContent className="grid gap-3">
              <div>
                <div className="text-base font-semibold text-slate-900">{product.seller.name}</div>
                <div className="mt-1 text-sm text-slate-600">
                  {product.seller.city}, {product.seller.country}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="info">Ответ: {product.seller.responseTime}</Badge>
                {product.seller.trustBadges.includes('Verified') ? <Badge tone="success">Проверен</Badge> : null}
              </div>
              <p className="text-xs text-slate-500">Это ваш товар. Покупатели увидят эту карточку в каталоге.</p>
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
    </div>
  )
}
