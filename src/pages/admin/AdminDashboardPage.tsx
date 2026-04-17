import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Clock3, FileText, ShoppingBag } from 'lucide-react'
import { Badge } from '@shared/ui/Badge'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { getAdminFunnel, getAverageDocumentPreparationDays, getAverageMessageToDealHours, getAverageResponseHours, getStatusCounts, getTopProductsByDeals, getTopSellersByDeals } from '@features/admin/adminData'
import { DEAL_STATUS_LABELS, DEAL_STATUS_TONE, getAllDeals } from '@features/deals/dealData'
import { usePlatformDataVersion } from '@shared/hooks/usePlatformDataVersion'
import { getProblemDeals } from '@features/platform/platformSelectors'

export function AdminDashboardPage() {
  const version = usePlatformDataVersion()
  const allDeals = useMemo(() => getAllDeals(), [version])
  const statusCounts = useMemo(() => getStatusCounts(), [allDeals])
  const funnel = useMemo(() => getAdminFunnel(), [allDeals])
  const topProducts = useMemo(() => getTopProductsByDeals(), [allDeals])
  const topSellers = useMemo(() => getTopSellersByDeals(), [allDeals])
  const avgResponseHours = useMemo(() => getAverageResponseHours(), [allDeals])
  const avgMessageToDealHours = useMemo(() => getAverageMessageToDealHours(), [allDeals])
  const avgDocDays = useMemo(() => getAverageDocumentPreparationDays(), [allDeals])
  const urgentDeals = useMemo(() => allDeals.filter((deal) => ['waiting_buyer_info', 'waiting_seller_info', 'under_review'].includes(deal.status)).slice(0, 6), [allDeals])
  const problemDeals = useMemo(() => getProblemDeals(), [allDeals])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Дашборд</h1>
        <div className="text-sm text-slate-500">Операционная сводка по сделкам, документам и сообщениям.</div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Link to="/admin/deals" className="rounded-2xl border border-border bg-white p-4 transition-colors hover:bg-slate-50">
          <div className="text-sm font-semibold text-slate-900">Сделки</div>
          <div className="mt-1 text-sm text-slate-600">Открыть список кейсов, фильтры и очереди по статусам.</div>
        </Link>
        <Link to="/admin/documents" className="rounded-2xl border border-border bg-white p-4 transition-colors hover:bg-slate-50">
          <div className="text-sm font-semibold text-slate-900">Документы</div>
          <div className="mt-1 text-sm text-slate-600">Проверка загрузок, статусов и недостающих файлов.</div>
        </Link>
        <Link to="/admin/messages" className="rounded-2xl border border-border bg-white p-4 transition-colors hover:bg-slate-50">
          <div className="text-sm font-semibold text-slate-900">Сообщения</div>
          <div className="mt-1 text-sm text-slate-600">Перейти в связанные треды и быстро подключиться к кейсу.</div>
        </Link>
        <Link to="/admin/reports" className="rounded-2xl border border-border bg-white p-4 transition-colors hover:bg-slate-50">
          <div className="text-sm font-semibold text-slate-900">Отчёты</div>
          <div className="mt-1 text-sm text-slate-600">Скачать CSV и открыть сделки прямо из отчётной таблицы.</div>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={<ShoppingBag className="size-5 text-brand-blue" />} label="Новые сделки" value={statusCounts.new} />
        <KpiCard icon={<Clock3 className="size-5 text-amber-600" />} label="На проверке" value={statusCounts.under_review} />
        <KpiCard icon={<FileText className="size-5 text-indigo-600" />} label="Ждут документы" value={statusCounts.documents_preparation} />
        <KpiCard icon={<Clock3 className="size-5 text-orange-600" />} label="Ждут ответ покупателя" value={statusCounts.waiting_buyer_info} />
        <KpiCard icon={<Clock3 className="size-5 text-yellow-600" />} label="Ждут ответ продавца" value={statusCounts.waiting_seller_info} />
        <KpiCard icon={<ShoppingBag className="size-5 text-purple-600" />} label="В переговорах" value={statusCounts.negotiating} />
        <KpiCard icon={<CheckCircle2 className="size-5 text-emerald-600" />} label="Завершённые" value={statusCounts.completed} />
        <KpiCard icon={<Clock3 className="size-5 text-slate-500" />} label="Отменённые" value={statusCounts.cancelled} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <Card>
          <CardHeader title="Распределение по статусам" />
          <CardContent className="flex flex-wrap gap-2">
            {Object.entries(DEAL_STATUS_LABELS).map(([status, label]) => (
              <div key={status} className={`rounded-2xl border px-4 py-2 text-sm font-medium ${DEAL_STATUS_TONE[status as keyof typeof DEAL_STATUS_TONE]}`}>
                {label}: {statusCounts[status as keyof typeof statusCounts]}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Воронка" subtitle="Переписка → сделка → документы → завершено" />
          <CardContent className="grid gap-3 md:grid-cols-4">
            {funnel.map((item) => (
              <div key={item.label} className="rounded-2xl border border-border bg-slate-50 p-4 text-center">
                <div className="text-xs uppercase tracking-wide text-slate-500">{item.label}</div>
                <div className="mt-2 text-3xl font-bold text-slate-900">{item.count}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Операционные метрики" />
          <CardContent className="space-y-3">
            <MetricRow label="Средний ответ" value={avgResponseHours ? `${avgResponseHours.toFixed(1)} ч` : '—'} />
            <MetricRow label="Сообщение → сделка" value={avgMessageToDealHours ? `${avgMessageToDealHours.toFixed(1)} ч` : '—'} />
            <MetricRow label="Подготовка документов" value={avgDocDays ? `${avgDocDays.toFixed(1)} дн` : '—'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Топ товаров" />
          <CardContent className="space-y-2">
            {topProducts.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm">
                <span className="font-medium text-slate-900">{item.product.name}</span>
                <span className="font-mono text-slate-600">{item.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Топ продавцов" />
          <CardContent className="space-y-2">
            {topSellers.map((item) => (
              <div key={item.seller.id} className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm">
                <span className="font-medium text-slate-900">{item.seller.name}</span>
                <span className="font-mono text-slate-600">{item.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader title="Сделки, требующие внимания" subtitle={`${urgentDeals.length} кейсов`} />
        <CardContent className="space-y-3">
          {urgentDeals.map((deal) => (
            <Link key={deal.id} to={`/admin/deals/${deal.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3 transition-colors hover:bg-slate-50">
              <div>
                <div className="text-sm font-semibold text-slate-900">{deal.id}</div>
                <div className="text-xs text-slate-500">{deal.destinationCountry} · {deal.quantity}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="neutral" className={DEAL_STATUS_TONE[deal.status]}>{DEAL_STATUS_LABELS[deal.status]}</Badge>
                <ArrowRight className="size-4 text-slate-400" />
              </div>
            </Link>
          ))}
          {urgentDeals.length === 0 && <p className="text-sm text-slate-500">Срочных кейсов нет.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Проблемные / зависшие кейсы" subtitle={`${problemDeals.length} кейсов`} />
        <CardContent className="space-y-3">
          {problemDeals.slice(0, 6).map((deal) => (
            <Link key={deal.id} to={`/admin/deals/${deal.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3 transition-colors hover:bg-slate-50">
              <div>
                <div className="text-sm font-semibold text-slate-900">{deal.id}</div>
                <div className="text-xs text-slate-500">Последняя активность: {new Date(deal.updatedAt).toLocaleDateString('ru-RU')}</div>
              </div>
              <Badge tone="neutral" className={DEAL_STATUS_TONE[deal.status]}>{DEAL_STATUS_LABELS[deal.status]}</Badge>
            </Link>
          ))}
          {problemDeals.length === 0 && <p className="text-sm text-slate-500">Зависших кейсов нет.</p>}
        </CardContent>
      </Card>
    </div>
  )
}

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className="grid size-12 place-items-center rounded-xl bg-slate-100">{icon}</div>
        <div>
          <div className="text-2xl font-bold text-slate-900">{value}</div>
          <div className="text-sm text-slate-600">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  )
}
