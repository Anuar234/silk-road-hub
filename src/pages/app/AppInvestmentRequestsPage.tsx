import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileSearch, Inbox } from 'lucide-react'
import { Card, CardContent } from '@shared/ui/Card'
import {
  apiGetMyInvestmentRequests,
  INVESTMENT_REQUEST_STATUS_LABELS,
  type InvestmentRequest,
  type InvestmentRequestStatus,
} from '@shared/api/investmentRequestApi'

function statusTone(status: InvestmentRequestStatus): string {
  switch (status) {
    case 'new':
      return 'bg-slate-100 text-slate-700'
    case 'reviewing':
      return 'bg-blue-100 text-blue-800'
    case 'accepted':
      return 'bg-emerald-100 text-emerald-800'
    case 'declined':
      return 'bg-rose-100 text-rose-800'
  }
}

function formatAmount(usd: number): string {
  if (usd <= 0) return '—'
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(0)}K`
  return `$${usd.toLocaleString()}`
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return iso
  }
}

export function AppInvestmentRequestsPage() {
  const [items, setItems] = useState<InvestmentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const data = await apiGetMyInvestmentRequests()
        if (!cancelled) setItems(data)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Ошибка загрузки')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Мои инвест-запросы</h1>
        <p className="mt-1 text-sm text-slate-600">
          Запросы, которые вы направили инициаторам проектов. Отслеживайте статусы договорённостей.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      {loading && <div className="text-sm text-slate-500">Загрузка…</div>}

      {!loading && items.length === 0 && !error && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Inbox className="size-8 text-slate-400" />
            <div className="text-sm font-medium text-slate-700">Запросов пока нет</div>
            <div className="max-w-sm text-sm text-slate-500">
              Перейдите в каталог инвестиционных проектов и отправьте запрос инициатору понравившегося проекта.
            </div>
            <Link to="/investments" className="text-sm font-medium text-brand-blue hover:underline">
              Открыть каталог
            </Link>
          </CardContent>
        </Card>
      )}

      {items.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Дата</th>
                <th className="px-3 py-2">Проект</th>
                <th className="px-3 py-2">Сумма</th>
                <th className="px-3 py-2">Статус</th>
                <th className="px-3 py-2">Сообщение</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/50">
                  <td className="px-3 py-2 text-xs text-slate-600">{formatDate(req.createdAt)}</td>
                  <td className="px-3 py-2">
                    <Link
                      to={`/investments/${encodeURIComponent(req.projectId)}`}
                      className="inline-flex items-center gap-1 font-mono text-xs text-brand-blue hover:underline"
                    >
                      <FileSearch className="size-3.5" />
                      {req.projectId.slice(0, 12)}
                    </Link>
                  </td>
                  <td className="px-3 py-2 font-medium text-slate-900">{formatAmount(req.amountUsd)}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${statusTone(req.status)}`}>
                      {INVESTMENT_REQUEST_STATUS_LABELS[req.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600">
                    <span className="line-clamp-2 max-w-md">{req.message}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
