import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Circle, Coins, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { Button } from '@shared/ui/Button'
import { Badge } from '@shared/ui/Badge'
import { Input } from '@shared/ui/Input'
import {
  apiCreatePaymentPlan,
  apiGetPaymentPlan,
  apiUpdatePaymentStage,
} from '@shared/api/dealApi'
import type { DealPaymentPlan, PaymentStage, PaymentStageStatus } from '@features/deals/dealData'

type Props = {
  dealId: string
}

const statusLabels: Record<PaymentStageStatus, string> = {
  pending: 'Ожидает',
  invoiced: 'Выставлен счёт',
  paid: 'Оплачен',
  confirmed: 'Подтверждён',
}

const statusOrder: PaymentStageStatus[] = ['pending', 'invoiced', 'paid', 'confirmed']

function nextStatus(current: PaymentStageStatus): PaymentStageStatus | null {
  const idx = statusOrder.indexOf(current)
  if (idx === -1 || idx === statusOrder.length - 1) return null
  return statusOrder[idx + 1]
}

function statusTone(s: PaymentStageStatus): 'neutral' | 'info' | 'warning' | 'success' {
  if (s === 'confirmed') return 'success'
  if (s === 'paid') return 'warning'
  if (s === 'invoiced') return 'info'
  return 'neutral'
}

function formatUsd(amount: number | null): string {
  if (amount == null) return '—'
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`
  return `$${amount.toLocaleString()}`
}

const DEFAULT_STAGES = [
  { label: 'Аванс (предоплата)', percentage: 30 },
  { label: 'По факту отгрузки', percentage: 40 },
  { label: 'Финальный платёж', percentage: 30 },
]

export function DealPaymentsRemote({ dealId }: Props) {
  const [plan, setPlan] = useState<DealPaymentPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [totalInput, setTotalInput] = useState('')
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await apiGetPaymentPlan(dealId)
      setPlan(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки плана расчётов')
    } finally {
      setLoading(false)
    }
  }, [dealId])

  useEffect(() => {
    void load()
  }, [load])

  const createPlan = async () => {
    const amount = Number(totalInput.replace(/\s/g, ''))
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Укажите положительную сумму контракта в USD.')
      return
    }
    setCreating(true)
    setError(null)
    try {
      const created = await apiCreatePaymentPlan(dealId, amount, DEFAULT_STAGES)
      setPlan(created)
      setTotalInput('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать план')
    } finally {
      setCreating(false)
    }
  }

  const advanceStage = async (stage: PaymentStage) => {
    const next = nextStatus(stage.status)
    if (!next) return
    setError(null)
    try {
      const updates: { status: PaymentStageStatus; paidAt?: string } = { status: next }
      if (next === 'paid') updates.paidAt = new Date().toISOString()
      const updated = await apiUpdatePaymentStage(dealId, stage.id, updates)
      setPlan(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось обновить этап')
    }
  }

  return (
    <Card>
      <CardHeader
        title="Финансовый план сделки"
        subtitle="Этапы расчётов: аванс, отгрузка, финальный платёж (ТЗ 5.6)"
      />
      <CardContent className="space-y-4">
        {error && (
          <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-800">
            {error}
          </div>
        )}

        {loading && <div className="text-sm text-slate-500">Загрузка…</div>}

        {!loading && !plan && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
              <Coins className="size-4 text-slate-500" />
              План расчётов не создан
            </div>
            <p className="mb-3 text-sm text-slate-600">
              Задайте сумму контракта. Система создаст три типовых этапа по схеме 30 / 40 / 30%.
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1 text-xs text-slate-600">
                Сумма контракта, USD
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Например, 250000"
                  value={totalInput}
                  onChange={(e) => setTotalInput(e.target.value)}
                  className="w-56"
                />
              </label>
              <Button size="sm" onClick={() => void createPlan()} disabled={creating || !totalInput} className="gap-2">
                <Coins className="size-4" />
                {creating ? 'Создание…' : 'Создать план'}
              </Button>
            </div>
          </div>
        )}

        {plan && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <Coins className="size-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Сумма контракта</span>
              <span className="text-lg font-semibold text-slate-900">{formatUsd(plan.totalUsd)}</span>
              <Badge tone="neutral" className="ml-auto">
                {plan.stages.filter((s) => s.status === 'confirmed').length} / {plan.stages.length} подтверждено
              </Badge>
            </div>

            <div className="divide-y divide-slate-100 rounded-xl border border-border">
              {plan.stages.map((stage, idx) => {
                const next = nextStatus(stage.status)
                return (
                  <div key={stage.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                    {stage.status === 'confirmed' ? (
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                    ) : (
                      <Circle className="size-4 shrink-0 text-slate-400" />
                    )}
                    <span className="text-xs text-slate-400">{idx + 1}.</span>
                    <span className="font-medium text-slate-800">{stage.label}</span>
                    <Badge tone="neutral">{stage.percentage}%</Badge>
                    <span className="font-mono text-xs text-slate-700">{formatUsd(stage.amountUsd)}</span>
                    <Badge tone={statusTone(stage.status)}>{statusLabels[stage.status]}</Badge>
                    {stage.paidAt && (
                      <span className="text-xs text-slate-500">
                        <FileText className="mr-1 inline size-3" />
                        {new Date(stage.paidAt).toLocaleDateString('ru-RU')}
                      </span>
                    )}
                    {next && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="ml-auto"
                        onClick={() => void advanceStage(stage)}
                      >
                        → {statusLabels[next]}
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>

            <p className="text-xs text-slate-500">
              Онлайн-платежи и ЭЦП не входят в пилотный этап (ТЗ 5.6). Статусы ведутся вручную
              ответственным менеджером по факту получения платежа или подтверждения банка.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
