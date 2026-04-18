import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Building2, CheckCircle2, DollarSign, FileText, Mail, MapPin, Send } from 'lucide-react'
import { Container } from '@widgets/layout/Container'
import { Button } from '@shared/ui/Button'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { Badge } from '@shared/ui/Badge'
import { getInvestmentById, INVESTMENT_STAGES, INVESTMENT_SOURCES } from '@features/investments/investmentData'
import { CATALOG_SECTORS, getRegionByCode } from '@features/catalog/catalogStructure'
import { useAuth } from '@features/auth/auth'
import { InvestmentRequestDialog } from '@features/investments/InvestmentRequestDialog'

function formatVolume(usd: number): string {
  if (usd >= 1_000_000_000) return `$${(usd / 1_000_000_000).toFixed(1)}B`
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(0)}M`
  return `$${usd.toLocaleString()}`
}

export function InvestmentDetailPage() {
  const { id } = useParams()
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [requestOpen, setRequestOpen] = useState(false)
  const [requestSent, setRequestSent] = useState(false)
  const project = useMemo(() => getInvestmentById(id ?? ''), [id])

  const canSendRequest = auth.isAuthenticated && (auth.role === 'investor' || auth.role === 'buyer' || auth.role === 'admin')
  const projectDocuments = (project as unknown as { documentIds?: string[] })?.documentIds ?? []

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
              {project.contactEmail && (
                <a
                  href={`mailto:${project.contactEmail}`}
                  className="flex items-center gap-2 text-sm font-medium text-brand-blue hover:underline"
                >
                  <Mail className="size-4" />
                  {project.contactEmail}
                </a>
              )}
              {requestSent ? (
                <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <div>
                    Запрос отправлен.
                    {auth.isAuthenticated && (
                      <Link to="/app/investment-requests" className="ml-1 font-medium underline">
                        Мои запросы
                      </Link>
                    )}
                  </div>
                </div>
              ) : canSendRequest ? (
                <Button variant="primary" className="w-full gap-2" onClick={() => setRequestOpen(true)}>
                  <Send className="size-4" />
                  Отправить инвест-запрос
                </Button>
              ) : auth.isAuthenticated ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  Отправлять инвест-запросы могут пользователи с ролью «Инвестор» или «Покупатель». Смените роль
                  через администратора или зарегистрируйте новый кабинет.
                </div>
              ) : (
                <Button
                  variant="primary"
                  className="w-full gap-2"
                  onClick={() => navigate('/login', { state: { from: `${location.pathname}${location.search}` } })}
                >
                  <Send className="size-4" />
                  Войти и отправить запрос
                </Button>
              )}
            </CardContent>
          </Card>

          {projectDocuments.length > 0 && (
            <Card>
              <CardHeader title="Документы проекта" />
              <CardContent className="space-y-2">
                {projectDocuments.map((fileId) => (
                  <a
                    key={fileId}
                    href={`/api/files/${encodeURIComponent(fileId)}`}
                    className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm text-slate-700 hover:border-brand-blue/40 hover:bg-slate-50"
                  >
                    <FileText className="size-4 text-slate-500" />
                    <span className="truncate font-mono text-xs">{fileId.slice(0, 8)}…</span>
                    <span className="ml-auto text-xs text-brand-blue">Скачать</span>
                  </a>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {requestOpen && (
        <InvestmentRequestDialog
          projectId={project.id}
          projectTitle={project.title}
          onClose={() => setRequestOpen(false)}
          onSent={() => {
            setRequestOpen(false)
            setRequestSent(true)
          }}
        />
      )}
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
