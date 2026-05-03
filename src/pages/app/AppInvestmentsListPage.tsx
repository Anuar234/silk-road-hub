import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, Plus } from 'lucide-react'
import { Badge } from '@shared/ui/Badge'
import { ButtonLink } from '@shared/ui/ButtonLink'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { Container } from '@widgets/layout/Container'
import { getNavigationFlash } from '@shared/api/navigationState'
import { apiGetMyInvestments } from '@shared/api/investmentApi'
import {
  INVESTMENT_SOURCES,
  INVESTMENT_STAGES,
  type InvestmentProject,
} from '@features/investments/investmentData'

function getStageName(id: string): string {
  return INVESTMENT_STAGES.find((s) => s.id === id)?.name ?? id
}

function getSourceName(id: string): string {
  return INVESTMENT_SOURCES.find((s) => s.id === id)?.name ?? id
}

function formatUsd(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')} млн USD`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)} тыс. USD`
  return `${amount} USD`
}

export function AppInvestmentsListPage() {
  const location = useLocation()
  const flash = getNavigationFlash(location.state)
  const [projects, setProjects] = useState<InvestmentProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void apiGetMyInvestments()
      .then((items) => {
        if (!cancelled) setProjects(items)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Не удалось загрузить проекты.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const totalVolume = useMemo(() => projects.reduce((sum, p) => sum + p.volumeUsd, 0), [projects])

  return (
    <Container className="space-y-6 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Мои инвестпроекты</h1>
          <p className="mt-1 text-sm text-slate-600">
            Размещайте и редактируйте инвестиционные проекты. Проекты с пометкой «Kazakh Invest»
            ведутся куратором — обращайтесь к администратору, если ваш проект должен попасть в эту категорию.
          </p>
        </div>
        <ButtonLink to="/app/investments/new" variant="primary" className="gap-2">
          <Plus className="size-4" />
          Разместить проект
        </ButtonLink>
      </div>

      {flash && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {flash}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="py-5">
            <div className="text-2xl font-bold text-slate-900">{projects.length}</div>
            <div className="mt-1 text-sm text-slate-600">Всего проектов</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <div className="text-2xl font-bold text-slate-900">{formatUsd(totalVolume)}</div>
            <div className="mt-1 text-sm text-slate-600">Заявленный объём инвестиций</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <div className="text-2xl font-bold text-slate-900">
              {projects.filter((p) => p.stage === 'concept' || p.stage === 'feasibility').length}
            </div>
            <div className="mt-1 text-sm text-slate-600">На ранней стадии</div>
          </CardContent>
        </Card>
      </div>

      {loading && <div className="text-sm text-slate-500">Загрузка…</div>}
      {error && <div role="alert" className="text-sm text-rose-600">{error}</div>}
      {!loading && !error && projects.length === 0 && (
        <Card>
          <CardContent className="grid gap-3 py-8 text-center">
            <div className="text-base font-semibold text-slate-900">У вас пока нет проектов</div>
            <div className="text-sm text-slate-600">
              Разместите первый инвестпроект — он будет виден администратору и партнёрам после верификации инициатора.
            </div>
            <div className="flex justify-center">
              <ButtonLink to="/app/investments/new" variant="primary" size="sm">Разместить проект</ButtonLink>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && projects.length > 0 && (
        <Card>
          <CardHeader title={`Список проектов (${projects.length})`} />
          <CardContent className="divide-y divide-border">
            {projects.map((p) => (
              <div key={p.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <div className="text-base font-semibold text-slate-900">{p.title}</div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs">
                    <Badge tone="info">{getSourceName(p.source)}</Badge>
                    <Badge tone="neutral">{getStageName(p.stage)}</Badge>
                    <Badge tone="neutral">{p.regionCode}</Badge>
                    <Badge tone="neutral">{formatUsd(p.volumeUsd)}</Badge>
                  </div>
                </div>
                <Link
                  to={`/app/investments/${p.id}/edit`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand-blue hover:underline"
                >
                  Редактировать <ArrowRight className="size-3" />
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </Container>
  )
}
