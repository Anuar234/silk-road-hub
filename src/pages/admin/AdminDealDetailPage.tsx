import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Clock3, FileText, MessageSquare, Plus, Send, ShieldCheck } from 'lucide-react'
import { Badge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { Input } from '@shared/ui/Input'
import { Textarea } from '@shared/ui/Textarea'
import {
  addDealComment,
  DEAL_STATUS_LABELS,
  DEAL_STATUS_TONE,
  DOC_STATUS_LABELS,
  DOC_STATUS_TONE,
  getDealById,
  getDealProduct,
  getDealSeller,
  requestDealDocument,
  updateDealFields,
  updateDealStatus,
  updateDocumentStatus,
  updateReadinessChecklist,
  type CommentVisibility,
  type DealStatus,
  type DocStatus,
  type DocType,
} from '@features/deals/dealData'
import { getThreadMessages, addMessage, addSystemMessage } from '@features/messaging/messagingData'
import { usePlatformDataVersion } from '@shared/hooks/usePlatformDataVersion'
import { ContractSection, LogisticsSection, PaymentSection, GuaranteesSection } from '@widgets/deal/DealSubSections'
import { DealPhaseTracker } from '@widgets/deal/DealPhaseTracker'
import { DealIntentsSection } from '@features/deals/DealIntentsSection'

/**
 * Primary admin workflow screen.
 * This page orchestrates status changes, timeline notes, document requests,
 * readiness flags, and thread-side communication, so parity here is critical.
 */
const STATUS_ORDER: DealStatus[] = [
  'new',
  'under_review',
  'waiting_buyer_info',
  'waiting_seller_info',
  'documents_preparation',
  'negotiating',
  'intent_fixed',
  'contract_signed',
  'in_execution',
  'approved',
  'completed',
  'cancelled',
]

const DOC_ACTIONS: DocStatus[] = ['requested', 'uploaded', 'under_review', 'approved', 'missing_info', 'rejected']

export function AdminDealDetailPage() {
  const { id } = useParams()
  const version = usePlatformDataVersion()
  const [statusDraft, setStatusDraft] = useState<DealStatus>('under_review')
  const [statusComment, setStatusComment] = useState('')
  const [managerInput, setManagerInput] = useState('')
  const [valueInput, setValueInput] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [participantVisibility, setParticipantVisibility] = useState<CommentVisibility>('all')
  const [participantMessage, setParticipantMessage] = useState('')
  const [docName, setDocName] = useState('')
  const [docType, setDocType] = useState<DocType>('contract')
  const [docTarget, setDocTarget] = useState<'buyer' | 'seller'>('seller')
  const [docNote, setDocNote] = useState('')
  const [chatDraft, setChatDraft] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const deal = useMemo(() => getDealById(id ?? ''), [id, version])
  const product = useMemo(() => (deal ? getDealProduct(deal) : null), [deal])
  const seller = useMemo(() => (deal ? getDealSeller(deal) : null), [deal])
  const threadMessages = deal?.threadId ? getThreadMessages(deal.threadId) : []

  useEffect(() => {
    if (!deal) return
    // Local draft fields must be refreshed from the selected case because the
    // admin screen edits a mutable in-memory record rather than immutable form data.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatusDraft(deal.status)
    setManagerInput(deal.assignedManager ?? '')
    setValueInput(deal.totalValue ?? '')
  }, [deal])

  if (!deal) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Сделка не найдена.</p>
        <Link to="/admin/deals" className="text-sm font-medium text-brand-blue hover:underline">К списку сделок</Link>
      </div>
    )
  }

  const sortedTimeline = [
    ...deal.statusHistory.map((entry) => ({
      id: `status-${entry.changedAt}`,
      createdAt: entry.changedAt,
      title: `${DEAL_STATUS_LABELS[entry.from]} → ${DEAL_STATUS_LABELS[entry.to]}`,
      body: entry.comment ?? '',
      meta: `${entry.changedByRole === 'admin' ? 'Администратор' : entry.changedByRole === 'buyer' ? 'Покупатель' : entry.changedByRole === 'seller' ? 'Продавец' : 'Система'} · ${entry.changedBy}`,
      tone: 'status' as const,
    })),
    ...deal.adminComments.map((comment) => ({
      id: comment.id,
      createdAt: comment.createdAt,
      title: comment.visibility === 'internal' ? 'Внутренняя заметка' : 'Комментарий/запрос',
      body: comment.body,
      meta: `${comment.authorRole === 'admin' ? 'Администратор' : comment.authorRole} · ${comment.author}`,
      tone: comment.visibility === 'internal' ? 'internal' as const : 'visible' as const,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const docBlockers = deal.documents.filter((doc) => ['requested', 'missing_info', 'rejected'].includes(doc.status)).length

  const handleSaveMeta = () => {
    updateDealFields(deal.id, {
      assignedManager: managerInput.trim() || null,
      totalValue: valueInput.trim() || undefined,
    })
    showToast('Метаданные сохранены')
  }

  const handleStatusUpdate = () => {
    // Status changes are mirrored into both admin timeline data and the shared
    // thread so all actors observe the same case progression.
    if (deal.status === statusDraft) return
    updateDealStatus(deal.id, statusDraft, managerInput.trim() || 'Администратор', statusComment.trim() || undefined, 'admin')
    addDealComment(deal.id, {
      type: 'status_note',
      visibility: 'internal',
      author: managerInput.trim() || 'Администратор',
      authorRole: 'admin',
      body: statusComment.trim() || `Статус изменён на «${DEAL_STATUS_LABELS[statusDraft]}».`,
    })
    if (deal.threadId) {
      addSystemMessage(deal.threadId, `Администратор перевёл сделку #${deal.id} в статус «${DEAL_STATUS_LABELS[statusDraft]}».`)
      if (statusComment.trim()) addMessage(deal.threadId, 'admin-panel', 'admin', statusComment.trim())
    }
    setStatusComment('')
    showToast(`Статус обновлён: ${DEAL_STATUS_LABELS[statusDraft]}`)
  }

  const handleAddInternalNote = () => {
    if (!internalNote.trim()) return
    addDealComment(deal.id, {
      type: 'internal_note',
      visibility: 'internal',
      author: managerInput.trim() || 'Администратор',
      authorRole: 'admin',
      body: internalNote.trim(),
    })
    updateDealFields(deal.id, { internalNotes: internalNote.trim() })
    setInternalNote('')
    showToast('Заметка добавлена')
  }

  const handleSendParticipantMessage = () => {
    if (!participantMessage.trim()) return
    const type = participantVisibility === 'buyer' ? 'buyer_request' : participantVisibility === 'seller' ? 'seller_request' : 'status_note'
    addDealComment(deal.id, {
      type,
      visibility: participantVisibility,
      author: managerInput.trim() || 'Администратор',
      authorRole: 'admin',
      body: participantMessage.trim(),
    })
    if (deal.threadId) addMessage(deal.threadId, 'admin-panel', 'admin', participantMessage.trim())
    showToast('Запрос отправлен')
    if (participantVisibility === 'buyer') {
      updateDealStatus(deal.id, 'waiting_buyer_info', managerInput.trim() || 'Администратор', 'Запрошена дополнительная информация у покупателя', 'admin')
    } else if (participantVisibility === 'seller') {
      updateDealStatus(deal.id, 'waiting_seller_info', managerInput.trim() || 'Администратор', 'Запрошена дополнительная информация у продавца', 'admin')
    }
    setParticipantMessage('')
  }

  const handleRequestDocument = () => {
    // Document requests must create workflow records, visible notes, and thread
    // notifications together; otherwise admin and participant views diverge.
    if (!docName.trim()) return
    requestDealDocument(deal.id, { name: docName.trim(), type: docType, requestedFrom: docTarget, note: docNote.trim() || undefined })
    addDealComment(deal.id, {
      type: docTarget === 'buyer' ? 'buyer_request' : 'seller_request',
      visibility: docTarget,
      author: managerInput.trim() || 'Администратор',
      authorRole: 'admin',
      body: `Запрошен документ: ${docName.trim()}${docNote.trim() ? `. ${docNote.trim()}` : ''}`,
    })
    if (deal.threadId) {
      addSystemMessage(deal.threadId, `Администрация запросила документ «${docName.trim()}» по сделке #${deal.id}.`)
      addMessage(deal.threadId, 'admin-panel', 'admin', `Пожалуйста, загрузите документ «${docName.trim()}». ${docNote.trim()}`.trim())
    }
    setDocName('')
    setDocType('contract')
    setDocNote('')
    showToast('Документ запрошен')
  }

  const handleDocumentStatus = (docId: string, status: DocStatus) => {
    updateDocumentStatus(deal.id, docId, status)
    const doc = deal.documents.find((item) => item.id === docId)
    if (deal.threadId && doc) {
      addSystemMessage(deal.threadId, `Статус документа «${doc.name}» обновлён: ${DOC_STATUS_LABELS[status]}.`)
    }
  }

  const handleReadinessChange = (field: keyof typeof deal.readiness, value: boolean) => {
    updateReadinessChecklist(deal.id, { [field]: value })
  }

  const handleSendChat = () => {
    if (!deal.threadId || !chatDraft.trim()) return
    addMessage(deal.threadId, 'admin-panel', 'admin', chatDraft.trim())
    setChatDraft('')
  }

  return (
    <div className="space-y-6">
      <Link to="/admin/deals" className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900">
        <ArrowLeft className="size-4" />
        К списку сделок
      </Link>

      {toast && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Сделка {deal.id}</h1>
        <Badge tone="neutral" className={DEAL_STATUS_TONE[deal.status]}>{DEAL_STATUS_LABELS[deal.status]}</Badge>
        {deal.assignedManager && <Badge tone="info">Менеджер: {deal.assignedManager}</Badge>}
      </div>

      <DealPhaseTracker status={deal.status} />

      <DealIntentsSection dealId={deal.id} canParticipate={false} />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1.2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Параметры сделки" subtitle="Товар, стороны и условия" />
            <CardContent className="grid gap-3 text-sm">
              <Row label="Товар" value={product?.name ?? '—'} />
              <Row label="Сектор" value={product?.category ?? '—'} />
              <Row label="Продавец" value={seller ? `${seller.name} · ${seller.city}, ${seller.country}` : deal.sellerId} />
              <Row label="Покупатель" value={deal.buyerId} />
              <Row label="Количество" value={deal.quantity} />
              <Row label="Страна назначения" value={deal.destinationCountry} />
              <Row label="Срок" value={deal.targetTimeline} />
              <Row label="Incoterms" value={deal.incoterms || '—'} />
              <Row label="Сумма" value={deal.totalValue ?? '—'} />
              <Row label="Комментарий покупателя" value={deal.buyerComment || '—'} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Данные для подготовки документов" subtitle="Агрегированная готовность кейса" />
            <CardContent className="space-y-3">
              <div className="grid gap-2">
                <ChecklistRow label="Данные покупателя готовы" checked={deal.readiness.buyerInfoComplete} onChange={(value) => handleReadinessChange('buyerInfoComplete', value)} />
                <ChecklistRow label="Данные продавца готовы" checked={deal.readiness.sellerInfoComplete} onChange={(value) => handleReadinessChange('sellerInfoComplete', value)} />
                <ChecklistRow label="Информация по товару готова" checked={deal.readiness.productInfoComplete} onChange={(value) => handleReadinessChange('productInfoComplete', value)} />
                <ChecklistRow label="Логистика согласована" checked={deal.readiness.logisticsInfoComplete} onChange={(value) => handleReadinessChange('logisticsInfoComplete', value)} />
                <ChecklistRow label="Документы загружены" checked={deal.readiness.docsUploaded} onChange={(value) => handleReadinessChange('docsUploaded', value)} />
                <ChecklistRow label="Документы одобрены" checked={deal.readiness.docsApproved} onChange={(value) => handleReadinessChange('docsApproved', value)} />
                <ChecklistRow label="Готово к подготовке документов" checked={deal.readiness.readyForPreparation} onChange={(value) => handleReadinessChange('readyForPreparation', value)} />
              </div>
              <div className="rounded-2xl border border-border bg-slate-50 p-4 text-sm text-slate-600">
                Блокеры: <span className="font-semibold text-slate-900">{docBlockers}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Документы" subtitle={`${deal.documents.length} позиций`} />
            <CardContent className="space-y-3">
              {deal.documents.map((doc) => (
                <div key={doc.id} className="rounded-2xl border border-border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{doc.name}</span>
                    <Badge tone="neutral">{doc.type}</Badge>
                    <Badge tone="neutral" className={DOC_STATUS_TONE[doc.status]}>{DOC_STATUS_LABELS[doc.status]}</Badge>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    {doc.requestedFrom ? `Запрошен у: ${doc.requestedFrom === 'buyer' ? 'покупателя' : 'продавца'}` : 'Источник не указан'}
                    {doc.sourceFileName ? ` · Файл: ${doc.sourceFileName}` : ''}
                    {doc.note ? ` · ${doc.note}` : ''}
                    {doc.reviewComment ? ` · ${doc.reviewComment}` : ''}
                  </div>
                  {doc.fileUrl && (
                    <div className="mt-2">
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-brand-blue hover:underline">
                        Открыть загруженный файл
                      </a>
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {DOC_ACTIONS.filter((status) => status !== doc.status).map((status) => (
                      <Button key={status} variant="ghost" size="sm" onClick={() => handleDocumentStatus(doc.id, status)}>
                        {DOC_STATUS_LABELS[status]}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
              {deal.documents.length === 0 && <p className="text-sm text-slate-500">Документы ещё не запрошены.</p>}
            </CardContent>
          </Card>

          {/* Contract section */}
          <ContractSection dealId={deal.id} version={version} />

          {/* Logistics section */}
          <LogisticsSection dealId={deal.id} version={version} />

          {/* Payment stages */}
          <PaymentSection dealId={deal.id} version={version} />

          {/* Guarantees */}
          <GuaranteesSection dealId={deal.id} version={version} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Связанная переписка" subtitle={deal.threadId ? `Тред ${deal.threadId}` : 'Тред не связан'} />
            <CardContent className="space-y-4">
              {deal.threadId ? (
                <>
                  <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-2xl border border-border bg-slate-50 p-4">
                    {threadMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`rounded-2xl px-4 py-3 text-sm ${
                          message.isSystemMessage
                            ? 'border border-slate-200 bg-white text-center text-slate-500'
                            : message.senderRole === 'admin'
                              ? 'ml-auto max-w-[85%] border border-amber-200 bg-amber-50 text-amber-900'
                              : message.senderRole === 'buyer'
                                ? 'mr-auto max-w-[85%] bg-brand-blue/10 text-slate-900'
                                : 'mr-auto max-w-[85%] bg-white text-slate-900'
                        }`}
                      >
                        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          {message.isSystemMessage ? 'Система' : message.senderRole === 'admin' ? 'Администратор' : message.senderRole === 'buyer' ? 'Покупатель' : 'Продавец'}
                        </div>
                        <div className="whitespace-pre-wrap">{message.body}</div>
                        <div className="mt-1 text-[11px] text-slate-400">{new Date(message.createdAt).toLocaleString('ru-RU')}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      value={chatDraft}
                      onChange={(event) => setChatDraft(event.target.value)}
                      onKeyDown={(event) => event.key === 'Enter' && !event.shiftKey && (event.preventDefault(), handleSendChat())}
                      placeholder="Сообщение участникам сделки..."
                    />
                    <Button variant="primary" size="sm" className="gap-2" onClick={handleSendChat} disabled={!chatDraft.trim()}>
                      <Send className="size-4" />
                      Отправить
                    </Button>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-border bg-slate-50 p-4 text-sm text-slate-500">
                  У сделки пока нет связанной переписки. После старта общения buyer/seller этот блок станет общим коммуникационным потоком кейса.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Активность и timeline" subtitle="Статусы и внутренние события" />
            <CardContent className="space-y-3">
              {sortedTimeline.map((item) => (
                <div key={item.id} className="flex gap-3 rounded-2xl border border-border p-4">
                  <div className={`mt-1 grid size-8 shrink-0 place-items-center rounded-full ${item.tone === 'status' ? 'bg-blue-50 text-blue-700' : item.tone === 'internal' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-700'}`}>
                    {item.tone === 'status' ? <Clock3 className="size-4" /> : item.tone === 'internal' ? <ShieldCheck className="size-4" /> : <MessageSquare className="size-4" />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                    <div className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{item.body || 'Без комментария'}</div>
                    <div className="mt-1 text-xs text-slate-400">{item.meta} · {new Date(item.createdAt).toLocaleString('ru-RU')}</div>
                  </div>
                </div>
              ))}
              {sortedTimeline.length === 0 && <p className="text-sm text-slate-500">История ещё не сформирована.</p>}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Управление кейсом" subtitle="Статус, менеджер и стоимость" />
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Менеджер</label>
                <Input value={managerInput} onChange={(event) => setManagerInput(event.target.value)} placeholder={deal.assignedManager ?? 'Например: Айдос К.'} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Сумма сделки</label>
                <Input value={valueInput} onChange={(event) => setValueInput(event.target.value)} placeholder={deal.totalValue ?? '$0'} />
              </div>
              <Button variant="secondary" size="sm" onClick={handleSaveMeta}>Сохранить метаданные</Button>
              <div className="border-t border-border pt-4">
                <label className="mb-1 block text-xs font-medium text-slate-700">Новый статус</label>
                <select
                  value={statusDraft}
                  onChange={(event) => setStatusDraft(event.target.value as DealStatus)}
                  className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm"
                >
                  {STATUS_ORDER.map((status) => (
                    <option key={status} value={status}>{DEAL_STATUS_LABELS[status]}</option>
                  ))}
                </select>
                <div className="mt-3">
                  <Textarea value={statusComment} onChange={(event) => setStatusComment(event.target.value)} rows={3} placeholder="Комментарий к смене статуса" />
                </div>
                <div className="mt-3">
                  <Button variant="primary" size="sm" onClick={handleStatusUpdate} disabled={statusDraft === deal.status}>
                    Обновить статус
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Внутренние заметки" subtitle="Не видны buyer/seller" />
            <CardContent className="space-y-3">
              <Textarea value={internalNote} onChange={(event) => setInternalNote(event.target.value)} rows={4} placeholder="Внутренний комментарий для команды администрации..." />
              <Button variant="secondary" size="sm" onClick={handleAddInternalNote} className="gap-2" disabled={!internalNote.trim()}>
                <Plus className="size-4" />
                Добавить заметку
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Запрос сторонам" subtitle="Видимый запрос в group chat и timeline" />
            <CardContent className="space-y-3">
              <select
                value={participantVisibility}
                onChange={(event) => setParticipantVisibility(event.target.value as CommentVisibility)}
                className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm"
              >
                <option value="all">Обеим сторонам</option>
                <option value="buyer">Только покупателю</option>
                <option value="seller">Только продавцу</option>
              </select>
              <Textarea value={participantMessage} onChange={(event) => setParticipantMessage(event.target.value)} rows={4} placeholder="Например: пришлите недостающие данные по логистике и сертификатам." />
              <Button variant="primary" size="sm" onClick={handleSendParticipantMessage} disabled={!participantMessage.trim()}>
                Отправить запрос
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Запросить документ" subtitle="Создаёт first-class запись в workflow" />
            <CardContent className="space-y-3">
              <Input value={docName} onChange={(event) => setDocName(event.target.value)} placeholder="Название документа" />
              <select value={docType} onChange={(event) => setDocType(event.target.value as DocType)} className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm">
                <option value="contract">Контракт</option>
                <option value="invoice">Инвойс</option>
                <option value="certificate">Сертификат</option>
                <option value="shipping">Логистика</option>
                <option value="other">Другое</option>
              </select>
              <select value={docTarget} onChange={(event) => setDocTarget(event.target.value as 'buyer' | 'seller')} className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm">
                <option value="seller">Запросить у продавца</option>
                <option value="buyer">Запросить у покупателя</option>
              </select>
              <Textarea value={docNote} onChange={(event) => setDocNote(event.target.value)} rows={3} placeholder="Что именно нужно предоставить" />
              <Button variant="secondary" size="sm" className="gap-2" onClick={handleRequestDocument} disabled={!docName.trim()}>
                <FileText className="size-4" />
                Создать запрос
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="min-w-[150px] shrink-0 text-slate-500">{label}:</span>
      <span className="text-slate-900">{value}</span>
    </div>
  )
}

function ChecklistRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3 text-sm">
      <span className="text-slate-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${checked ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
      >
        <CheckCircle2 className="size-3.5" />
        {checked ? 'Готово' : 'Не готово'}
      </button>
    </label>
  )
}
