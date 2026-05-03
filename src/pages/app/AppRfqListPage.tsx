import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, ClipboardList, Plus } from 'lucide-react'
import { Container } from '@widgets/layout/Container'
import { Badge } from '@shared/ui/Badge'
import { ButtonLink } from '@shared/ui/ButtonLink'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { Input } from '@shared/ui/Input'
import { getNavigationFlash } from '@shared/api/navigationState'
import { apiListRfqs, RFQ_STATUS_LABELS, RFQ_STATUS_TONE, type Rfq, type RfqStatus } from '@shared/api/rfqApi'
import { useAuth } from '@features/auth/auth'

const STATUS_FILTERS: ('all' | RfqStatus)[] = ['all', 'open', 'in_review', 'matched', 'fulfilled', 'closed']

/**
 * Unified RFQ list. Backend filters automatically by role:
 *  - buyer  → own RFQs
 *  - seller → RFQs the admin matched them to
 *  - admin  → all
 */
export function AppRfqListPage() {
  const auth = useAuth()
  const location = useLocation()
  const flash = getNavigationFlash(location.state)
  const [items, setItems] = useState<Rfq[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | RfqStatus>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    void apiListRfqs()
      .then((list) => {
        if (!cancelled) setItems(list)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Не удалось загрузить запросы.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const byStatus = statusFilter === 'all' ? items : items.filter((r) => r.status === statusFilter)
    const q = search.trim().toLowerCase()
    if (!q) return byStatus
    return byStatus.filter((r) =>
      [r.title, r.description, r.targetCountry, r.buyerName].some((v) =>
        (v ?? '').toLowerCase().includes(q),
      ),
    )
  }, [items, statusFilter, search])

  const isBuyer = auth.role === 'buyer'
  const isSeller = auth.role === 'seller'
  const isAdmin = auth.role === 'admin'
  // Admin views the same RFQ list/detail under /admin/rfq while buyer/seller
  // get it under /app/rfq. All in-page Links derive from this base.
  const basePath = isAdmin ? '/admin/rfq' : '/app/rfq'

  const heading = isBuyer
    ? 'Мои запросы (RFQ)'
    : isSeller
      ? 'Актуальные запросы покупателей'
      : 'Запросы от покупателей (RFQ)'

  const subtitle = isBuyer
    ? 'Создавайте запросы на товары, которых нет в каталоге. Администратор подберёт продавцов.'
    : isSeller
      ? 'Все активные запросы. Если можете поставить — откройте детали и напишите покупателю напрямую.'
      : 'Все запросы от покупателей. Просматривайте детали и подбирайте продавцов.'

  return (
    <Container className="space-y-6 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{heading}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">{subtitle}</p>
        </div>
        {isBuyer && (
          <ButtonLink to={`${basePath}/new`} variant="primary" className="gap-2">
            <Plus className="size-4" />
            Создать запрос
          </ButtonLink>
        )}
      </div>

      {flash && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {flash}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((s) => (
            <FilterButton key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
              {s === 'all' ? `Все (${items.length})` : RFQ_STATUS_LABELS[s]}
            </FilterButton>
          ))}
        </div>
        <div className="max-w-sm flex-1">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск: название, страна, покупатель"
          />
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading && <div className="text-sm text-slate-500">Загрузка…</div>}

      {!loading && filtered.length === 0 && (
        <Card>
          <CardContent className="grid gap-3 py-10 text-center">
            <ClipboardList className="mx-auto size-10 text-slate-300" />
            {isBuyer ? (
              <>
                <div className="text-base font-semibold text-slate-900">Запросов пока нет</div>
                <p className="text-sm text-slate-600">
                  Не нашли в каталоге то, что вам нужно? Опишите потребность — администратор подберёт поставщиков.
                </p>
                <div className="flex justify-center">
                  <ButtonLink to={`${basePath}/new`} variant="primary" size="sm">
                    Создать первый запрос
                  </ButtonLink>
                </div>
              </>
            ) : isSeller ? (
              <p className="text-sm text-slate-600">Подбора по вашим товарам пока не было.</p>
            ) : (
              <p className="text-sm text-slate-600">Запросы не найдены по выбранному фильтру.</p>
            )}
          </CardContent>
        </Card>
      )}

      {!loading && filtered.length > 0 && (
        <Card>
          <CardHeader title={`Список запросов (${filtered.length})`} />
          <CardContent className="divide-y divide-border">
            {filtered.map((r) => (
              <Link
                key={r.id}
                to={`${basePath}/${r.id}`}
                className="flex items-start justify-between gap-3 py-4 transition-colors hover:bg-slate-50 -mx-1 px-1 rounded-xl"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-semibold text-slate-900">{r.title}</span>
                    <Badge tone={RFQ_STATUS_TONE[r.status]}>{RFQ_STATUS_LABELS[r.status]}</Badge>
                  </div>
                  {r.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{r.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    {r.targetCountry && <span>📍 {r.targetCountry}</span>}
                    {r.quantity && <span>📦 {r.quantity}</span>}
                    {r.budgetUsd && <span>💵 до ${r.budgetUsd.toLocaleString('en-US')}</span>}
                    {!isBuyer && r.buyerName && <span>👤 {r.buyerName}</span>}
                    <span>🕒 {new Date(r.createdAt).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>
                <ArrowRight className="mt-1 size-4 shrink-0 text-slate-400" />
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </Container>
  )
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {children}
    </button>
  )
}
