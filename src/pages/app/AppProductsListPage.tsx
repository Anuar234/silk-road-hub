import { Link, useLocation } from 'react-router-dom'
import { getNavigationFlash } from '@shared/api/navigationState'
import { Badge } from '@shared/ui/Badge'
import { ButtonLink } from '@shared/ui/ButtonLink'
import { Card, CardContent } from '@shared/ui/Card'
import { cx } from '@shared/lib/cx'
import { appProducts, type ProductStatus } from '@mocks/appMockData'

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

export function AppProductsListPage() {
  const location = useLocation()
  const flash = getNavigationFlash(location.state)
  const publishedCount = appProducts.filter((product) => product.status === 'Опубликовано').length
  const moderationCount = appProducts.filter((product) => product.status === 'На модерации').length

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xl font-semibold tracking-tight text-slate-900">Каталог товаров</div>
          <div className="mt-1 text-sm text-slate-600">При клике открывается подробная карточка с продавцом и комментарием.</div>
        </div>
        <ButtonLink to="/app/products/new" variant="primary">
          Добавить товар
        </ButtonLink>
      </div>

      {flash && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {flash}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="py-5">
            <div className="text-2xl font-bold text-slate-900">{appProducts.length}</div>
            <div className="mt-1 text-sm text-slate-600">Всего карточек</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <div className="text-2xl font-bold text-slate-900">{publishedCount}</div>
            <div className="mt-1 text-sm text-slate-600">Опубликовано</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <div className="text-2xl font-bold text-slate-900">{moderationCount}</div>
            <div className="mt-1 text-sm text-slate-600">На модерации</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-brand-blue/10 bg-gradient-to-br from-white to-brand-blue/5">
        <CardContent className="py-5 text-sm text-slate-600">
          После обновления карточки откройте товар в каталоге и проверьте buyer-facing блоки: описание, комментарий продавца, trust badges и CTA на сообщение/сделку.
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {appProducts.map((p) => (
          <Card key={p.id} className="overflow-hidden">
            <CardContent className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-base font-semibold text-slate-900">{p.name}</div>
                <div className="mt-1 text-sm text-slate-600">
                  {p.price} • MOQ: {p.moq}
                </div>
                <div className="mt-2">
                  <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                </div>
              </div>

              <Link
                to={`/app/products/${p.id}`}
                className={cx(
                  'inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-medium text-slate-900 hover:bg-slate-50',
                )}
              >
                Открыть
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

