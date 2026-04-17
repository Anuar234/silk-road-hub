import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Building2, DollarSign, Mail, MapPin } from 'lucide-react'
import { Container } from '@widgets/layout/Container'
import { Button } from '@shared/ui/Button'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { Badge } from '@shared/ui/Badge'
import { getInvestmentById, INVESTMENT_STAGES, INVESTMENT_SOURCES } from '@features/investments/investmentData'
import { CATALOG_SECTORS, getRegionByCode } from '@features/catalog/catalogStructure'

function formatVolume(usd: number): string {
  if (usd >= 1_000_000_000) return `$${(usd / 1_000_000_000).toFixed(1)}B`
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(0)}M`
  return `$${usd.toLocaleString()}`
}

export function InvestmentDetailPage() {
  const { id } = useParams()
  const project = useMemo(() => getInvestmentById(id ?? ''), [id])

  if (!project) {
    return (
      <Container className="py-12">
        <p className="text-sm text-slate-600">Проект не найден.</p>
        <Link to="/investments" className="mt-2 inline-block text-sm text-brand-blue hover:underline">
          ← К каталогу проектов
        </Link>
      </Container>
    )
  }

  const region = getRegionByCode(project.regionCode)
  const sector = CATALOG_SECTORS.find((s) => s.id === project.sector)
  const stage = INVESTMENT_STAGES.find((s) => s.id === project.stage)
  const source = INVESTMENT_SOURCES.find((s) => s.id === project.source)

  return (
    <Container className="py-12">
      <Link to="/investments" className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900">
        <ArrowLeft className="size-4" /> Каталог инвестпроектов
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Main content */}
        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {source?.id === 'kazakh_invest' && <Badge tone="info">Kazakh Invest</Badge>}
              {source?.id === 'ppp' && <Badge tone="warning">ГЧП</Badge>}
              {source?.id === 'private' && <Badge tone="neutral">Частный проект</Badge>}
              {stage && <Badge tone="neutral">{stage.name}</Badge>}
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{project.title}</h1>
          </div>

          <Card>
            <CardHeader title="Описание проекта" />
            <CardContent>
              <p className="text-sm leading-relaxed text-slate-700">{project.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Параметры" />
            <CardContent className="grid gap-2">
              <InfoRow label="Отрасль" value={sector?.name ?? project.sector} />
              <InfoRow label="Регион" value={region?.name ?? project.regionCode} />
              <InfoRow label="Объём инвестиций" value={formatVolume(project.volumeUsd)} />
              <InfoRow label="Стадия" value={stage?.name ?? project.stage} />
              <InfoRow label="Источник" value={source?.name ?? project.source} />
              <InfoRow label="Инициатор" value={project.initiator} />
              {project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {project.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">{tag}</span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="py-5">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900">{formatVolume(project.volumeUsd)}</div>
                <div className="mt-1 text-sm text-slate-500">Объём инвестиций</div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <MapPin className="size-4 text-slate-400" />
                  {region?.name ?? project.regionCode}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Building2 className="size-4 text-slate-400" />
                  {project.initiator}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <DollarSign className="size-4 text-slate-400" />
                  {stage?.name ?? project.stage}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Контакт" />
            <CardContent className="space-y-3">
              <a
                href={`mailto:${project.contactEmail}`}
                className="flex items-center gap-2 text-sm font-medium text-brand-blue hover:underline"
              >
                <Mail className="size-4" />
                {project.contactEmail}
              </a>
              <Button
                variant="primary"
                className="w-full gap-2"
                as="a"
                href={`mailto:${project.contactEmail}?subject=${encodeURIComponent(`Запрос по проекту: ${project.title}`)}`}
              >
                <Mail className="size-4" />
                Направить запрос
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="w-36 shrink-0 text-slate-500">{label}</span>
      <span className="text-slate-900">{value}</span>
    </div>
  )
}
