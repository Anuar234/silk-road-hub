import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Container } from '@widgets/layout/Container'
import { Button } from '@shared/ui/Button'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { Input } from '@shared/ui/Input'
import { Textarea } from '@shared/ui/Textarea'
import { buildFlashState } from '@shared/api/navigationState'
import { apiCreateRfq, apiGetRfq, apiUpdateRfq } from '@shared/api/rfqApi'
import { CATALOG_COUNTRIES, CATALOG_SECTORS } from '@features/catalog/catalogStructure'

type Mode = 'create' | 'edit'

/**
 * Buyer-facing form for creating or amending an RFQ. Edits are accepted by the
 * backend only while status='open'.
 */
export function AppRfqUpsertPage({ mode }: { mode: Mode }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [sectorId, setSectorId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [targetCountry, setTargetCountry] = useState('')
  const [quantity, setQuantity] = useState('')
  const [budgetUsd, setBudgetUsd] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [incoterms, setIncoterms] = useState('')
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedSector = CATALOG_SECTORS.find((s) => s.id === sectorId)
  const subcategories = selectedSector?.subcategories ?? []

  useEffect(() => {
    if (mode === 'edit' && id) {
      void apiGetRfq(id)
        .then((r) => {
          setTitle(r.title)
          setDescription(r.description)
          setSectorId(r.sectorId)
          setSubcategoryId(r.subcategoryId)
          setTargetCountry(r.targetCountry)
          setQuantity(r.quantity)
          setBudgetUsd(r.budgetUsd ? String(r.budgetUsd) : '')
          setTargetDate(r.targetDate ? r.targetDate.slice(0, 10) : '')
          setIncoterms(r.incoterms)
          setNotes(r.notes)
        })
        .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Не удалось загрузить запрос'))
        .finally(() => setLoading(false))
    }
  }, [mode, id])

  function buildPayload() {
    return {
      title: title.trim(),
      description: description.trim(),
      sectorId,
      subcategoryId,
      targetCountry,
      quantity: quantity.trim(),
      budgetUsd: budgetUsd ? Number(budgetUsd) : undefined,
      targetDate: targetDate || undefined,
      incoterms: incoterms.trim(),
      notes: notes.trim(),
    }
  }

  function validate(): string | null {
    if (!title.trim()) return 'Укажите название запроса'
    if (budgetUsd && (isNaN(Number(budgetUsd)) || Number(budgetUsd) < 0)) {
      return 'Бюджет должен быть неотрицательным числом'
    }
    return null
  }

  const handleSave = async () => {
    const v = validate()
    if (v) {
      setError(v)
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (mode === 'edit' && id) {
        await apiUpdateRfq(id, buildPayload())
        navigate(`/app/rfq/${id}`, { state: buildFlashState('Запрос обновлён.') })
      } else {
        const created = await apiCreateRfq(buildPayload())
        navigate(`/app/rfq/${created.id}`, { state: buildFlashState('Запрос создан. Администратор скоро рассмотрит его.') })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить запрос')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Container className="py-8 text-sm text-slate-500">Загрузка…</Container>
  }

  return (
    <Container className="space-y-6 py-6">
      <Link to="/app/rfq" className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900">
        <ArrowLeft className="size-4" /> К списку запросов
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {mode === 'edit' ? 'Редактировать запрос' : 'Создать запрос (RFQ)'}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Опишите, какой товар вы ищете. Администрация подберёт продавцов и свяжет вас в переписке.
        </p>
      </div>

      <Card>
        <CardHeader title="Что вам нужно" />
        <CardContent className="grid gap-3">
          <Field label="Название запроса *">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: «Мёд натуральный для розницы в Германии»"
            />
          </Field>

          <Field label="Подробное описание">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Какие свойства, упаковка, сертификация, ограничения. Чем подробнее, тем точнее подбор."
              rows={4}
            />
          </Field>

          <Grid>
            <Field label="Категория">
              <Select value={sectorId} onChange={(v) => { setSectorId(v); setSubcategoryId('') }}>
                <option value="">— Любая категория —</option>
                {CATALOG_SECTORS.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Подкатегория">
              <Select value={subcategoryId} onChange={setSubcategoryId} disabled={!sectorId}>
                <option value="">— Любая подкатегория —</option>
                {subcategories.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </Field>
          </Grid>

          <Grid>
            <Field label="Страна назначения">
              <Select value={targetCountry} onChange={setTargetCountry}>
                <option value="">— Не указано —</option>
                {CATALOG_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.name}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Объём / количество">
              <Input
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Например: 1 контейнер, 10 000 шт."
              />
            </Field>
          </Grid>

          <Grid>
            <Field label="Ориентир бюджета (USD)">
              <Input
                value={budgetUsd}
                onChange={(e) => setBudgetUsd(e.target.value)}
                placeholder="50000"
                inputMode="numeric"
              />
            </Field>
            <Field label="Желаемый срок">
              <Input
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                type="date"
              />
            </Field>
          </Grid>

          <Field label="Incoterms (если важно)">
            <Input value={incoterms} onChange={(e) => setIncoterms(e.target.value)} placeholder="FOB Алматы / CIF Гамбург" />
          </Field>

          <Field label="Дополнительные пожелания">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Особые условия, предпочтения по поставщикам, форматы оплаты..."
              rows={3}
            />
          </Field>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button variant="primary" onClick={() => void handleSave()} disabled={saving}>
              {saving ? 'Сохранение…' : mode === 'edit' ? 'Сохранить изменения' : 'Создать запрос'}
            </Button>
            <Link to="/app/rfq" className="text-sm text-slate-600 hover:underline">Отмена</Link>
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
  disabled,
  children,
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 disabled:opacity-50"
    >
      {children}
    </select>
  )
}
