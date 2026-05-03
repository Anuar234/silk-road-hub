import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Badge } from '@shared/ui/Badge'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { Input } from '@shared/ui/Input'
import {
  DEAL_PHASE_LABELS,
  DEAL_PHASE_ORDER,
  DEAL_STATUS_LABELS,
  DEAL_STATUS_TONE,
  dealPhase,
  getAllDeals,
  type DealPhase,
} from '@features/deals/dealData'
import { usePlatformDataVersion } from '@shared/hooks/usePlatformDataVersion'
import { products, sellers } from '@mocks/mockData'

/**
 * Read-only monitoring of all deals across the platform (ТЗ §4.4).
 * Institutional users see status, value, parties and may drill into the
 * deal detail page (read-only on their side because deal mutations stay
 * in the seller/buyer/admin flows).
 */
export function AppInstitutionalDealsPage() {
  const version = usePlatformDataVersion()
  const allDeals = useMemo(() => getAllDeals(), [version])
  const [phaseFilter, setPhaseFilter] = useState<DealPhase | 'all'>('all')
  const [search, setSearch] = useState('')

  const counts = useMemo(() => {
    const out: Record<DealPhase, number> = {
      negotiation: 0,
      intent_fixed: 0,
      contract_signed: 0,
      in_execution: 0,
      completed: 0,
      cancelled: 0,
    }
    for (const d of allDeals) out[dealPhase(d.status)] += 1
    return out
  }, [allDeals])

  const filtered = useMemo(() => {
    const byPhase = phaseFilter === 'all' ? allDeals : allDeals.filter((d) => dealPhase(d.status) === phaseFilter)
    const q = search.trim().toLowerCase()
    if (!q) return byPhase
    return byPhase.filter((d) => {
      const product = products.find((p) => p.id === d.productId)
      const seller = sellers.find((s) => s.id === d.sellerId)
      return [d.id, d.destinationCountry, d.quantity, product?.name, seller?.name].some((v) =>
        (v ?? '').toLowerCase().includes(q),
      )
    })
  }, [allDeals, phaseFilter, search])

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Мониторинг сделок</h1>
        <p className="mt-1 text-sm text-slate-600">
          Все сделки в разрезе пятиэтапного жизненного цикла. Запись и подтверждение — на стороне сторон сделки и администратора.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <PhaseCard label="Все" value={allDeals.length} active={phaseFilter === 'all'} onClick={() => setPhaseFilter('all')} />
        {DEAL_PHASE_ORDER.map((p) => (
          <PhaseCard
            key={p}
            label={DEAL_PHASE_LABELS[p]}
            value={counts[p]}
            active={phaseFilter === p}
            onClick={() => setPhaseFilter(p)}
          />
        ))}
      </div>

      <div className="max-w-md">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск: ID, товар, страна, продавец…" />
      </div>

      <Card>
        <CardHeader title={`Сделки (${filtered.length})`} />
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase text-slate-500">
                <th className="pb-3 pr-4">ID</th>
                <th className="pb-3 pr-4">Товар</th>
                <th className="pb-3 pr-4">Объём</th>
                <th className="pb-3 pr-4">Страна назначения</th>
                <th className="pb-3 pr-4">Статус</th>
                <th className="pb-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((deal) => {
                const product = products.find((p) => p.id === deal.productId)
                return (
                  <tr key={deal.id} className="transition-colors hover:bg-slate-50">
                    <td className="py-3 pr-4 font-mono text-xs text-slate-700">{deal.id}</td>
                    <td className="py-3 pr-4">{product?.name ?? '—'}</td>
                    <td className="py-3 pr-4 text-slate-700">{deal.quantity}</td>
                    <td className="py-3 pr-4 text-slate-700">{deal.destinationCountry}</td>
                    <td className="py-3 pr-4">
                      <Badge tone="neutral" className={DEAL_STATUS_TONE[deal.status]}>
                        {DEAL_STATUS_LABELS[deal.status]}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Link
                        to={`/app/deals/${deal.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-brand-blue hover:underline"
                      >
                        Открыть <ArrowRight className="size-3" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Сделки не найдены.</p>}
        </CardContent>
      </Card>
    </div>
  )
}

function PhaseCard({
  label,
  value,
  active,
  onClick,
}: {
  label: string
  value: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
        active ? 'border-brand-blue bg-brand-blue/5' : 'border-border bg-white hover:bg-slate-50'
      }`}
    >
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="mt-0.5 text-xs text-slate-600">{label}</div>
    </button>
  )
}
