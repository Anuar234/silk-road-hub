import { ChevronRight, Globe, Grid3X3, Search } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { ButtonLink } from '../../components/ui/ButtonLink'
import { Card, CardContent } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Tabs } from '../../components/ui/Tabs'
import { applyOfflineImageFallback } from '../../components/ui/imageFallback'
import { cx } from '../../components/utils/cx'
import { useAuth } from '../../auth/auth'
import { CATALOG_COUNTRIES, CATALOG_SECTORS, getSectorById, getSubcategoryById } from '../../data/catalogStructure'
import { getSellerIdFromAuth } from '../../data/messagingData'
import { getTrustBadgeLabel } from '../../data/trustBadges'
import { CatalogActiveFilters, CatalogEmptyState, CatalogFiltersPanel } from '../../features/catalog/CatalogFiltersPanel'
import { type CatalogTab } from '../../features/catalog/catalogFilters'
import { useCatalogController } from '../../features/catalog/useCatalogController'

export function AppCatalogPage() {
  const location = useLocation()
  const auth = useAuth()
  const {
    rawFilters,
    filteredProducts,
    filteredSellers,
    chips,
    hasFilters,
    currentCatalogUrl,
    updateFilters,
    resetFilters,
    removeChip,
    setTab,
    activeCount,
  } = useCatalogController('/app/catalog')

  const sector = rawFilters.sectorId ? getSectorById(rawFilters.sectorId) : null
  const subcategory = sector && rawFilters.subcategoryId ? getSubcategoryById(rawFilters.sectorId, rawFilters.subcategoryId) : null
  const mySellerId = getSellerIdFromAuth(auth)
  const showSectorGrid = !hasFilters && !rawFilters.sectorId
  const showSubcategoryLayer = Boolean(rawFilters.sectorId && sector && !rawFilters.subcategoryId)
  const showCountryLayer = Boolean(rawFilters.sectorId && rawFilters.subcategoryId && !rawFilters.countryCode)
  const showResults = hasFilters

  return (
    <div className="relative z-10 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Каталог</h1>
        <p className="mt-2 text-base text-slate-600">
          Все фильтры каталога работают вместе: страна, HS-код, сертификаты, проверка, MOQ и условия поставки.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
          <span className="rounded-full border border-border bg-white px-3 py-1.5">Поиск по каталогу и продавцам</span>
          <span className="rounded-full border border-border bg-white px-3 py-1.5">Сообщение -&gt; сделка -&gt; документы</span>
          <span className="rounded-full border border-border bg-white px-3 py-1.5">Офлайн-демо без потери состояния</span>
        </div>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-xl flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              className="pl-10"
              placeholder="Поиск: товар, сектор, подкатегория, страна, компания, HS-код…"
              value={rawFilters.searchQuery}
              onChange={(e) => updateFilters({ searchQuery: e.target.value })}
              aria-label="Поиск по каталогу"
            />
          </div>
          <Tabs<CatalogTab>
            value={rawFilters.tab}
            onChange={setTab}
            options={[
              { id: 'products', label: 'Товары' },
              { id: 'sellers', label: 'Продавцы' },
            ]}
          />
        </div>
      </div>

      {(rawFilters.sectorId || rawFilters.subcategoryId || rawFilters.countryCode) && (
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-600" aria-label="Хлебные крошки">
          <button
            type="button"
            onClick={resetFilters}
            className="motion-tap min-h-[44px] min-w-[44px] rounded-lg px-2 py-1 font-medium text-brand-blue transition-colors duration-[var(--duration-medium)] hover:bg-brand-yellow-soft hover:text-slate-900 sm:min-h-0 sm:min-w-0"
          >
            Каталог
          </button>
          {sector && (
            <>
              <ChevronRight className="size-4 shrink-0 text-slate-400" aria-hidden />
              {!rawFilters.subcategoryId ? (
                <span className="rounded-lg bg-slate-100 px-2 py-1 font-medium text-slate-900">{sector.name}</span>
              ) : (
                <button
                  type="button"
                  onClick={() => updateFilters({ subcategoryId: '', countryCode: '' })}
                  className="motion-tap min-h-[44px] min-w-[44px] rounded-lg px-2 py-1 font-medium text-brand-blue transition-colors duration-[var(--duration-medium)] hover:bg-brand-yellow-soft sm:min-h-0 sm:min-w-0"
                >
                  {sector.name}
                </button>
              )}
            </>
          )}
          {subcategory && (
            <>
              <ChevronRight className="size-4 shrink-0 text-slate-400" aria-hidden />
              {!rawFilters.countryCode ? (
                <span className="rounded-lg bg-slate-100 px-2 py-1 font-medium text-slate-900">{subcategory.name}</span>
              ) : (
                <button
                  type="button"
                  onClick={() => updateFilters({ countryCode: '' })}
                  className="motion-tap min-h-[44px] min-w-[44px] rounded-lg px-2 py-1 font-medium text-brand-blue transition-colors duration-[var(--duration-medium)] hover:bg-brand-yellow-soft sm:min-h-0 sm:min-w-0"
                >
                  {subcategory.name}
                </button>
              )}
            </>
          )}
          {rawFilters.countryCode && (
            <>
              <ChevronRight className="size-4 shrink-0 text-slate-400" aria-hidden />
              <span className="rounded-lg bg-slate-100 px-2 py-1 font-medium text-slate-900">
                {CATALOG_COUNTRIES.find((item) => item.code === rawFilters.countryCode)?.name ?? rawFilters.countryCode}
              </span>
            </>
          )}
        </nav>
      )}

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <CatalogFiltersPanel filters={rawFilters} onChange={updateFilters} onReset={resetFilters} />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-6 lg:hidden">
            <CatalogFiltersPanel filters={rawFilters} onChange={updateFilters} onReset={resetFilters} />
          </div>

          {showSectorGrid && (
            <section key="sectors">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
                <Grid3X3 className="size-5 text-brand-blue" /> Сектора
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {CATALOG_SECTORS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updateFilters({ sectorId: item.id, subcategoryId: '', countryCode: '' })}
                    className="group motion-card flex min-h-[100px] w-full flex-col items-start rounded-2xl border border-border bg-white p-5 text-left outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:ring-offset-2"
                  >
                    <span className="text-base font-semibold text-slate-900 group-hover:text-brand-blue">{item.name}</span>
                    <span className="mt-1 text-sm text-slate-500">{item.subcategories.length} подкатегорий</span>
                    <ChevronRight className="mt-2 size-5 text-slate-300 group-hover:text-brand-blue" aria-hidden />
                  </button>
                ))}
              </div>
            </section>
          )}

          {showSubcategoryLayer && sector && (
            <section key="subcategories" className="mb-8">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Подкатегория — {sector.name}</h2>
              <div className="flex flex-wrap gap-2">
                {sector.subcategories.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updateFilters({ subcategoryId: item.id, countryCode: '' })}
                    className={cx(
                      'motion-tap min-h-[44px] min-w-[44px] rounded-xl border px-4 py-2.5 text-sm font-medium transition-[border-color,background-color,color] duration-[var(--duration-medium)] focus:ring-2 focus:ring-brand-blue/20 active:bg-slate-100 sm:min-h-0 sm:min-w-0',
                      rawFilters.subcategoryId === item.id
                        ? 'border-brand-blue bg-brand-yellow-soft text-slate-900'
                        : 'border-border bg-white text-slate-700 hover:border-brand-blue/40 hover:bg-brand-yellow-soft hover:text-slate-900',
                    )}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </section>
          )}

          {showCountryLayer && (
            <section key="countries" className="mb-8">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
                <Globe className="size-5 text-brand-blue" /> Страна — {subcategory?.name}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {CATALOG_COUNTRIES.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => updateFilters({ countryCode: item.code })}
                    className={cx(
                      'motion-tap flex min-h-[48px] w-full cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition-[border-color,background-color,color] duration-[var(--duration-medium)] focus:ring-2 focus:ring-brand-blue/20 active:bg-slate-100',
                      rawFilters.countryCode === item.code
                        ? 'border-brand-blue bg-brand-yellow-soft text-slate-900'
                        : 'border-border bg-white text-slate-700 hover:border-brand-blue/30 hover:bg-slate-50',
                    )}
                  >
                    {item.name}
                    <ChevronRight className="size-4 shrink-0 text-slate-400" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {showResults && (
            <section key={`results-${rawFilters.tab}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-600">
                    {rawFilters.tab === 'products' ? `Найдено товаров: ${activeCount}` : `Найдено продавцов: ${activeCount}`}
                  </p>
                  <p className="text-xs text-slate-500">
                    {rawFilters.tab === 'products'
                      ? 'Откройте товар, чтобы перейти в buyer/seller flow и при необходимости оформить сделку.'
                      : 'Откройте профиль продавца или начните контакт прямо из карточки списка.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="motion-tap min-h-[44px] rounded px-3 text-sm font-medium text-brand-blue transition-opacity duration-[var(--duration-medium)] hover:underline sm:min-h-0"
                >
                  Сбросить фильтры
                </button>
              </div>

              <CatalogActiveFilters chips={chips} onRemove={removeChip} />

              {rawFilters.tab === 'sellers' ? (
                activeCount > 0 ? (
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredSellers.map((sellerItem) => (
                      <Card key={sellerItem.id} className="overflow-hidden transition-shadow hover:shadow-md">
                        <CardContent className="grid gap-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-base font-semibold text-slate-900">{sellerItem.name}</div>
                              <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                                <Globe className="size-4" />
                                {sellerItem.city}, {sellerItem.country}
                              </div>
                            </div>
                            <Badge tone="info">Ответ: {sellerItem.responseTime}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {sellerItem.trustBadges.map((badge) => (
                              <Badge key={badge} tone={badge === 'Verified' ? 'success' : 'warning'}>
                                {getTrustBadgeLabel(badge)}
                              </Badge>
                            ))}
                          </div>
                          {sellerItem.about ? <p className="line-clamp-2 text-sm text-slate-600">{sellerItem.about}</p> : null}
                          {mySellerId === sellerItem.id ? (
                            <ButtonLink to={`/catalog/seller/${sellerItem.id}`} variant="secondary" size="sm" className="w-full">
                              Это ваш профиль
                            </ButtonLink>
                          ) : (
                            <div className="grid gap-2">
                              <ButtonLink to={`/app/messages?seller=${sellerItem.id}`} variant="primary" size="sm" className="w-full">
                                Написать продавцу
                              </ButtonLink>
                              <ButtonLink to={`/catalog/seller/${sellerItem.id}`} variant="secondary" size="sm" className="w-full">
                                Профиль продавца
                              </ButtonLink>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <CatalogEmptyState onReset={resetFilters} />
                )
              ) : activeCount > 0 ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredProducts.map((product) => (
                    <Card key={product.id} className="overflow-hidden transition-shadow hover:shadow-md">
                      <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-200 hover:scale-[1.02]"
                          loading="lazy"
                          onError={applyOfflineImageFallback}
                        />
                      </div>
                      <CardContent className="grid gap-2">
                        <div className="text-base font-semibold text-slate-900">{product.name}</div>
                        <div className="text-sm text-slate-600">{product.shortMeta}</div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
                          <span className="text-slate-500">Продавец:</span> {product.seller.name}
                          <span className="text-slate-400">•</span>
                          <span>{product.seller.country}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {product.trustBadges.slice(0, 3).map((badge) => (
                            <Badge key={badge} tone={badge === 'Verified' ? 'success' : 'warning'}>
                              {getTrustBadgeLabel(badge)}
                            </Badge>
                          ))}
                          {product.samplesAvailable && <Badge tone="info">Образцы</Badge>}
                          {product.privateLabel && <Badge tone="neutral">Private label</Badge>}
                        </div>
                        <Link
                          to={`/app/catalog/product/${product.slug}${location.search}`}
                          state={{ from: currentCatalogUrl }}
                          className={cx(
                            'mt-1 inline-flex h-11 min-h-[44px] items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-medium text-slate-900 transition-[color,background-color,transform] duration-200 hover:bg-slate-50 active:scale-[0.98]',
                          )}
                        >
                          Карточка товара
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <CatalogEmptyState onReset={resetFilters} />
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
