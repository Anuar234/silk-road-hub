import { useMemo, useState } from 'react'
import { DollarSign, FileSignature, Shield, Truck } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { Badge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { getContractsByDeal, createContract } from '@features/contracts/contractData'
import { CONTRACT_TEMPLATES, APPLICABLE_LAWS } from '@features/contracts/contractTemplates'
import type { ContractTemplateType, ApplicableLaw } from '@features/contracts/contractData'
import { getShipmentsByDeal, createShipment, ROUTE_TEMPLATES } from '@features/logistics/logisticsData'
import {
  getPaymentPlan,
  getDealGuarantees,
  createPaymentPlan,
  setDealGuarantee,
  DEFAULT_PAYMENT_STAGES,
  GUARANTEE_TYPES,
  type GuaranteeType,
} from '@features/deals/dealData'

type SectionProps = { dealId: string; version: number }

/* ── Contract Section ── */

export function ContractSection({ dealId, version }: SectionProps) {
  const contracts = useMemo(() => getContractsByDeal(dealId), [dealId, version])
  const [showForm, setShowForm] = useState(false)
  const [templateType, setTemplateType] = useState<ContractTemplateType>('export')
  const [applicableLaw, setApplicableLaw] = useState<ApplicableLaw>('KZ')

  const handleCreate = () => {
    createContract({ dealId, templateType, applicableLaw })
    setShowForm(false)
  }

  return (
    <Card>
      <CardHeader title="Контракт" subtitle={contracts.length > 0 ? `${contracts.length} контракт(ов)` : undefined} />
      <CardContent className="space-y-3">
        {contracts.map((c) => {
          const tmpl = CONTRACT_TEMPLATES.find((t) => t.type === c.templateType)
          const law = APPLICABLE_LAWS.find((l) => l.id === c.applicableLaw)
          return (
            <div key={c.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
              <FileSignature className="size-4 text-slate-400" />
              <span className="font-medium text-slate-900">{tmpl?.name ?? c.templateType}</span>
              <Badge tone="neutral">{law?.name ?? c.applicableLaw}</Badge>
              <Badge tone={c.status === 'signed' || c.status === 'active' ? 'success' : 'warning'}>{c.status}</Badge>
              {c.deadlines.length > 0 && <span className="text-xs text-slate-500">{c.deadlines.length} дедлайн(ов)</span>}
            </div>
          )
        })}
        {!showForm ? (
          <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => setShowForm(true)}>
            <FileSignature className="size-4" /> Добавить контракт
          </Button>
        ) : (
          <div className="grid gap-3 rounded-lg border border-border bg-slate-50 p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-xs font-medium text-slate-500">Шаблон</div>
                <select value={templateType} onChange={(e) => setTemplateType(e.target.value as ContractTemplateType)} className="h-9 w-full rounded-lg border border-border bg-white px-2 text-sm">
                  {CONTRACT_TEMPLATES.map((t) => <option key={t.type} value={t.type}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <div className="mb-1 text-xs font-medium text-slate-500">Применимое право</div>
                <select value={applicableLaw} onChange={(e) => setApplicableLaw(e.target.value as ApplicableLaw)} className="h-9 w-full rounded-lg border border-border bg-white px-2 text-sm">
                  {APPLICABLE_LAWS.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate}>Создать</Button>
              <Button size="sm" variant="secondary" onClick={() => setShowForm(false)}>Отмена</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ── Logistics Section ── */

export function LogisticsSection({ dealId, version }: SectionProps) {
  const shipments = useMemo(() => getShipmentsByDeal(dealId), [dealId, version])
  const [showForm, setShowForm] = useState(false)
  const [routeId, setRouteId] = useState(ROUTE_TEMPLATES[0]?.id ?? '')

  const handleCreate = () => {
    createShipment({ dealId, routeTemplateId: routeId })
    setShowForm(false)
  }

  return (
    <Card>
      <CardHeader title="Логистика" subtitle={shipments.length > 0 ? `${shipments.length} отправление(й)` : undefined} />
      <CardContent className="space-y-3">
        {shipments.map((s) => (
          <div key={s.id} className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
              <Truck className="size-4 text-slate-400" />
              {s.routeName}
            </div>
            <div className="mt-2 space-y-1">
              {s.stages.map((stage) => (
                <div key={stage.id} className="flex items-center gap-2 text-sm">
                  <div className={`size-2 rounded-full ${stage.status === 'completed' ? 'bg-emerald-500' : stage.status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-300'}`} />
                  <span className={stage.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-700'}>{stage.name}</span>
                  {stage.date && <span className="text-xs text-slate-400">{stage.date}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
        {!showForm ? (
          <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => setShowForm(true)}>
            <Truck className="size-4" /> Добавить отправление
          </Button>
        ) : (
          <div className="grid gap-3 rounded-lg border border-border bg-slate-50 p-3">
            <div>
              <div className="mb-1 text-xs font-medium text-slate-500">Маршрут</div>
              <select value={routeId} onChange={(e) => setRouteId(e.target.value)} className="h-9 w-full rounded-lg border border-border bg-white px-2 text-sm">
                {ROUTE_TEMPLATES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate}>Создать</Button>
              <Button size="sm" variant="secondary" onClick={() => setShowForm(false)}>Отмена</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ── Payment Section ── */

export function PaymentSection({ dealId, version }: SectionProps) {
  const plan = useMemo(() => getPaymentPlan(dealId), [dealId, version])
  const [totalInput, setTotalInput] = useState('')

  const handleCreate = () => {
    const total = Number(totalInput)
    if (total > 0) {
      createPaymentPlan(dealId, total, DEFAULT_PAYMENT_STAGES)
      setTotalInput('')
    }
  }

  return (
    <Card>
      <CardHeader title="Этапы расчётов" />
      <CardContent className="space-y-3">
        {plan ? (
          <>
            <div className="text-sm text-slate-600">Сумма сделки: <span className="font-semibold">${plan.totalUsd.toLocaleString()}</span></div>
            <div className="space-y-2">
              {plan.stages.map((stage) => (
                <div key={stage.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                  <DollarSign className="size-4 text-slate-400" />
                  <span className="font-medium text-slate-900">{stage.label}</span>
                  <span className="text-slate-500">{stage.percentage}%</span>
                  {stage.amountUsd !== null && <span className="text-slate-500">(${stage.amountUsd.toLocaleString()})</span>}
                  <Badge tone={stage.status === 'confirmed' || stage.status === 'paid' ? 'success' : stage.status === 'invoiced' ? 'info' : 'warning'}>
                    {stage.status === 'pending' ? 'Ожидание' : stage.status === 'invoiced' ? 'Выставлен счёт' : stage.status === 'paid' ? 'Оплачено' : 'Подтверждено'}
                  </Badge>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <div className="mb-1 text-xs font-medium text-slate-500">Сумма сделки (USD)</div>
              <input
                type="number"
                value={totalInput}
                onChange={(e) => setTotalInput(e.target.value)}
                placeholder="50000"
                className="h-9 w-40 rounded-lg border border-border bg-white px-2 text-sm outline-none focus:border-brand-blue"
              />
            </div>
            <Button size="sm" disabled={!totalInput || Number(totalInput) <= 0} onClick={handleCreate} className="gap-1.5">
              <DollarSign className="size-4" /> Создать план расчётов
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ── Guarantees Section ── */

export function GuaranteesSection({ dealId, version }: SectionProps) {
  const guarantees = useMemo(() => getDealGuarantees(dealId), [dealId, version])

  const handleToggle = (type: GuaranteeType, current: boolean) => {
    setDealGuarantee(dealId, type, !current)
  }

  return (
    <Card>
      <CardHeader title="Страхование и гарантии" />
      <CardContent className="space-y-2">
        {GUARANTEE_TYPES.map((gt) => {
          const existing = guarantees.find((g) => g.type === gt.id)
          const enabled = existing?.enabled ?? false
          return (
            <label key={gt.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-sm cursor-pointer hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={enabled}
                onChange={() => handleToggle(gt.id, enabled)}
                className="size-4 rounded border-border"
              />
              <Shield className="size-4 text-slate-400" />
              <div>
                <span className="font-medium text-slate-900">{gt.name}</span>
                <span className="ml-2 text-slate-500">({gt.provider})</span>
              </div>
            </label>
          )
        })}
      </CardContent>
    </Card>
  )
}
