import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@shared/ui/Button'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { Container } from '@widgets/layout/Container'
import { Input } from '@shared/ui/Input'
import { Textarea } from '@shared/ui/Textarea'
import { buildFlashState } from '@shared/api/navigationState'
import { apiCreateInvestment, apiGetInvestment, apiUpdateInvestment } from '@shared/api/investmentApi'
import {
  INVESTMENT_SOURCES,
  INVESTMENT_STAGES,
  type InvestmentSource,
  type InvestmentStage,
} from '@features/investments/investmentData'
import { KZ_REGIONS } from '@features/catalog/catalogStructure'
import { useAuth } from '@features/auth/auth'

type Mode = 'create' | 'edit'

const SECTOR_OPTIONS: { id: string; name: string }[] = [
  { id: 'agro', name: 'Агропромышленный комплекс' },
  { id: 'manufacturing', name: 'Обрабатывающая промышленность' },
  { id: 'mining', name: 'Горнодобыча и металлургия' },
  { id: 'energy', name: 'Энергетика' },
  { id: 'logistics', name: 'Логистика и инфраструктура' },
  { id: 'construction', name: 'Строительство' },
  { id: 'tourism', name: 'Туризм' },
  { id: 'creative', name: 'Креативная индустрия' },
  { id: 'other', name: 'Другое' },
]

export function AppInvestmentUpsertPage({ mode }: { mode: Mode }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const auth = useAuth()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [sector, setSector] = useState('agro')
  const [regionCode, setRegionCode] = useState('')
  const [volumeUsd, setVolumeUsd] = useState('')
  const [stage, setStage] = useState<InvestmentStage>('concept')
  const [source, setSource] = useState<InvestmentSource>('private')
  const [initiator, setInitiator] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [tags, setTags] = useState('')

  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = auth.role === 'admin'
  // ТЗ §5.11 — only admins (Kazakh Invest curators) can flag a project as
  // 'kazakh_invest'. Investors keep their projects as 'private' or 'ppp'.
  const sourceOptions = useMemo(
    () => INVESTMENT_SOURCES.filter((s) => isAdmin || s.id !== 'kazakh_invest'),
    [isAdmin],
  )

  useEffect(() => {
    if (mode === 'edit' && id) {
      void apiGetInvestment(id)
        .then((p) => {
          setTitle(p.title)
          setDescription(p.description)
          setSector(p.sector)
          setRegionCode(p.regionCode)
          setVolumeUsd(String(p.volumeUsd))
          setStage(p.stage)
          setSource(p.source)
          setInitiator(p.initiator)
          setContactEmail(p.contactEmail)
          setTags(p.tags.join(', '))
        })
        .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Не удалось загрузить проект'))
        .finally(() => setLoading(false))
    }
  }, [mode, id])

  function buildPayload() {
    return {
      title: title.trim(),
      description: description.trim(),
      sector,
      regionCode,
      volumeUsd: Number(volumeUsd) || 0,
      stage,
      source,
      initiator: initiator.trim(),
      contactEmail: contactEmail.trim(),
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    }
  }

  function validate(): string | null {
    if (!title.trim()) return 'Название проекта обязательно'
    if (!sector) return 'Выберите отрасль'
    if (!regionCode) return 'Выберите регион'
    if (volumeUsd && (isNaN(Number(volumeUsd)) || Number(volumeUsd) < 0)) {
      return 'Объём инвестиций должен быть неотрицательным числом'
    }
    return null
  }

  const handleSave = async () => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (mode === 'edit' && id) {
        await apiUpdateInvestment(id, buildPayload())
        navigate('/app/investments', { state: buildFlashState('Проект обновлён.') })
      } else {
        await apiCreateInvestment(buildPayload())
        navigate('/app/investments', { state: buildFlashState('Проект размещён.') })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить проект')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Container className="py-8 text-sm text-slate-500">Загрузка…</Container>
  }

  return (
    <Container className="space-y-6 py-6">
      <Link to="/app/investments" className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900">
        <ArrowLeft className="size-4" /> К моим проектам
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {mode === 'edit' ? 'Редактировать проект' : 'Разместить инвестпроект'}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          После сохранения проект отправляется администратору на верификацию инициатора (ТЗ §5.11).
        </p>
      </div>

      <Card>
        <CardHeader title="Основная информация" />
        <CardContent className="grid gap-3">
          <Field label="Название проекта *">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Завод по переработке масличных культур" />
          </Field>
          <Field label="Описание">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Кратко: ёмкость, продукция, рынки сбыта, ключевые этапы…"
            />
          </Field>

          <Grid>
            <Field label="Отрасль *">
              <Select value={sector} onChange={(v) => setSector(v)}>
                {SECTOR_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Регион РК *">
              <Select value={regionCode} onChange={(v) => setRegionCode(v)}>
                <option value="">— Выберите регион —</option>
                {KZ_REGIONS.map((r) => (
                  <option key={r.code} value={r.code}>{r.name}</option>
                ))}
              </Select>
            </Field>
          </Grid>

          <Grid>
            <Field label="Объём инвестиций (USD)">
              <Input
                value={volumeUsd}
                onChange={(e) => setVolumeUsd(e.target.value)}
                placeholder="45000000"
                inputMode="numeric"
              />
            </Field>
            <Field label="Стадия">
              <Select value={stage} onChange={(v) => setStage(v as InvestmentStage)}>
                {INVESTMENT_STAGES.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </Field>
          </Grid>

          <Grid>
            <Field label="Категория проекта">
              <Select value={source} onChange={(v) => setSource(v as InvestmentSource)}>
                {sourceOptions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Инициатор">
              <Input value={initiator} onChange={(e) => setInitiator(e.target.value)} placeholder="ТОО «Название компании»" />
            </Field>
          </Grid>

          <Grid>
            <Field label="Контактный email">
              <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="invest@example.kz" />
            </Field>
            <Field label="Теги (через запятую)">
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="экспорт, переработка, агро" />
            </Field>
          </Grid>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button variant="primary" onClick={() => void handleSave()} disabled={saving}>
              {saving ? 'Сохранение…' : mode === 'edit' ? 'Сохранить изменения' : 'Разместить проект'}
            </Button>
            <Link to="/app/investments" className="text-sm text-slate-600 underline-offset-2 hover:underline">
              Отмена
            </Link>
          </div>

          {error && <div role="alert" className="text-sm text-rose-600">{error}</div>}
        </CardContent>
      </Card>
    </Container>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-2">{children}</div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-slate-700">{label}</div>
      {children}
    </div>
  )
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
    >
      {children}
    </select>
  )
}
