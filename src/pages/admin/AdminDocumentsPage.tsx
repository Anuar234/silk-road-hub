import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { Badge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { DOC_STATUS_LABELS, DOC_STATUS_TONE, getAllDeals, getDealProduct, updateDocumentStatus, type DocStatus } from '@features/deals/dealData'
import { usePlatformDataVersion } from '@shared/hooks/usePlatformDataVersion'

const DOC_FILTERS: Array<DocStatus | ''> = ['', 'requested', 'uploaded', 'under_review', 'approved', 'missing_info', 'rejected']

export function AdminDocumentsPage() {
  const [statusFilter, setStatusFilter] = useState<DocStatus | ''>('')
  const version = usePlatformDataVersion()
  const allDeals = useMemo(() => getAllDeals(), [version])

  const entries = useMemo(() => {
    return allDeals.flatMap((deal) => {
      const product = getDealProduct(deal)
      return deal.documents.map((doc) => ({
        deal,
        product,
        doc,
      }))
    })
  }, [allDeals])

  const filtered = useMemo(() => {
    return statusFilter ? entries.filter((entry) => entry.doc.status === statusFilter) : entries
  }, [entries, statusFilter])

  const counts = useMemo(() => {
    const values: Record<string, number> = {}
    for (const entry of entries) values[entry.doc.status] = (values[entry.doc.status] || 0) + 1
    return values
  }, [entries])

  const quickUpdate = (dealId: string, docId: string, status: DocStatus) => {
    updateDocumentStatus(dealId, docId, status)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Документы</h1>

      <div className="flex flex-wrap gap-2">
        {DOC_FILTERS.map((status) => (
          <button
            key={status || 'all'}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === status ? 'border-brand-blue bg-brand-blue/5 text-brand-blue' : 'border-border text-slate-600 hover:bg-slate-50'}`}
          >
            {status ? `${DOC_STATUS_LABELS[status]} (${counts[status] || 0})` : `Все (${entries.length})`}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader title={`Результаты (${filtered.length})`} subtitle="Централизованный workflow по документам" />
        <CardContent className="space-y-3">
          {filtered.map(({ deal, product, doc }) => (
            <div key={doc.id} className="rounded-2xl border border-border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <FileText className="size-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-900">{doc.name}</span>
                <Badge tone="neutral">{doc.type}</Badge>
                <Badge tone="neutral" className={DOC_STATUS_TONE[doc.status]}>{DOC_STATUS_LABELS[doc.status]}</Badge>
                <Link to={`/admin/deals/${deal.id}`} className="text-sm font-medium text-brand-blue hover:underline">
                  {deal.id}
                </Link>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                {product?.name ?? '—'} · {doc.requestedFrom === 'buyer' ? 'Запрошен у покупателя' : doc.requestedFrom === 'seller' ? 'Запрошен у продавца' : 'Источник не указан'}
                {doc.sourceFileName ? ` · Файл: ${doc.sourceFileName}` : ''}
                {doc.note ? ` · ${doc.note}` : ''}
              </div>
              {doc.fileUrl && (
                <div className="mt-2">
                  <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-brand-blue hover:underline">
                    Открыть файл
                  </a>
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {['requested', 'uploaded', 'under_review', 'approved', 'missing_info', 'rejected']
                  .filter((status) => status !== doc.status)
                  .map((status) => (
                    <Button key={status} variant="ghost" size="sm" onClick={() => quickUpdate(deal.id, doc.id, status as DocStatus)}>
                      {DOC_STATUS_LABELS[status as DocStatus]}
                    </Button>
                  ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Документы не найдены.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
