import { useMemo } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { getNavigationFlash } from '@shared/api/navigationState'
import { ArrowLeft, Clock, FileText, MessageCircle, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { Badge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { ContractSection, LogisticsSection, PaymentSection, GuaranteesSection } from '@widgets/deal/DealSubSections'
import { DealPhaseTracker } from '@widgets/deal/DealPhaseTracker'
import { DealChat } from '@features/deals/DealChat'
import { DealIntentsSection } from '@features/deals/DealIntentsSection'
import { DealDocumentsRemote } from '@features/deals/DealDocumentsRemote'
import { DealContractsRemote } from '@features/contracts/DealContractsRemote'
import { DealLogisticsRemote } from '@features/logistics/DealLogisticsRemote'
import { DealPaymentsRemote } from '@features/deals/DealPaymentsRemote'
import { DealGuaranteesRemote } from '@features/deals/DealGuaranteesRemote'
import { useAuth } from '@features/auth/auth'
import { getDealById, getDealProduct, getDealSeller, updateDealStatus, DEAL_STATUS_LABELS, DEAL_STATUS_TONE, DOC_STATUS_LABELS } from '@features/deals/dealData'
import { addMessage, addSystemMessage } from '@features/messaging/messagingData'
import { getParticipantId, getSellerIdFromAuth } from '@features/messaging/messagingData'
import { usePlatformDataVersion } from '@shared/hooks/usePlatformDataVersion'

export function AppDealDetailPage() {
  const { id } = useParams()
  const location = useLocation()
  const flash = getNavigationFlash(location.state)
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

      {flash && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {flash}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Сделка {deal.id}</h1>
        <Badge tone="neutral" className={DEAL_STATUS_TONE[deal.status]}>{DEAL_STATUS_LABELS[deal.status]}</Badge>
      </div>

      <DealPhaseTracker status={deal.status} />

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
                    <a href={doc.downloadUrl} className="text-xs font-medium text-brand-blue hover:underline">Скачать файл</a>
                  ) : doc.fileUrl ? (
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-brand-blue hover:underline">Открыть файл</a>
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shared deal sub-sections */}
      <ContractSection dealId={deal.id} version={version} />
      <LogisticsSection dealId={deal.id} version={version} />
      <PaymentSection dealId={deal.id} version={version} />
      <GuaranteesSection dealId={deal.id} version={version} />

      {/* LOI/MOU договорённости как сущность сделки (ТЗ §5.3) */}
      <DealIntentsSection
        dealId={deal.id}
        canParticipate={auth.role === 'buyer' || auth.role === 'seller'}
        signAs={amBuyerInDeal ? 'buyer' : 'seller'}
      />

      {/* LOI/MOU documents and chat backed by Go API (ТЗ 5.3) */}
      <DealDocumentsRemote dealId={deal.id} />
      <DealChat dealId={deal.id} />

      {/* Contracts: templates, applicable law, signed docs, status workflow (ТЗ 5.4) */}
      <DealContractsRemote dealId={deal.id} />

      {/* Logistics: route templates, stages, documents (ТЗ 5.5) */}
      <DealLogisticsRemote dealId={deal.id} />

      {/* Finance: payment stages 30/40/30 + guarantees with KazakhExport (ТЗ 5.6) */}
      <DealPaymentsRemote dealId={deal.id} />
      <DealGuaranteesRemote dealId={deal.id} />

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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="min-w-[140px] shrink-0 text-slate-500">{label}:</span>
      <span className="text-slate-900">{value}</span>
    </div>
  )
}
