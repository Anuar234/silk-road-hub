import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Building2, Plus } from 'lucide-react'
import { Badge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { Input } from '@shared/ui/Input'
import {
  investmentProjects,
  INVESTMENT_STAGES,
  INVESTMENT_SOURCES,
  addInvestmentProject,
} from '@features/investments/investmentData'
import type { InvestmentStage, InvestmentSource } from '@features/investments/investmentData'
import { CATALOG_SECTORS, KZ_REGIONS, getRegionByCode } from '@features/catalog/catalogStructure'
import { usePlatformDataVersion } from '@shared/hooks/usePlatformDataVersion'

function formatVolume(usd: number): string {
  if (usd >= 1_000_000_000) return `$${(usd / 1_000_000_000).toFixed(1)}B`
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(0)}M`
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(0)}K`
  return `$${usd}`
}

type FormData = {
  title: string
  description: string
  sector: string
  regionCode: string
  volumeUsd: string
  stage: InvestmentStage
  source: InvestmentSource
  initiator: string
  contactEmail: string
}

const emptyForm: FormData = {
  title: '',
  description: '',
  sector: '',
  regionCode: '',
  volumeUsd: '',
  stage: 'concept',
  source: 'private',
  initiator: '',
  contactEmail: '',
}

export function AdminInvestmentsPage() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [formError, setFormError] = useState('')

  const version = usePlatformDataVersion()
  const projects = useMemo(() => [...investmentProjects], [version])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return projects
    return projects.filter((p) =>
      [p.title, p.sector, p.regionCode, p.initiator, p.stage, p.source]
        .some((v) => (v ?? '').toLowerCase().includes(query)),
    )
  }, [projects, search])

  const totalVolume = useMemo(
    () => projects.reduce((sum, p) => sum + p.volumeUsd, 0),
    [projects],
  )

  const handleCreate = () => {
    setFormError('')

    if (!form.title.trim()) {
      setFormError('Название проекта обязательно.')
      return
    }
    if (!form.sector) {
      setFormError('Выберите отрасль.')
      return
    }
    if (!form.regionCode) {
      setFormError('Выберите регион.')
      return
    }

    addInvestmentProject({
      title: form.title.trim(),
      description: form.description.trim(),
      sector: form.sector,
      regionCode: form.regionCode,
      volumeUsd: Number(form.volumeUsd) || 0,
      stage: form.stage,
      source: form.source,
      initiator: form.initiator.trim(),
      contactEmail: form.contactEmail.trim(),
      documentIds: [],
      tags: [],
    })

    setForm(emptyForm)
    setShowForm(false)
  }

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Инвестиционные проекты</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="size-4" />
          Добавить проект
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="py-5">
            <div className="text-2xl font-bold text-slate-900">{projects.length}</div>
            <div className="mt-1 text-sm text-slate-600">Всего проектов</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <div className="text-2xl font-bold text-slate-900">{formatVolume(totalVolume)}</div>
            <div className="mt-1 text-sm text-slate-600">Общий объём инвестиций</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <div className="text-2xl font-bold text-slate-900">
              {projects.filter((p) => p.stage === 'construction').length}
            </div>
            <div className="mt-1 text-sm text-slate-600">На стадии строительства</div>
          </CardContent>
        </Card>
      </div>

      {/* Creation form */}
      {showForm && (
        <Card>
          <CardHeader title="Новый инвестиционный проект" subtitle="Заполните основные поля для создания карточки проекта" />
          <CardContent className="space-y-4">
            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                {formError}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Название проекта *</label>
                <Input value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder="Название проекта" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Инициатор</label>
                <Input value={form.initiator} onChange={(e) => setField('initiator', e.target.value)} placeholder="Название компании" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Описание</label>
              <textarea
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="Краткое описание проекта"
                rows={3}
                className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Отрасль *</label>
                <select
                  value={form.sector}
                  onChange={(e) => setField('sector', e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                >
                  <option value="">Выберите отрасль</option>
                  {CATALOG_SECTORS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Регион *</label>
                <select
                  value={form.regionCode}
                  onChange={(e) => setField('regionCode', e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                >
                  <option value="">Выберите регион</option>
                  {KZ_REGIONS.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Объём (USD)</label>
                <Input
                  type="number"
                  value={form.volumeUsd}
                  onChange={(e) => setField('volumeUsd', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Email контакт</label>
                <Input value={form.contactEmail} onChange={(e) => setField('contactEmail', e.target.value)} placeholder="email@company.kz" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Стадия</label>
                <select
                  value={form.stage}
                  onChange={(e) => setField('stage', e.target.value as InvestmentStage)}
                  className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                >
                  {INVESTMENT_STAGES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Источник</label>
                <select
                  value={form.source}
                  onChange={(e) => setField('source', e.target.value as InvestmentSource)}
                  className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                >
                  {INVESTMENT_SOURCES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button size="sm" onClick={handleCreate}>Создать проект</Button>
              <Button variant="secondary" size="sm" onClick={() => { setShowForm(false); setFormError('') }}>Отмена</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="max-w-md">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по названию, отрасли, региону, инициатору..." />
      </div>

      {/* Table */}
      <Card>
        <CardHeader title={`Проекты (${filtered.length})`} subtitle="Управление инвестиционными проектами платформы" />
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase text-slate-500">
                <th className="pb-3 pr-4">Проект</th>
                <th className="pb-3 pr-4">Отрасль</th>
                <th className="pb-3 pr-4">Регион</th>
                <th className="pb-3 pr-4">Объём</th>
                <th className="pb-3 pr-4">Стадия</th>
                <th className="pb-3 pr-4">Источник</th>
                <th className="pb-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((project) => {
                const region = getRegionByCode(project.regionCode)
                const sector = CATALOG_SECTORS.find((s) => s.id === project.sector)
                const stage = INVESTMENT_STAGES.find((s) => s.id === project.stage)
                const source = INVESTMENT_SOURCES.find((s) => s.id === project.source)

                return (
                  <tr key={project.id} className="transition-colors hover:bg-slate-50">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="grid size-10 place-items-center rounded-xl bg-slate-100">
                          <Building2 className="size-4 text-slate-500" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{project.title}</div>
                          <div className="text-xs text-slate-500">{project.initiator}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-slate-700">{sector?.name ?? project.sector}</td>
                    <td className="py-3 pr-4 text-slate-700">{region?.name ?? project.regionCode}</td>
                    <td className="py-3 pr-4 text-slate-700">{formatVolume(project.volumeUsd)}</td>
                    <td className="py-3 pr-4">
                      <Badge tone="neutral">{stage?.name ?? project.stage}</Badge>
                    </td>
                    <td className="py-3 pr-4">
                      {source?.id === 'kazakh_invest' && <Badge tone="info">Kazakh Invest</Badge>}
                      {source?.id === 'ppp' && <Badge tone="warning">ГЧП</Badge>}
                      {source?.id === 'private' && <Badge tone="neutral">Частный</Badge>}
                    </td>
                    <td className="py-3">
                      <Link to={`/investments/${project.id}`} className="inline-flex items-center gap-1 text-brand-blue hover:underline">
                        Открыть <ArrowRight className="size-3" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Проекты не найдены.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
