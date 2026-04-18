import { useCallback, useEffect, useState } from 'react'
import { Save, Shield, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { Button } from '@shared/ui/Button'
import { Badge } from '@shared/ui/Badge'
import { Input } from '@shared/ui/Input'
import {
  apiGetDealGuarantees,
  apiSetDealGuarantee,
} from '@shared/api/dealApi'
import type { DealGuarantee, GuaranteeType } from '@features/deals/dealData'

type Props = {
  dealId: string
}

type TypeMeta = { id: GuaranteeType; name: string; provider: string; description: string }

const GUARANTEE_META: TypeMeta[] = [
  {
    id: 'export_credit',
    name: 'Экспортное кредитование',
    provider: 'KazakhExport',
    description: 'Финансирование экспортной сделки через уполномоченный институт поддержки.',
  },
  {
    id: 'insurance',
    name: 'Страхование экспортных рисков',
    provider: 'KazakhExport',
    description: 'Покрытие коммерческих и политических рисков покупателя / страны назначения.',
  },
  {
    id: 'letter_of_credit',
    name: 'Аккредитив',
    provider: 'Банк-партнёр',
    description: 'Безотзывное обязательство банка по оплате против представленных документов.',
  },
  {
    id: 'bank_guarantee',
    name: 'Банковская гарантия',
    provider: 'Банк-партнёр',
    description: 'Гарантия исполнения обязательств (тендер / аванс / исполнение / гарантия качества).',
  },
]

function providerBadgeTone(provider: string): 'success' | 'info' | 'neutral' {
  if (provider === 'KazakhExport') return 'success'
  if (provider === 'Банк-партнёр') return 'info'
  return 'neutral'
}

export function DealGuaranteesRemote({ dealId }: Props) {
  const [items, setItems] = useState<DealGuarantee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notesDraft, setNotesDraft] = useState<Record<GuaranteeType, string>>({} as Record<GuaranteeType, string>)
  const [saving, setSaving] = useState<GuaranteeType | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await apiGetDealGuarantees(dealId)
      setItems(data)
      const draft: Record<string, string> = {}
      for (const g of data) draft[g.type] = g.notes ?? ''
      setNotesDraft(draft as Record<GuaranteeType, string>)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки гарантий')
    } finally {
      setLoading(false)
    }
  }, [dealId])

  useEffect(() => {
    void load()
  }, [load])

  const current = (type: GuaranteeType): DealGuarantee | undefined => items.find((g) => g.type === type)

  const setEnabled = async (type: GuaranteeType, enabled: boolean) => {
    setSaving(type)
    setError(null)
    try {
      const notes = notesDraft[type] ?? current(type)?.notes ?? ''
      const updated = await apiSetDealGuarantee(dealId, type, enabled, notes)
      setItems(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось обновить гарантию')
    } finally {
      setSaving(null)
    }
  }

  const saveNotes = async (type: GuaranteeType) => {
    const existing = current(type)
    if (!existing) return
    setSaving(type)
    setError(null)
    try {
      const updated = await apiSetDealGuarantee(dealId, type, existing.enabled, notesDraft[type] ?? '')
      setItems(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить примечание')
    } finally {
      setSaving(null)
    }
  }

  return (
    <Card>
      <CardHeader
        title="Гарантии и страхование"
        subtitle="Отметки KazakhExport и банков-партнёров (ТЗ 5.6)"
      />
      <CardContent className="space-y-3">
        {error && (
          <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-800">
            {error}
          </div>
        )}

        {loading && <div className="text-sm text-slate-500">Загрузка…</div>}

        {!loading && GUARANTEE_META.map((meta) => {
          const active = current(meta.id)
          const enabled = active?.enabled ?? false
          const isKE = meta.provider === 'KazakhExport'
          return (
            <div
              key={meta.id}
              className={`rounded-xl border p-4 ${enabled ? 'border-emerald-200 bg-emerald-50/60' : isKE ? 'border-amber-200 bg-amber-50/40' : 'border-slate-200 bg-white'}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                {enabled ? (
                  <ShieldCheck className="size-4 text-emerald-600" />
                ) : (
                  <Shield className="size-4 text-slate-400" />
                )}
                <span className="font-semibold text-slate-900">{meta.name}</span>
                <Badge tone={providerBadgeTone(meta.provider)}>{meta.provider}</Badge>
                {enabled && <Badge tone="success">Активно</Badge>}
                <div className="ml-auto">
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={enabled}
                      disabled={saving === meta.id}
                      onChange={(e) => void setEnabled(meta.id, e.target.checked)}
                      className="size-4 accent-brand-blue"
                    />
                    {enabled ? 'Отключить' : 'Отметить применимо'}
                  </label>
                </div>
              </div>

              <p className="mt-1.5 text-sm text-slate-600">{meta.description}</p>

              {enabled && (
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <label className="flex flex-1 flex-col gap-1 text-xs text-slate-600">
                    Примечание (номер полиса, банк, ограничения)
                    <Input
                      value={notesDraft[meta.id] ?? active?.notes ?? ''}
                      onChange={(e) =>
                        setNotesDraft((prev) => ({ ...prev, [meta.id]: e.target.value }))
                      }
                      placeholder="Например: Полис №KE-2026-0123, лимит $1.2M, до 12.2026"
                    />
                  </label>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={saving === meta.id}
                    onClick={() => void saveNotes(meta.id)}
                    className="gap-1"
                  >
                    <Save className="size-3.5" />
                    Сохранить
                  </Button>
                </div>
              )}
            </div>
          )
        })}

        <p className="text-xs text-slate-500">
          Гарантии через KazakhExport оформляются отдельно — платформа фиксирует факт применимости
          и реквизиты. Интеграция с бэкофисом KazakhExport входит в план Этапа 2.
        </p>
      </CardContent>
    </Card>
  )
}
