import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { buildFlashState } from '../../adapters/navigationState'
import { apiCreateProduct, apiGetProduct, apiUpdateProduct, apiSubmitProductForModeration } from '../../adapters/productApi'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { CATALOG_SECTORS, CATALOG_COUNTRIES, KZ_REGIONS } from '../../data/catalogStructure'

type Mode = 'create' | 'edit'

export function AppProductsUpsertPage({ mode }: { mode: Mode }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [hsCode, setHsCode] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [moq, setMoq] = useState('')
  const [incoterms, setIncoterms] = useState('')
  const [leadTimeDays, setLeadTimeDays] = useState('')
  const [packaging, setPackaging] = useState('')
  const [sectorId, setSectorId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [countryCode, setCountryCode] = useState('KZ')
  const [regionCode, setRegionCode] = useState('')
  const [samplesAvailable, setSamplesAvailable] = useState(false)
  const [privateLabel, setPrivateLabel] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingProduct, setLoadingProduct] = useState(mode === 'edit')

  const selectedSector = useMemo(() => CATALOG_SECTORS.find((s) => s.id === sectorId), [sectorId])
  const subcategories = selectedSector?.subcategories ?? []
  const showRegion = countryCode === 'KZ'

  useEffect(() => {
    if (mode === 'edit' && id) {
      void apiGetProduct(id)
        .then((p) => {
          setName(p.name)
          setCategory(p.category)
          setHsCode(p.hsCode)
          setDescription(p.description)
          setPrice(p.price)
          setMoq(p.moq)
          setIncoterms(p.incoterms)
          setLeadTimeDays(String(p.leadTimeDays))
          setPackaging(p.packaging)
          setSectorId(p.sectorId)
          setSubcategoryId(p.subcategoryId)
          setCountryCode(p.countryCode)
          setRegionCode(p.regionCode ?? '')
          setSamplesAvailable(p.samplesAvailable)
          setPrivateLabel(p.privateLabel)
        })
        .catch(() => setError('Не удалось загрузить товар'))
        .finally(() => setLoadingProduct(false))
    }
  }, [mode, id])

  const handleSaveDraft = async () => {
    setSaving(true)
    setError(null)
    try {
      if (mode === 'edit' && id) {
        await apiUpdateProduct(id, buildPayload())
      } else {
        await apiCreateProduct(buildPayload())
      }
      navigate('/app/products', { state: buildFlashState('Черновик сохранён.') })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitModeration = async () => {
    setSaving(true)
    setError(null)
    try {
      let productId = id
      if (mode === 'create') {
        const created = await apiCreateProduct(buildPayload())
        productId = created.id
      } else if (id) {
        await apiUpdateProduct(id, buildPayload())
      }
      if (productId) {
        await apiSubmitProductForModeration(productId)
      }
      navigate('/app/products', { state: buildFlashState('Товар отправлен на модерацию.') })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  function buildPayload() {
    return {
      name,
      category,
      hsCode,
      description,
      price,
      moq,
      incoterms,
      leadTimeDays: Number(leadTimeDays) || 0,
      packaging,
      sectorId,
      subcategoryId,
      countryCode,
      regionCode: showRegion ? regionCode : undefined,
      samplesAvailable,
      privateLabel,
    }
  }

  const title = mode === 'edit' ? 'Редактировать товар' : 'Добавить товар'
  const canSubmit = !!(name && sectorId && subcategoryId)

  if (loadingProduct) {
    return <div className="py-6 text-sm text-slate-500">Загрузка...</div>
  }

  return (
    <div className="grid gap-4">
      <div>
        <div className="text-xl font-semibold tracking-tight text-slate-900">{title}</div>
        <div className="mt-1 text-sm text-slate-600">
          Заполните карточку товара. После сохранения можно отправить на модерацию.
        </div>
      </div>

      <Card>
        <CardHeader title="Основная информация" />
        <CardContent className="grid gap-3">
          <Grid>
            <Field label="Название товара *">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Органический мёд 500г" />
            </Field>
            <Field label="Категория">
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Напр.: Пищевая продукция" />
            </Field>
          </Grid>

          <Grid>
            <Field label="Сектор каталога *">
              <select
                value={sectorId}
                onChange={(e) => { setSectorId(e.target.value); setSubcategoryId('') }}
                className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              >
                <option value="">— Выберите сектор —</option>
                {CATALOG_SECTORS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Подкатегория *">
              <select
                value={subcategoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
                disabled={!sectorId}
                className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 disabled:opacity-50"
              >
                <option value="">— Выберите подкатегорию —</option>
                {subcategories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
          </Grid>

          <Grid>
            <Field label="Страна происхождения">
              <select
                value={countryCode}
                onChange={(e) => { setCountryCode(e.target.value); if (e.target.value !== 'KZ') setRegionCode('') }}
                className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              >
                {CATALOG_COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </Field>
            {showRegion && (
              <Field label="Регион (область)">
                <select
                  value={regionCode}
                  onChange={(e) => setRegionCode(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                >
                  <option value="">— Регион —</option>
                  {KZ_REGIONS.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
                </select>
              </Field>
            )}
          </Grid>

          <Grid>
            <Field label="HS-код">
              <Input value={hsCode} onChange={(e) => setHsCode(e.target.value)} placeholder="040900" />
            </Field>
            <Field label="Incoterms">
              <Input value={incoterms} onChange={(e) => setIncoterms(e.target.value)} placeholder="FOB Алматы / CIF Гамбург" />
            </Field>
          </Grid>

          <Field label="Описание">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Подробное описание товара..." />
          </Field>

          <Grid>
            <Field label="Цена (диапазон)">
              <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1.60–2.40 USD" />
            </Field>
            <Field label="MOQ">
              <Input value={moq} onChange={(e) => setMoq(e.target.value)} placeholder="10 000 шт." />
            </Field>
          </Grid>

          <Grid>
            <Field label="Срок (дни)">
              <Input value={leadTimeDays} onChange={(e) => setLeadTimeDays(e.target.value)} placeholder="14" inputMode="numeric" />
            </Field>
            <Field label="Упаковка">
              <Input value={packaging} onChange={(e) => setPackaging(e.target.value)} placeholder="коробки по 12 шт." />
            </Field>
          </Grid>

          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={samplesAvailable} onChange={(e) => setSamplesAvailable(e.target.checked)} className="size-4 rounded border-border" />
              Образцы доступны
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={privateLabel} onChange={(e) => setPrivateLabel(e.target.checked)} className="size-4 rounded border-border" />
              Private label
            </label>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="secondary" disabled={saving || !canSubmit} onClick={() => void handleSaveDraft()}>
              {saving ? 'Сохранение...' : 'Сохранить черновик'}
            </Button>
            <Button variant="primary" disabled={saving || !canSubmit} onClick={() => void handleSubmitModeration()}>
              {saving ? 'Отправка...' : 'Отправить на модерацию'}
            </Button>
          </div>

          {error && <div role="alert" className="text-sm text-red-600">{error}</div>}
        </CardContent>
      </Card>
    </div>
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
