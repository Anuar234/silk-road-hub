import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle2, Circle, FileText, MapPin, Paperclip, Plus, Truck } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { Button } from '@shared/ui/Button'
import { Badge } from '@shared/ui/Badge'
import { Input } from '@shared/ui/Input'
import {
  apiCreateShipment,
  apiGetRouteTemplates,
  apiGetShipments,
  apiUpdateShipmentStage,
  apiAddShipmentDocument,
} from '@shared/api/logisticsApi'
import { uploadDealFile } from '@shared/api/fileApi'
import type { RouteTemplate, Shipment, ShipmentStage, ShipmentStageStatus } from '@features/logistics/logisticsData'

type Props = {
  dealId: string
}

const stageStatusLabels: Record<ShipmentStageStatus, string> = {
  pending: 'Ожидание',
  in_progress: 'В процессе',
  completed: 'Завершено',
}

function stageTone(s: ShipmentStageStatus): 'neutral' | 'info' | 'success' {
  if (s === 'completed') return 'success'
  if (s === 'in_progress') return 'info'
  return 'neutral'
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return iso
  }
}

export function DealLogisticsRemote({ dealId }: Props) {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [templates, setTemplates] = useState<RouteTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showNew, setShowNew] = useState(false)
  const [templateId, setTemplateId] = useState<string>('')
  const [customOrigin, setCustomOrigin] = useState('')
  const [customDest, setCustomDest] = useState('')
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [ships, tpls] = await Promise.all([apiGetShipments(dealId), apiGetRouteTemplates()])
      setShipments(ships)
      setTemplates(tpls)
      if (!templateId && tpls.length > 0) setTemplateId(tpls[0].id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [dealId, templateId])

  useEffect(() => {
    void load()
  }, [load])

  const createShipment = async () => {
    setCreating(true)
    setError(null)
    try {
      const created = await apiCreateShipment({
        dealId,
        routeTemplateId: templateId || undefined,
        origin: templateId ? undefined : customOrigin.trim() || undefined,
        destination: templateId ? undefined : customDest.trim() || undefined,
      })
      setShipments((prev) => [created, ...prev])
      setShowNew(false)
      setCustomOrigin('')
      setCustomDest('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать отправление')
    } finally {
      setCreating(false)
    }
  }

  const updateStage = async (
    shipmentId: string,
    stageId: string,
    patch: Parameters<typeof apiUpdateShipmentStage>[1] extends infer P ? Omit<P & { stageId: string }, 'stageId'> : never,
  ) => {
    setError(null)
    try {
      const updated = await apiUpdateShipmentStage(shipmentId, { stageId, ...patch })
      setShipments((prev) => prev.map((s) => (s.id === shipmentId ? updated : s)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось обновить этап')
    }
  }

  const attachDoc = async (shipmentId: string, file: File) => {
    setError(null)
    try {
      const uploaded = await uploadDealFile(file)
      const updated = await apiAddShipmentDocument(shipmentId, uploaded.fileId)
      setShipments((prev) => prev.map((s) => (s.id === shipmentId ? updated : s)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось прикрепить документ')
    }
  }

  return (
    <Card>
      <CardHeader
        title="Логистика сделки"
        subtitle="Маршрут, этапы доставки, документы (ТЗ 5.5)"
      />
      <CardContent className="space-y-4">
        {error && (
          <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-800">
            {error}
          </div>
        )}

        {loading && <div className="text-sm text-slate-500">Загрузка…</div>}

        {!loading && shipments.length === 0 && !showNew && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-5 text-center text-sm text-slate-600">
            Отправлений по сделке пока нет. Выберите типовой маршрут, чтобы создать первое отправление с этапами.
          </div>
        )}

        {shipments.length > 0 && (
          <div className="space-y-3">
            {shipments.map((sh) => (
              <ShipmentRow
                key={sh.id}
                shipment={sh}
                onAdvanceStage={(stage) => updateStage(sh.id, stage.id, nextStagePatch(stage))}
                onAttachFile={(file) => attachDoc(sh.id, file)}
              />
            ))}
          </div>
        )}

        {showNew ? (
          <div className="space-y-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Truck className="size-4 text-slate-500" />
              Новое отправление
            </div>
            <label className="flex flex-col gap-1 text-xs text-slate-600">
              Типовой маршрут (7 шаблонов ТЗ 5.5)
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm"
              >
                <option value="">— произвольный маршрут —</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </label>

            {!templateId && (
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs text-slate-600">
                  Откуда
                  <Input value={customOrigin} onChange={(e) => setCustomOrigin(e.target.value)} placeholder="Казахстан" />
                </label>
                <label className="flex flex-col gap-1 text-xs text-slate-600">
                  Куда
                  <Input value={customDest} onChange={(e) => setCustomDest(e.target.value)} placeholder="Китай" />
                </label>
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowNew(false)} disabled={creating}>
                Отмена
              </Button>
              <Button size="sm" onClick={() => void createShipment()} disabled={creating} className="gap-2">
                <Plus className="size-4" />
                {creating ? 'Создание…' : 'Создать'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => setShowNew(true)} className="gap-2">
              <Plus className="size-4" />
              Новое отправление
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function nextStagePatch(stage: ShipmentStage): { stageStatus: ShipmentStageStatus; stageDate?: string } {
  if (stage.status === 'pending') return { stageStatus: 'in_progress' }
  if (stage.status === 'in_progress') {
    return { stageStatus: 'completed', stageDate: new Date().toISOString() }
  }
  return { stageStatus: 'pending' }
}

type RowProps = {
  shipment: Shipment
  onAdvanceStage: (stage: ShipmentStage) => Promise<void>
  onAttachFile: (file: File) => Promise<void>
}

function ShipmentRow({ shipment, onAdvanceStage, onAttachFile }: RowProps) {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [attaching, setAttaching] = useState(false)

  const stages = Array.isArray(shipment.stages) ? shipment.stages : []
  const completedCount = stages.filter((s) => s.status === 'completed').length
  const progress = stages.length === 0 ? 0 : Math.round((completedCount / stages.length) * 100)

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Truck className="size-4 text-slate-500" />
        <span className="font-semibold text-slate-900">{shipment.routeName || 'Произвольный маршрут'}</span>
        <Badge tone="neutral">
          <MapPin className="mr-1 inline size-3" />
          {shipment.origin} → {shipment.destination}
        </Badge>
        <span className="ml-auto text-xs text-slate-500">
          {completedCount} / {stages.length} этапов · {progress}%
        </span>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand-blue transition-[width]"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ol className="mt-4 space-y-2">
        {stages.map((stage, idx) => (
          <li
            key={stage.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 text-sm"
          >
            {stage.status === 'completed' ? (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            ) : (
              <Circle className="size-4 shrink-0 text-slate-400" />
            )}
            <span className="text-xs text-slate-400">{idx + 1}.</span>
            <span className="font-medium text-slate-800">{stage.name}</span>
            <Badge tone={stageTone(stage.status)}>{stageStatusLabels[stage.status]}</Badge>
            {stage.location && <span className="text-xs text-slate-500">{stage.location}</span>}
            {stage.date && <span className="text-xs text-slate-500">{formatDate(stage.date)}</span>}
            {stage.status !== 'completed' && (
              <Button
                size="sm"
                variant="secondary"
                className="ml-auto"
                onClick={() => void onAdvanceStage(stage)}
              >
                {stage.status === 'pending' ? 'Начать' : 'Завершить'}
              </Button>
            )}
          </li>
        ))}
        {stages.length === 0 && (
          <li className="text-sm text-slate-500">Этапы не определены (произвольный маршрут).</li>
        )}
      </ol>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500">
          <FileText className="size-3.5" />
          Документы ({shipment.documentIds.length})
        </div>
        {shipment.documentIds.length > 0 ? (
          <div className="space-y-1">
            {shipment.documentIds.map((fid) => (
              <a
                key={fid}
                href={`/api/files/${encodeURIComponent(fid)}`}
                className="flex items-center gap-2 rounded-lg border border-border bg-slate-50/50 px-2 py-1 text-xs text-slate-700 hover:border-brand-blue/40 hover:bg-slate-50"
              >
                <FileText className="size-3.5 text-slate-500" />
                <span className="truncate font-mono">{fid.slice(0, 8)}…</span>
                <span className="ml-auto text-brand-blue">Скачать</span>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-500">Документы отсутствуют</div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.docx"
            className="max-w-[220px] text-xs text-slate-700 file:mr-2 file:rounded file:border file:border-slate-300 file:bg-white file:px-2 file:py-1 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-50"
          />
          <Button
            size="sm"
            variant="secondary"
            className="gap-1"
            disabled={attaching}
            onClick={async () => {
              const file = fileRef.current?.files?.[0]
              if (!file) return
              setAttaching(true)
              try {
                await onAttachFile(file)
                if (fileRef.current) fileRef.current.value = ''
              } finally {
                setAttaching(false)
              }
            }}
          >
            <Paperclip className="size-3.5" />
            {attaching ? 'Загрузка…' : 'Прикрепить'}
          </Button>
        </div>
      </div>
    </div>
  )
}
