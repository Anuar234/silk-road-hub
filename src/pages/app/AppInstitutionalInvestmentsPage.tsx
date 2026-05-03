import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Building2 } from 'lucide-react'
import { Badge } from '@shared/ui/Badge'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { Input } from '@shared/ui/Input'
import { apiGetInvestments } from '@shared/api/investmentApi'
import {
  INVESTMENT_SOURCES,
  INVESTMENT_STAGES,
  type InvestmentProject,
  type InvestmentSource,
} from '@features/investments/investmentData'

function formatVolume(usd: number): string {
  if (usd >= 1_000_000_000) return `$${(usd / 1_000_000_000).toFixed(1)}B`
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(0)}M`
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(0)}K`
  return `$${usd}`
}

const SOURCE_TONES: Record<InvestmentSource, 'info' | 'warning' | 'neutral'> = {
  kazakh_invest: 'info',
  ppp: 'warning',
  private: 'neutral',
}

/**
 * Read-only oversight of all investment projects (ТЗ §4.4).
 * Institutional users monitor pipeline; project edits stay with investors / admin.
 */
export function AppInstitutionalInvestmentsPage() {
  const [projects, setProjects] = useState<InvestmentProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sourceFilter, setSourceFilter] = useState<InvestmentSource | 'all'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    void apiGetInvestments()
      .then((items) => {
        if (!cancelled) setProjects(items)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Не удалось загрузить инвестпроекты.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const bySource = sourceFilter === 'all' ? projects : projects.filter((p) => p.source === sourceFilter)
    const q = search.trim().toLowerCase()
    if (!q) return bySource
    return bySource.filter((p) =>
      [p.title, p.initiator, p.regionCode, p.sector].some((v) => (v ?? '').toLowerCase().includes(q)),
    )
  }, [projects, sourceFilter, search])

  const totals = useMemo(() => {
    const totalVolume = projects.reduce((sum, p) => sum + p.volumeUsd, 0)
    const ki = projects.filter((p) => p.source === 'kazakh_invest').length
    const ppp = projects.filter((p) => p.source === 'ppp').length
    const priv = projects.filter((p) => p.source === 'private').length
    return { totalVolume, ki, ppp, priv }
  }, [projects])

  if (loading) return <div className="py-6 text-sm text-slate-500">Загрузка инвестпроектов…</div>

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Мониторинг инвестпроектов</h1>
        <p className="mt-1 text-sm text-slate-600">
          Каталог проектов Kazakh Invest, ГЧП и частных инициатив. Просмотр — без редактирования карточки.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Всего проектов" value={projects.length} />
        <KpiCard label="Совокупный объём" value={formatVolume(totals.totalVolume)} />
        <KpiCard label="Kazakh Invest" value={totals.ki} />
        <KpiCard label="ГЧП" value={totals.ppp} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <FilterButton active={sourceFilter === 'all'} onClick={() => setSourceFilter('all')}>
            Все ({projects.length})
          </FilterButton>
          <FilterButton active={sourceFilter === 'kazakh_invest'} onClick={() => setSourceFilter('kazakh_invest')}>
            Kazakh Invest ({totals.ki})
          </FilterButton>
          <FilterButton active={sourceFilter === 'ppp'} onClick={() => setSourceFilter('ppp')}>
            ГЧП ({totals.ppp})
          </FilterButton>
          <FilterButton active={sourceFilter === 'private'} onClick={() => setSourceFilter('private')}>
            Частные ({totals.priv})
          </FilterButton>
        </div>
        <div className="max-w-sm flex-1">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск: название, инициатор, регион…" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-3 py-8">
            <Building2 className="size-5 text-slate-400" />
            <span className="text-sm text-slate-500">Проекты не найдены.</span>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader title={`Список проектов (${filtered.length})`} />
          <CardContent className="divide-y divide-border">
            {filtered.map((p) => {
              const stage = INVESTMENT_STAGES.find((s) => s.id === p.stage)
              const source = INVESTMENT_SOURCES.find((s) => s.id === p.source)
              return (
                <div key={p.id} className="grid gap-3 py-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <div className="text-base font-semibold text-slate-900">{p.title}</div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs">
                      {source && <Badge tone={SOURCE_TONES[source.id]}>{source.name}</Badge>}
                      {stage && <Badge tone="neutral">{stage.name}</Badge>}
                      <Badge tone="neutral">{p.regionCode}</Badge>
                      <Badge tone="neutral">{formatVolume(p.volumeUsd)}</Badge>
                    </div>
                    <div className="mt-1 text-sm text-slate-600">{p.initiator}</div>
                  </div>
                  <Link
                    to={`/investments/${p.id}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-brand-blue hover:underline"
                  >
                    Открыть <ArrowRight className="size-3" />
                  </Link>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="py-5">
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="mt-1 text-sm text-slate-600">{label}</div>
      </CardContent>
    </Card>
  )
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
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
