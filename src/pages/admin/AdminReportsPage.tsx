import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { downloadBlob } from '../../adapters/browserFiles'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { DEAL_STATUS_LABELS, DEAL_STATUS_TONE, getAllDeals, getDealProduct, getDealSeller, type DealStatus } from '../../data/dealData'
import { usePlatformDataVersion } from '../../hooks/usePlatformDataVersion'

export function AdminReportsPage() {
  const [statusFilter, setStatusFilter] = useState<DealStatus | ''>('')
  const [countryFilter, setCountryFilter] = useState('')
  const version = usePlatformDataVersion()
  const deals = useMemo(() => getAllDeals(), [version])

  const countries = useMemo(() => Array.from(new Set(deals.map((deal) => deal.destinationCountry))).sort(), [deals])
  const filtered = useMemo(() => {
    return deals.filter((deal) => {
      if (statusFilter && deal.status !== statusFilter) return false
      if (countryFilter && deal.destinationCountry !== countryFilter) return false
      return true
    })
  }, [countryFilter, deals, statusFilter])

  const totalValue = useMemo(() => {
    return filtered.reduce((sum, deal) => {
      const parsed = Number.parseFloat((deal.totalValue ?? '').replace(/[^0-9.]/g, ''))
      return Number.isNaN(parsed) ? sum : sum + parsed
    }, 0)
  }, [filtered])

  const handleExport = () => {
    const rows = [
      ['deal_id', 'product', 'seller', 'destination_country', 'status', 'documents', 'manager', 'total_value'],
      ...filtered.map((deal) => {
        const product = getDealProduct(deal)
        const seller = getDealSeller(deal)
        return [
          deal.id,
          product?.name ?? '',
          seller?.name ?? '',
          deal.destinationCountry,
          DEAL_STATUS_LABELS[deal.status],
          String(deal.documents.length),
          deal.assignedManager ?? '',
          deal.totalValue ?? '',
        ]
      }),
    ]
    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    downloadBlob('silk-road-hub-reports.csv', blob)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Отчёты</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleExport}>Экспорт CSV</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as DealStatus | '')} className="h-10 rounded-xl border border-border bg-white px-3 text-sm">
          <option value="">Все статусы</option>
          {Object.entries(DEAL_STATUS_LABELS).map(([status, label]) => (
            <option key={status} value={status}>{label}</option>
          ))}
        </select>
        <select value={countryFilter} onChange={(event) => setCountryFilter(event.target.value)} className="h-10 rounded-xl border border-border bg-white px-3 text-sm">
          <option value="">Все страны</option>
          {countries.map((country) => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardHeader title={`Результаты (${filtered.length})`} subtitle={totalValue ? `Общая сумма: $${totalValue.toLocaleString()}` : 'Общая сумма: —'} />
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase text-slate-500">
                <th className="pb-3 pr-4">Сделка</th>
                <th className="pb-3 pr-4">Товар</th>
                <th className="pb-3 pr-4">Продавец</th>
                <th className="pb-3 pr-4">Страна</th>
                <th className="pb-3 pr-4">Сумма</th>
                <th className="pb-3 pr-4">Документы</th>
                <th className="pb-3 pr-4">Статус</th>
                <th className="pb-3 pr-4">Менеджер</th>
                <th className="pb-3 pr-4">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((deal) => {
                const product = getDealProduct(deal)
                const seller = getDealSeller(deal)
                return (
                  <tr key={deal.id} className="transition-colors hover:bg-slate-50">
                    <td className="py-3 pr-4">
                      <div className="font-mono text-xs text-slate-500">{deal.id}</div>
                      <div className="text-xs text-slate-500">{new Date(deal.createdAt).toLocaleDateString('ru-RU')}</div>
                    </td>
                    <td className="py-3 pr-4 font-medium text-slate-900">{product?.name ?? '—'}</td>
                    <td className="py-3 pr-4 text-slate-700">{seller?.name ?? '—'}</td>
                    <td className="py-3 pr-4 text-slate-700">{deal.destinationCountry}</td>
                    <td className="py-3 pr-4 text-slate-700">{deal.totalValue ?? '—'}</td>
                    <td className="py-3 pr-4 text-slate-700">{deal.documents.length}</td>
                    <td className="py-3 pr-4">
                      <Badge tone="neutral" className={DEAL_STATUS_TONE[deal.status]}>{DEAL_STATUS_LABELS[deal.status]}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{deal.assignedManager ?? '—'}</td>
                    <td className="py-3 pr-4">
                      <Link to={`/admin/deals/${deal.id}`} className="text-sm font-medium text-brand-blue hover:underline">
                        Открыть
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Нет данных по выбранным фильтрам.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
