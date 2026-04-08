import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, FileText, MessageCircle, ShieldCheck, Truck, FileSignature, DollarSign, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../auth/auth'
import { getDealById, getDealProduct, getDealSeller, updateDealStatus, DEAL_STATUS_LABELS, DEAL_STATUS_TONE, DOC_STATUS_LABELS, getPaymentPlan, getDealGuarantees, createPaymentPlan, setDealGuarantee, DEFAULT_PAYMENT_STAGES, GUARANTEE_TYPES } from '../../data/dealData'
import type { GuaranteeType } from '../../data/dealData'
import { addMessage, addSystemMessage } from '../../data/messagingData'
import { getParticipantId, getSellerIdFromAuth } from '../../data/messagingData'
import { usePlatformDataVersion } from '../../hooks/usePlatformDataVersion'
import { getContractsByDeal, createContract } from '../../data/contractData'
import { CONTRACT_TEMPLATES, APPLICABLE_LAWS } from '../../data/contractTemplates'
import type { ContractTemplateType, ApplicableLaw } from '../../data/contractData'
import { getShipmentsByDeal, createShipment, ROUTE_TEMPLATES } from '../../data/logisticsData'

export function AppDealDetailPage() {
  const { id } = useParams()
  const auth = useAuth()
  const version = usePlatformDataVersion()
  const myId = useMemo(() => getParticipantId(auth), [auth])
  const mySellerId = useMemo(() => getSellerIdFromAuth(auth), [auth])

  const deal = useMemo(() => getDealById(id ?? ''), [id, version])
  const product = useMemo(() => (deal ? getDealProduct(deal) : null), [deal])
  const seller = useMemo(() => (deal ? getDealSeller(deal) : null), [deal])
  const amBuyerInDeal = deal ? (deal.buyerId === myId || deal.buyerId === mySellerId) : true

  if (!deal) {
    return (
      <div className="py-6">
        <p className="text-sm text-slate-600">Сделка не найдена.</p>
        <Link to="/app/deals" className="mt-2 inline-block text-sm text-brand-blue hover:underline">← К списку сделок</Link>
      </div>
    )
  }

  const handleRequestAdmin = () => {
    if (!deal.threadId) return
    const changedBy = amBuyerInDeal ? 'Покупатель' : 'Продавец'
    if (deal.status === 'new') {
      updateDealStatus(deal.id, 'under_review', changedBy, 'Запрошено подключение администратора со страницы сделки', amBuyerInDeal ? 'buyer' : 'seller')
    }
    addSystemMessage(deal.threadId, `${changedBy} запросил подключение администратора по сделке #${deal.id}.`)
    addMessage(deal.threadId, 'admin-panel', 'admin', 'Администрация получила запрос и подключится к сделке в ближайшее время.')
  }

  const handleSendToDocuments = () => {
    if (!deal.threadId) return
    const changedBy = amBuyerInDeal ? 'Покупатель' : 'Продавец'
    if (!['documents_preparation', 'completed', 'cancelled'].includes(deal.status)) {
      updateDealStatus(deal.id, 'documents_preparation', changedBy, 'Стороны подтвердили переход к подготовке документов', amBuyerInDeal ? 'buyer' : 'seller')
    }
    addSystemMessage(deal.threadId, `Сделка #${deal.id} переведена на этап подготовки документов.`)
    addMessage(deal.threadId, 'admin-panel', 'admin', 'Администрация начала этап подготовки документов. Проверьте карточку сделки и список требуемых файлов.')
  }

  return (
    <div className="space-y-6">
      <Link to="/app/deals" className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900">
        <ArrowLeft className="size-4" /> К списку сделок
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Сделка {deal.id}</h1>
        <Badge tone="neutral" className={DEAL_STATUS_TONE[deal.status]}>{DEAL_STATUS_LABELS[deal.status]}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Информация о сделке" />
          <CardContent className="grid gap-3 text-sm">
            <Row label="Товар" value={product?.name ?? '—'} />
            <Row label="Объём" value={deal.quantity} />
            <Row label="Страна назначения" value={deal.destinationCountry} />
            <Row label="Сроки" value={deal.targetTimeline} />
            <Row label="Incoterms" value={deal.incoterms || '—'} />
            {deal.totalValue && <Row label="Сумма" value={deal.totalValue} />}
            <Row label="Создана" value={new Date(deal.createdAt).toLocaleString('ru-RU')} />
            <Row label="Обновлена" value={new Date(deal.updatedAt).toLocaleString('ru-RU')} />
            {deal.buyerComment && <Row label="Комментарий" value={deal.buyerComment} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title={amBuyerInDeal ? 'Продавец' : 'Покупатель'} />
          <CardContent className="grid gap-3 text-sm">
            {amBuyerInDeal ? (
              <>
                <Row label="Компания" value={seller?.name ?? '—'} />
                <Row label="Город" value={seller ? `${seller.city}, ${seller.country}` : '—'} />
                <Row label="Ответ" value={seller?.responseTime ?? '—'} />
              </>
            ) : (
              <Row label="ID покупателя" value={deal.buyerId} />
            )}
            {deal.assignedManager && <Row label="Менеджер" value={deal.assignedManager} />}
          </CardContent>
        </Card>
      </div>

      {/* Status timeline */}
      <Card>
        <CardHeader title="История статусов" />
        <CardContent>
          <div className="space-y-3">
            {deal.statusHistory.map((h, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-slate-100">
                  <Clock className="size-3 text-slate-500" />
                </div>
                <div>
                  <span className="font-medium text-slate-900">{DEAL_STATUS_LABELS[h.from]} → {DEAL_STATUS_LABELS[h.to]}</span>
                  <span className="ml-2 text-slate-500">({new Date(h.changedAt).toLocaleDateString('ru-RU')})</span>
                  {h.comment && <p className="mt-0.5 text-slate-600">{h.comment}</p>}
                </div>
              </div>
            ))}
            {deal.statusHistory.length === 0 && <p className="text-sm text-slate-500">Нет истории.</p>}
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      {deal.documents.length > 0 && (
        <Card>
          <CardHeader title="Документы" subtitle={`${deal.documents.length} документов`} />
          <CardContent>
            <div className="divide-y divide-border rounded-xl border border-border">
              {deal.documents.map((doc) => (
                <div key={doc.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                  <FileText className="size-4 text-slate-400" />
                  <span className="font-medium text-slate-900">{doc.name}</span>
                  <Badge tone="neutral">{doc.type}</Badge>
                  <Badge tone={doc.status === 'approved' ? 'success' : doc.status === 'uploaded' ? 'info' : doc.status === 'under_review' ? 'info' : 'warning'}>
                    {DOC_STATUS_LABELS[doc.status]}
                  </Badge>
                  {doc.uploadedAt && <span className="text-xs text-slate-500">{new Date(doc.uploadedAt).toLocaleDateString('ru-RU')}</span>}
                  {doc.note && <span className="text-xs italic text-slate-500">{doc.note}</span>}
                  {doc.sourceFileName && <span className="text-xs text-slate-500">Файл: {doc.sourceFileName}</span>}
                  {doc.downloadUrl ? (
                    <a href={doc.downloadUrl} className="text-xs font-medium text-brand-blue hover:underline">
                      Скачать файл
                    </a>
                  ) : doc.fileUrl ? (
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-brand-blue hover:underline">
                      Открыть файл
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contract section */}
      <ContractSection dealId={deal.id} version={version} />

      {/* Logistics section */}
      <LogisticsSection dealId={deal.id} version={version} />

      {/* Payment stages */}
      <PaymentSection dealId={deal.id} version={version} />

      {/* Guarantees */}
      <GuaranteesSection dealId={deal.id} version={version} />

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {deal.threadId && (
          <Link to={`/app/messages/${deal.threadId}`}>
            <Button variant="secondary" size="sm" className="gap-2">
              <MessageCircle className="size-4" /> Открыть переписку
            </Button>
          </Link>
        )}
        {deal.threadId && !['completed', 'cancelled'].includes(deal.status) && (
          <Button variant="secondary" size="sm" className="gap-2" onClick={handleRequestAdmin}>
            <ShieldCheck className="size-4" /> Вызвать администратора
          </Button>
        )}
        {deal.threadId && !['documents_preparation', 'completed', 'cancelled'].includes(deal.status) && (
          <Button variant="secondary" size="sm" className="gap-2" onClick={handleSendToDocuments}>
            <FileText className="size-4" /> На подготовку документов
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-slate-600">
            Управление статусом сделки осуществляется администрацией. Если у вас есть вопросы, свяжитесь через переписку или напишите на{' '}
            <a className="font-medium text-brand-blue hover:underline" href="mailto:hello@silkroadhub.io">hello@silkroadhub.io</a>.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

/* ── Contract Section ── */

function ContractSection({ dealId, version }: { dealId: string; version: number }) {
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
              {c.deadlines.length > 0 && (
                <span className="text-xs text-slate-500">{c.deadlines.length} дедлайн(ов)</span>
              )}
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

function LogisticsSection({ dealId, version }: { dealId: string; version: number }) {
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

function PaymentSection({ dealId, version }: { dealId: string; version: number }) {
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

function GuaranteesSection({ dealId, version }: { dealId: string; version: number }) {
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="min-w-[140px] shrink-0 text-slate-500">{label}:</span>
      <span className="text-slate-900">{value}</span>
    </div>
  )
}
