import { useEffect, useMemo, useState } from 'react'
import { BarChart3, FileText, Globe2, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { apiGetInvestments } from '@shared/api/investmentApi'
import { apiGetUsers } from '@shared/api/usersApi'
import { dealPhase, getAllDeals, type DealPhase } from '@features/deals/dealData'
import { products } from '@mocks/mockData'
import { CATALOG_COUNTRIES, KZ_REGIONS } from '@features/catalog/catalogStructure'
import type { ApiUser } from '@shared/api/authApi'
import type { InvestmentProject } from '@features/investments/investmentData'
import { usePlatformDataVersion } from '@shared/hooks/usePlatformDataVersion'

/**
 * Aggregated reports for institutional partners (ТЗ §4.4 + §5.7 + §11).
 * Pilot scope: counts and breakdowns rendered inline; xlsx export / external
 * dashboards are Этап 2.
 */
export function AppInstitutionalReportsPage() {
  const version = usePlatformDataVersion()
  const [users, setUsers] = useState<ApiUser[]>([])
  const [projects, setProjects] = useState<InvestmentProject[]>([])
  const [loading, setLoading] = useState(true)

  const allDeals = useMemo(() => getAllDeals(), [version])

  useEffect(() => {
    let cancelled = false
    Promise.all([apiGetUsers(), apiGetInvestments()])
      .then(([userList, projectList]) => {
        if (cancelled) return
        setUsers(userList)
        setProjects(projectList)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Catalog mock products are the only source of country/region info today.
  // Switching to DB-backed products is Этап 2; the aggregation logic stays.
  const productsByCountry = useMemo(() => {
    const out = new Map<string, number>()
    for (const p of products) {
      const code = p.countryCode ?? 'KZ'
      out.set(code, (out.get(code) ?? 0) + 1)
    }
    return out
  }, [])

  const productsByKzRegion = useMemo(() => {
    const out = new Map<string, number>()
    for (const p of products) {
      if (p.countryCode !== 'KZ') continue
      if (p.regionCode) out.set(p.regionCode, (out.get(p.regionCode) ?? 0) + 1)
    }
    return out
  }, [])

  const projectsByRegion = useMemo(() => {
    const out = new Map<string, number>()
    for (const p of projects) out.set(p.regionCode, (out.get(p.regionCode) ?? 0) + 1)
    return out
  }, [projects])

  const dealPhases = useMemo(() => {
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

  const usersByRole = useMemo(() => {
    const out: Record<string, number> = {}
    for (const u of users) out[u.role] = (out[u.role] ?? 0) + 1
    return out
  }, [users])

  const totalInvestmentVolume = useMemo(
    () => projects.reduce((sum, p) => sum + p.volumeUsd, 0),
    [projects],
  )

  if (loading) return <div className="py-6 text-sm text-slate-500">Считаем агрегаты…</div>

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Аналитика и отчёты</h1>
        <p className="mt-1 text-sm text-slate-600">
          Агрегаты по пользователям, сделкам, инвестпроектам, географии рынков и регионам РК.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Пользователей" value={users.length} icon={<BarChart3 className="size-5" />} />
        <Stat label="Сделок всего" value={allDeals.length} icon={<FileText className="size-5" />} />
        <Stat label="Инвестпроектов" value={projects.length} icon={<MapPin className="size-5" />} />
        <Stat label="Объём инвестиций" value={`$${(totalInvestmentVolume / 1_000_000).toFixed(0)}M`} icon={<Globe2 className="size-5" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Пользователи по ролям" />
          <CardContent>
            <div className="grid gap-2 text-sm">
              {Object.entries(usersByRole).map(([role, count]) => (
                <BarRow key={role} label={roleLabel(role)} value={count} max={users.length} />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Сделки по фазам ТЗ §5.3" />
          <CardContent>
            <div className="grid gap-2 text-sm">
              <BarRow label="Переговоры" value={dealPhases.negotiation} max={allDeals.length} />
              <BarRow label="Намерения зафиксированы" value={dealPhases.intent_fixed} max={allDeals.length} />
              <BarRow label="Контракт подписан" value={dealPhases.contract_signed} max={allDeals.length} />
              <BarRow label="В процессе исполнения" value={dealPhases.in_execution} max={allDeals.length} />
              <BarRow label="Завершены" value={dealPhases.completed} max={allDeals.length} />
              <BarRow label="Отменены" value={dealPhases.cancelled} max={allDeals.length} tone="muted" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="География товаров" subtitle="Объявления по странам происхождения" />
          <CardContent>
            <div className="grid gap-2 text-sm">
              {Array.from(productsByCountry.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([code, count]) => (
                  <BarRow
                    key={code}
                    label={CATALOG_COUNTRIES.find((c) => c.code === code)?.name ?? code}
                    value={count}
                    max={products.length}
                  />
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Экспортная активность регионов РК" subtitle="Только товары из Казахстана" />
          <CardContent>
            <div className="grid gap-2 text-sm">
              {KZ_REGIONS.filter((r) => productsByKzRegion.has(r.code))
                .sort((a, b) => (productsByKzRegion.get(b.code) ?? 0) - (productsByKzRegion.get(a.code) ?? 0))
                .map((r) => (
                  <BarRow
                    key={r.code}
                    label={r.name}
                    value={productsByKzRegion.get(r.code) ?? 0}
                    max={Math.max(...productsByKzRegion.values())}
                  />
                ))}
              {productsByKzRegion.size === 0 && (
                <p className="text-sm text-slate-500">Нет данных о регионах происхождения.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Инвестпроекты по регионам РК" />
          <CardContent>
            <div className="grid gap-2 text-sm">
              {Array.from(projectsByRegion.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([code, count]) => (
                  <BarRow
                    key={code}
                    label={KZ_REGIONS.find((r) => r.code === code)?.name ?? code}
                    value={count}
                    max={projects.length}
                  />
                ))}
              {projectsByRegion.size === 0 && (
                <p className="text-sm text-slate-500">Проекты пока не размещены.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <FileText className="mr-2 inline size-4 align-text-bottom" />
        Экспорт отчёта в xlsx и подключение к Power BI / Yandex DataLens — в плане Этапа 2.
      </div>
    </div>
  )
}

function roleLabel(role: string): string {
  switch (role) {
    case 'buyer':
      return 'Покупатели'
    case 'seller':
      return 'Экспортёры'
    case 'investor':
      return 'Инвесторы'
    case 'institutional':
      return 'Институциональные'
    case 'admin':
      return 'Администраторы'
    default:
      return role
  }
}

function Stat({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-5">
        <div className="grid size-10 place-items-center rounded-xl bg-brand-blue/10 text-brand-blue">{icon}</div>
        <div>
          <div className="text-2xl font-bold text-slate-900">{value}</div>
          <div className="text-sm text-slate-600">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function BarRow({
  label,
  value,
  max,
  tone = 'normal',
}: {
  label: string
  value: number
  max: number
  tone?: 'normal' | 'muted'
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  const barColor = tone === 'muted' ? 'bg-slate-300' : 'bg-brand-blue'
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-slate-700">{label}</span>
        <span className="font-mono font-semibold text-slate-900">{value}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`${barColor} h-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
