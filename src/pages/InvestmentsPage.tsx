import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Building2, DollarSign, MapPin, Filter } from 'lucide-react'
import { Container } from '../components/layout/Container'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { investmentProjects, INVESTMENT_STAGES, INVESTMENT_SOURCES } from '../data/investmentData'
import type { InvestmentStage, InvestmentSource } from '../data/investmentData'
import { CATALOG_SECTORS, KZ_REGIONS, getRegionByCode } from '../data/catalogStructure'

function formatVolume(usd: number): string {
  if (usd >= 1_000_000_000) return `$${(usd / 1_000_000_000).toFixed(1)}B`
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(0)}M`
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(0)}K`
  return `$${usd}`
}

export function InvestmentsPage() {
  const [sectorFilter, setSectorFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState('')
  const [stageFilter, setStageFilter] = useState<InvestmentStage | ''>('')
  const [sourceFilter, setSourceFilter] = useState<InvestmentSource | ''>('')

  const filtered = useMemo(() => {
    return investmentProjects.filter((p) => {
      if (sectorFilter && p.sector !== sectorFilter) return false
      if (regionFilter && p.regionCode !== regionFilter) return false
      if (stageFilter && p.stage !== stageFilter) return false
      if (sourceFilter && p.source !== sourceFilter) return false
      return true
    })
  }, [sectorFilter, regionFilter, stageFilter, sourceFilter])

  const hasFilters = !!(sectorFilter || regionFilter || stageFilter || sourceFilter)

  return (
    <Container className="py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Инвестиционные проекты</h1>
          <p className="mt-2 max-w-3xl text-base text-slate-600">
            Отобранные проекты для роста экспортной мощности и инфраструктуры Казахстана. Включает проекты Kazakh Invest, ГЧП и частные инициативы.
          </p>
        </div>
        <div className="text-sm text-slate-500">{filtered.length} из {investmentProjects.length} проектов</div>
      </div>

      {/* Filters */}
      <div className="mt-6 rounded-2xl border border-border bg-white p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
          <Filter className="size-4" />
          Фильтры
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SelectFilter label="Отрасль" value={sectorFilter} onChange={setSectorFilter}>
            <option value="">Все отрасли</option>
            {CATALOG_SECTORS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </SelectFilter>
          <SelectFilter label="Регион" value={regionFilter} onChange={setRegionFilter}>
            <option value="">Все регионы</option>
            {KZ_REGIONS.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
          </SelectFilter>
          <SelectFilter label="Стадия" value={stageFilter} onChange={(v) => setStageFilter(v as InvestmentStage | '')}>
            <option value="">Все стадии</option>
            {INVESTMENT_STAGES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </SelectFilter>
          <SelectFilter label="Источник" value={sourceFilter} onChange={(v) => setSourceFilter(v as InvestmentSource | '')}>
            <option value="">Все источники</option>
            {INVESTMENT_SOURCES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </SelectFilter>
        </div>
        {hasFilters && (
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => { setSectorFilter(''); setRegionFilter(''); setStageFilter(''); setSourceFilter('') }}>
            Сбросить фильтры
          </Button>
        )}
      </div>

      {/* Project list */}
      <div className="mt-8 grid gap-6">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-slate-50 py-12 text-center text-sm text-slate-500">
            Нет проектов по заданным фильтрам
          </div>
        ) : (
          filtered.map((project) => {
            const region = getRegionByCode(project.regionCode)
            const sector = CATALOG_SECTORS.find((s) => s.id === project.sector)
            const stage = INVESTMENT_STAGES.find((s) => s.id === project.stage)
            const source = INVESTMENT_SOURCES.find((s) => s.id === project.source)

            return (
              <Card key={project.id} className="overflow-hidden">
                <CardContent className="grid gap-4 py-5 md:grid-cols-[1fr_200px]">
                  <div className="space-y-3">
                    <div>
                      <Link to={`/investments/${project.id}`} className="text-lg font-semibold text-slate-900 hover:text-brand-blue transition-colors">
                        {project.title}
                      </Link>
                      <p className="mt-1 text-sm text-slate-600 line-clamp-2">{project.description}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {source?.id === 'kazakh_invest' && <Badge tone="info">Kazakh Invest</Badge>}
                      {source?.id === 'ppp' && <Badge tone="warning">ГЧП</Badge>}
                      {source?.id === 'private' && <Badge tone="neutral">Частный проект</Badge>}
                      {stage && <Badge tone="neutral">{stage.name}</Badge>}
                      {sector && <Badge tone="neutral">{sector.name}</Badge>}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1"><MapPin className="size-3.5" />{region?.name ?? project.regionCode}</span>
                      <span className="flex items-center gap-1"><DollarSign className="size-3.5" />{formatVolume(project.volumeUsd)}</span>
                      <span className="flex items-center gap-1"><Building2 className="size-3.5" />{project.initiator}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between gap-3">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-900">{formatVolume(project.volumeUsd)}</div>
                      <div className="text-xs text-slate-500">объём инвестиций</div>
                    </div>
                    <Link to={`/investments/${project.id}`}>
                      <Button size="sm">Подробнее</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </Container>
  )
}

function SelectFilter({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-slate-500">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
      >
        {children}
      </select>
    </div>
  )
}
