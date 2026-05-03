import { Building2, ChevronRight, ClipboardList, Globe, Grid3X3, Search } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@features/auth/auth'
import { Container } from '@widgets/layout/Container'
import { Badge } from '@shared/ui/Badge'
import { ButtonLink } from '@shared/ui/ButtonLink'
import { Card, CardContent } from '@shared/ui/Card'
import { Input } from '@shared/ui/Input'
import { Tabs } from '@shared/ui/Tabs'
import { applyOfflineImageFallback } from '@shared/ui/imageFallback'
import { cx } from '@shared/lib/cx'
import { CATALOG_COUNTRIES, CATALOG_SECTORS, KZ_REGIONS, getRegionByCode, getSectorById, getSubcategoryById } from '@features/catalog/catalogStructure'
import { CatalogActiveFilters, CatalogEmptyState, CatalogFiltersPanel } from '@features/catalog/CatalogFiltersPanel'
import { type CatalogTab } from '@features/catalog/catalogFilters'
import { useCatalogController } from '@features/catalog/useCatalogController'
import { getTrustBadgeLabel } from '@features/platform/trustBadges'

export function CatalogPage() {
  const location = useLocation()
  const auth = useAuth()
  // Unauthenticated visitors get bounced to /login; authed buyers go straight
  // to the RFQ create form. Sellers see the banner too — they may want to
  // know that this option exists for their buyers.
  const rfqCtaHref = auth.isAuthenticated ? '/app/rfq/new' : '/login'
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
  } = useCatalogController('/catalog')

  const sector = rawFilters.sectorId ? getSectorById(rawFilters.sectorId) : null
  const subcategory = sector && rawFilters.subcategoryId ? getSubcategoryById(rawFilters.sectorId, rawFilters.subcategoryId) : null
  const region = rawFilters.regionCode ? getRegionByCode(rawFilters.regionCode) : null
  const showSectorGrid = !hasFilters && !rawFilters.sectorId
  const showSubcategoryLayer = Boolean(rawFilters.sectorId && sector && !rawFilters.subcategoryId)
  const showCountryLayer = Boolean(rawFilters.sectorId && rawFilters.subcategoryId && !rawFilters.countryCode)
  const showRegionLayer = Boolean(rawFilters.countryCode === 'KZ' && rawFilters.sectorId && rawFilters.subcategoryId && !rawFilters.regionCode)
  const showResults = hasFilters

  // ТЗ 5.10: товары Республики Казахстан отображаются первыми.
  const sortedProducts = rawFilters.countryCode
    ? filteredProducts
    : [...filteredProducts].sort((a, b) => {
        const aKZ = a.countryCode === 'KZ' ? 0 : 1
        const bKZ = b.countryCode === 'KZ' ? 0 : 1
        return aKZ - bKZ
      })

  return (
    <Container className="py-8 sm:py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Каталог</h1>
        <p className="mt-2 text-base text-slate-600">
          Товары и продавцы по секторам, категориям и странам. Все фильтры работают вместе и обновляют результат сразу.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5">
            Сектор
            <ChevronRight className="size-3 text-slate-400" />
            подкатегория
            <ChevronRight className="size-3 text-slate-400" />
            страна
          </span>
          <span className="rounded-full border border-border bg-white px-3 py-1.5">Товары и продавцы в одном потоке</span>
          <span className="rounded-full border border-border bg-white px-3 py-1.5">Фильтры сохраняются в URL</span>
        </div>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-xl flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              className="pl-10"
              placeholder="Поиск: товар, компания, сектор, подкатегория, страна, HS-код…"
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
            className="motion-tap rounded-lg px-2 py-1 font-medium text-brand-blue transition-colors duration-[var(--duration-medium)] hover:bg-brand-yellow-soft hover:text-slate-900"
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
                  className="motion-tap rounded-lg px-2 py-1 font-medium text-brand-blue transition-colors duration-[var(--duration-medium)] hover:bg-brand-yellow-soft"
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
                  className="motion-tap rounded-lg px-2 py-1 font-medium text-brand-blue transition-colors duration-[var(--duration-medium)] hover:bg-brand-yellow-soft"
                >
                  {subcategory.name}
                </button>
              )}
            </>
          )}
          {rawFilters.countryCode && (
            <>
              <ChevronRight className="size-4 shrink-0 text-slate-400" aria-hidden />
              {rawFilters.regionCode ? (
                <button
                  type="button"
                  onClick={() => updateFilters({ regionCode: '' })}
                  className="motion-tap rounded-lg px-2 py-1 font-medium text-brand-blue transition-colors duration-[var(--duration-medium)] hover:bg-brand-yellow-soft"
                >
                  {CATALOG_COUNTRIES.find((item) => item.code === rawFilters.countryCode)?.name ?? rawFilters.countryCode}
                </button>
              ) : (
                <span className="rounded-lg bg-slate-100 px-2 py-1 font-medium text-slate-900">
                  {CATALOG_COUNTRIES.find((item) => item.code === rawFilters.countryCode)?.name ?? rawFilters.countryCode}
                </span>
              )}
            </>
          )}
          {region && (
            <>
              <ChevronRight className="size-4 shrink-0 text-slate-400" aria-hidden />
              <span className="rounded-lg bg-slate-100 px-2 py-1 font-medium text-slate-900">{region.name}</span>
            </>
          )}
        </nav>
      )}

      {/* Permanent RFQ CTA — when the catalog doesn't have what the buyer
          needs, a one-click path to post a Request for Quote. */}
      <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-brand-blue/15 bg-gradient-to-r from-brand-yellow-soft via-white to-brand-blue/5 p-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-blue/10 text-brand-blue">
            <ClipboardList className="size-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">Не нашли нужный товар?</div>
            <div className="mt-0.5 text-xs text-slate-600">
              Опишите потребность — администратор подберёт поставщиков и свяжет вас в защищённой переписке.
            </div>
          </div>
        </div>
        <ButtonLink to={rfqCtaHref} variant="primary" size="sm" className="shrink-0">
          Создать запрос
        </ButtonLink>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="hidden shrink-0 lg:block">
          <div className="sticky top-24">
            <CatalogFiltersPanel filters={rawFilters} onChange={updateFilters} onReset={resetFilters} />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-6 lg:hidden">
            <CatalogFiltersPanel filters={rawFilters} onChange={updateFilters} onReset={resetFilters} />
          </div>

          {showSectorGrid && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
                <Grid3X3 className="size-5 text-brand-blue" />
                Сектора
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
            <section className="mb-8">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Подкатегория — {sector.name}</h2>
              <div className="flex flex-wrap gap-2">
                {sector.subcategories.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updateFilters({ subcategoryId: item.id, countryCode: '' })}
                    className={cx(
                      'motion-tap min-h-[44px] rounded-xl border px-4 py-2.5 text-sm font-medium transition-[border-color,background-color,color] duration-[var(--duration-medium)] ease-[var(--ease-primary)]',
                      rawFilters.subcategoryId === item.id
                        ? 'border-brand-blue bg-brand-yellow-soft text-slate-900'
                        : 'border-border bg-white text-slate-700 hover:border-brand-blue/40 hover:bg-brand-yellow-soft',
                    )}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </section>
          )}

          {showCountryLayer && (
            <section className="mb-8">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
                <Globe className="size-5 text-brand-blue" />
                Страна — {subcategory?.name}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {CATALOG_COUNTRIES.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => updateFilters({ countryCode: item.code })}
                    className={cx(
                      'motion-tap flex min-h-[48px] w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition-[border-color,background-color,color] duration-[var(--duration-medium)] ease-[var(--ease-primary)]',
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

          {showRegionLayer && (
            <section className="mb-8">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
                <Globe className="size-5 text-brand-blue" />
                Область Республики Казахстан
              </h2>
              <p className="mb-3 text-sm text-slate-500">
                Уточните регион происхождения товара, чтобы увидеть предложения конкретной области РК.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {KZ_REGIONS.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => updateFilters({ regionCode: item.code })}
                    className={cx(
                      'motion-tap flex min-h-[48px] w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition-[border-color,background-color,color] duration-[var(--duration-medium)] ease-[var(--ease-primary)]',
                      rawFilters.regionCode === item.code
                        ? 'border-brand-blue bg-brand-yellow-soft text-slate-900'
                        : 'border-border bg-white text-slate-700 hover:border-brand-blue/30 hover:bg-slate-50',
                    )}
                  >
                    {item.name}
                    <ChevronRight className="size-4 shrink-0 text-slate-400" />
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => updateFilters({ regionCode: '' })}
                className="mt-4 text-sm font-medium text-brand-blue hover:underline"
              >
                Показать товары из всех регионов РК
              </button>
            </section>
          )}

          {showResults && (
            <section>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-600">
                    {rawFilters.tab === 'products' ? `Найдено товаров: ${activeCount}` : `Найдено продавцов: ${activeCount}`}
                  </p>
                  <p className="text-xs text-slate-500">
                    {rawFilters.tab === 'products'
                      ? 'Откройте карточку товара, чтобы перейти к описанию, продавцу и дальнейшему контакту.'
                      : 'Откройте профиль продавца, чтобы посмотреть поставщика и связанные карточки товаров.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="motion-tap text-sm font-medium text-brand-blue transition-opacity duration-[var(--duration-medium)] hover:underline"
                >
                  Сбросить фильтры
                </button>
              </div>

              <CatalogActiveFilters chips={chips} onRemove={removeChip} />

              {rawFilters.tab === 'sellers' ? (
                activeCount > 0 ? (
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredSellers.map((sellerItem) => (
                      <Card key={sellerItem.id} className="overflow-hidden">
                        <CardContent className="grid gap-3 p-5">
                          <div className="flex items-start gap-4">
                            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-border bg-slate-50 text-brand-blue">
                              {sellerItem.logoUrl ? (
                                <img src={sellerItem.logoUrl} alt="" className="size-full rounded-xl object-cover" onError={applyOfflineImageFallback} />
                              ) : (
                                <Building2 className="size-7" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-slate-900">{sellerItem.name}</div>
                              <div className="mt-0.5 flex items-center gap-2 text-sm text-slate-600">
                                <Globe className="size-4 shrink-0" />
                                {sellerItem.city}, {sellerItem.country}
                              </div>
                              {sellerItem.mainSectorId && (
                                <p className="mt-1 text-xs text-slate-500">{getSectorById(sellerItem.mainSectorId)?.name}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {sellerItem.trustBadges.map((badge) => (
                              <Badge key={badge} tone={badge === 'Verified' ? 'success' : 'warning'}>
                                {getTrustBadgeLabel(badge)}
                              </Badge>
                            ))}
                          </div>
                          {sellerItem.topCategoryNames?.length ? (
                            <p className="text-xs text-slate-600">Категории: {sellerItem.topCategoryNames.slice(0, 3).join(', ')}</p>
                          ) : null}
                          <Badge tone="info">Ответ: {sellerItem.responseTime}</Badge>
                          <ButtonLink
                            to={`/catalog/seller/${sellerItem.id}${location.search}`}
                            state={{ from: currentCatalogUrl }}
                            variant="secondary"
                            size="sm"
                            className="w-full"
                          >
                            Профиль
                          </ButtonLink>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <CatalogEmptyState onReset={resetFilters} />
                )
              ) : activeCount > 0 ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {sortedProducts.map((product) => (
                    <Card key={product.id} className="overflow-hidden">
                      <div className="aspect-[16/10] overflow-hidden bg-slate-100 animate-pulse">
                        <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover animate-none" loading="lazy" onLoad={(e) => { e.currentTarget.parentElement?.classList.remove('animate-pulse') }} onError={(e) => { e.currentTarget.parentElement?.classList.remove('animate-pulse'); applyOfflineImageFallback(e) }} />
                      </div>
                      <CardContent className="grid gap-2 p-4">
                        <div className="line-clamp-2 font-semibold text-slate-900">{product.name}</div>
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
                        <p className="text-xs text-slate-500">Ответ: {product.seller.responseTime}</p>
                        <ButtonLink
                          to={`/catalog/product/${product.slug}${location.search}`}
                          state={{ from: currentCatalogUrl }}
                          variant="secondary"
                          size="sm"
                          className="mt-1 w-full"
                        >
                          Карточка товара
                        </ButtonLink>
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
    </Container>
  )
}
