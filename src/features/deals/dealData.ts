import { products, sellers } from '@mocks/mockData'
import { notifyPlatformDataChange } from '@features/platform/storeEvents'

/**
 * In-memory deal workflow store.
 * Today this file behaves like a local domain service plus pseudo-database,
 * so migration code must treat its exported functions as behavior contracts.
 */
export type DealStatus =
  | 'new'
  | 'under_review'
  | 'waiting_buyer_info'
  | 'waiting_seller_info'
  | 'documents_preparation'
  | 'negotiating'
  | 'approved'
  | 'completed'
  | 'cancelled'

export type DocType = 'invoice' | 'contract' | 'certificate' | 'shipping' | 'other'
export type DocStatus = 'not_requested' | 'requested' | 'uploaded' | 'under_review' | 'approved' | 'rejected' | 'missing_info'
export type CommentType = 'internal_note' | 'buyer_request' | 'seller_request' | 'document_note' | 'status_note'
export type CommentVisibility = 'internal' | 'buyer' | 'seller' | 'all'
export type ActorRole = 'system' | 'buyer' | 'seller' | 'admin'

export type DealComment = {
  id: string
  type: CommentType
  visibility: CommentVisibility
  author: string
  authorRole: ActorRole
  body: string
  createdAt: string
}

export type DealDocument = {
  id: string
  name: string
  type: DocType
  status: DocStatus
  requestedFrom?: 'buyer' | 'seller'
  requestedAt?: string
  uploadedAt?: string
  reviewedAt?: string
  uploadedByRole?: ActorRole
  note?: string
  reviewComment?: string
  sourceFileName?: string
  sourceFileSize?: number
  fileId?: string
  downloadUrl?: string
  fileUrl?: string
}

export type StatusChange = {
  from: DealStatus
  to: DealStatus
  changedBy: string
  changedByRole: ActorRole
  changedAt: string
  comment?: string
}

export type DealReadinessChecklist = {
  buyerInfoComplete: boolean
  sellerInfoComplete: boolean
  productInfoComplete: boolean
  logisticsInfoComplete: boolean
  docsUploaded: boolean
  docsApproved: boolean
  readyForPreparation: boolean
}

export type DealCase = {
  id: string
  buyerId: string
  sellerId: string
  productId: string
  threadId: string | null
  quantity: string
  destinationCountry: string
  targetTimeline: string
  incoterms: string
  buyerComment: string
  status: DealStatus
  assignedManager: string | null
  createdAt: string
  updatedAt: string
  internalNotes: string
  documents: DealDocument[]
  statusHistory: StatusChange[]
  adminComments: DealComment[]
  readiness: DealReadinessChecklist
  totalValue?: string
}

export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
  new: 'Новая',
  under_review: 'На проверке',
  waiting_buyer_info: 'Ждём информацию от покупателя',
  waiting_seller_info: 'Ждём информацию от продавца',
  documents_preparation: 'Подготовка документов',
  negotiating: 'Переговоры',
  approved: 'Одобрено',
  completed: 'Завершено',
  cancelled: 'Отменено',
}

export const DEAL_STATUS_TONE: Record<DealStatus, string> = {
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  under_review: 'bg-amber-50 text-amber-700 border-amber-200',
  waiting_buyer_info: 'bg-orange-50 text-orange-700 border-orange-200',
  waiting_seller_info: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  documents_preparation: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  negotiating: 'bg-purple-50 text-purple-700 border-purple-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
}

export const DOC_STATUS_LABELS: Record<DocStatus, string> = {
  not_requested: 'Не запрошено',
  requested: 'Запрошено',
  uploaded: 'Загружено',
  under_review: 'На проверке',
  approved: 'Одобрено',
  rejected: 'Отклонено',
  missing_info: 'Требуется дополнение',
}

export const DOC_STATUS_TONE: Record<DocStatus, string> = {
  not_requested: 'bg-slate-100 text-slate-500 border-slate-200',
  requested: 'bg-amber-50 text-amber-700 border-amber-200',
  uploaded: 'bg-blue-50 text-blue-700 border-blue-200',
  under_review: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  missing_info: 'bg-orange-50 text-orange-700 border-orange-200',
}

export const COMMENT_TYPE_LABELS: Record<CommentType, string> = {
  internal_note: 'Внутренняя заметка',
  buyer_request: 'Запрос покупателю',
  seller_request: 'Запрос продавцу',
  document_note: 'Заметка по документам',
  status_note: 'Заметка по статусу',
}

function createDefaultReadiness(overrides: Partial<DealReadinessChecklist> = {}): DealReadinessChecklist {
  return {
    buyerInfoComplete: false,
    sellerInfoComplete: false,
    productInfoComplete: false,
    logisticsInfoComplete: false,
    docsUploaded: false,
    docsApproved: false,
    readyForPreparation: false,
    ...overrides,
  }
}

function syncDealReadinessFromDocuments(deal: DealCase) {
  const uploadedStatuses: DocStatus[] = ['uploaded', 'under_review', 'approved']
  deal.readiness.docsUploaded = deal.documents.some((doc) => uploadedStatuses.includes(doc.status))
  deal.readiness.docsApproved = deal.documents.length > 0 && deal.documents.every((doc) => doc.status === 'approved')
}

function createComment(
  id: string,
  type: CommentType,
  visibility: CommentVisibility,
  author: string,
  authorRole: ActorRole,
  body: string,
  createdAt: string,
): DealComment {
  return { id, type, visibility, author, authorRole, body, createdAt }
}

export const deals: DealCase[] = [
  {
    id: 'deal-1',
    buyerId: 'buyer-test',
    sellerId: 'kazagro-foods',
    productId: 'p-honey-500g',
    threadId: 'thread-1',
    quantity: '15 000 единиц',
    destinationCountry: 'Германия',
    targetTimeline: 'До конца Q2 2025',
    incoterms: 'FOB Алматы',
    buyerComment: 'Нужна партия под private label, розничная упаковка.',
    status: 'negotiating',
    assignedManager: 'Айдос К.',
    createdAt: '2025-03-04T11:00:00Z',
    updatedAt: '2025-03-10T09:00:00Z',
    internalNotes: 'Покупатель серьёзный, проверка пройдена. Ведём переговоры по цене.',
    documents: [
      {
        id: 'doc-1-1',
        name: 'Коммерческое предложение',
        type: 'invoice',
        status: 'approved',
        requestedFrom: 'seller',
        requestedAt: '2025-03-05T10:00:00Z',
        uploadedAt: '2025-03-06T14:00:00Z',
        reviewedAt: '2025-03-06T16:00:00Z',
        uploadedByRole: 'seller',
        note: 'Подтверждено для переговоров',
      },
      {
        id: 'doc-1-2',
        name: 'Сертификат ISO 22000',
        type: 'certificate',
        status: 'under_review',
        requestedFrom: 'seller',
        requestedAt: '2025-03-05T10:30:00Z',
        uploadedAt: '2025-03-07T10:00:00Z',
        uploadedByRole: 'seller',
      },
      {
        id: 'doc-1-3',
        name: 'Договор поставки',
        type: 'contract',
        status: 'requested',
        requestedFrom: 'buyer',
        requestedAt: '2025-03-08T09:00:00Z',
        note: 'Нужна финальная версия с объёмом и Incoterms',
      },
    ],
    statusHistory: [
      { from: 'new', to: 'under_review', changedBy: 'system', changedByRole: 'system', changedAt: '2025-03-04T11:00:00Z' },
      { from: 'under_review', to: 'negotiating', changedBy: 'Айдос К.', changedByRole: 'admin', changedAt: '2025-03-08T10:00:00Z', comment: 'Стороны согласны, обсуждаем условия' },
    ],
    adminComments: [
      createComment('comment-1', 'internal_note', 'internal', 'Айдос К.', 'admin', 'Покупатель выглядит надёжным, можно ускорять контракт.', '2025-03-08T10:30:00Z'),
      createComment('comment-2', 'seller_request', 'seller', 'Айдос К.', 'admin', 'Пожалуйста, пришлите финальный сертификат и упаковочные данные.', '2025-03-09T11:00:00Z'),
    ],
    readiness: createDefaultReadiness({
      buyerInfoComplete: true,
      sellerInfoComplete: true,
      productInfoComplete: true,
      logisticsInfoComplete: false,
      docsUploaded: true,
      docsApproved: false,
      readyForPreparation: false,
    }),
    totalValue: '$22 500',
  },
  {
    id: 'deal-2',
    buyerId: 'buyer-test',
    sellerId: 'sunflower-oil-kz',
    productId: 'p-sunflower-oil',
    threadId: 'thread-2',
    quantity: '2 контейнера (40 тонн)',
    destinationCountry: 'Турция',
    targetTimeline: 'Апрель 2025',
    incoterms: 'FOB Алматы',
    buyerComment: 'Масло рафинированное, нужна фитосанитарная документация.',
    status: 'under_review',
    assignedManager: null,
    createdAt: '2025-03-10T08:00:00Z',
    updatedAt: '2025-03-10T08:00:00Z',
    internalNotes: '',
    documents: [
      {
        id: 'doc-2-1',
        name: 'Фитосанитарный сертификат',
        type: 'certificate',
        status: 'requested',
        requestedFrom: 'seller',
        requestedAt: '2025-03-10T08:10:00Z',
        note: 'Нужен перед переходом к подготовке документов',
      },
    ],
    statusHistory: [],
    adminComments: [],
    readiness: createDefaultReadiness({
      buyerInfoComplete: true,
      sellerInfoComplete: false,
      productInfoComplete: true,
      logisticsInfoComplete: false,
    }),
    totalValue: '$36 000',
  },
  {
    id: 'deal-3',
    buyerId: 'buyer-test',
    sellerId: 'golden-grain-uz',
    productId: 'p-wheat-flour-1kg',
    threadId: null,
    quantity: '500 тонн',
    destinationCountry: 'Афганистан',
    targetTimeline: 'Q3 2025',
    incoterms: 'CIF Кабул',
    buyerComment: 'Гуманитарная поставка, нужна сертификация Халяль.',
    status: 'documents_preparation',
    assignedManager: 'Марат Т.',
    createdAt: '2025-02-15T07:00:00Z',
    updatedAt: '2025-03-12T16:00:00Z',
    internalNotes: 'Большой заказ, приоритетный. Документы на финальной стадии.',
    documents: [
      {
        id: 'doc-3-1',
        name: 'Контракт',
        type: 'contract',
        status: 'approved',
        requestedFrom: 'buyer',
        requestedAt: '2025-02-18T10:00:00Z',
        uploadedAt: '2025-02-20T10:00:00Z',
        reviewedAt: '2025-02-20T18:00:00Z',
        uploadedByRole: 'buyer',
      },
      {
        id: 'doc-3-2',
        name: 'Инвойс',
        type: 'invoice',
        status: 'approved',
        requestedFrom: 'seller',
        requestedAt: '2025-02-19T09:00:00Z',
        uploadedAt: '2025-02-22T11:00:00Z',
        reviewedAt: '2025-02-22T15:00:00Z',
        uploadedByRole: 'seller',
      },
      {
        id: 'doc-3-3',
        name: 'Сертификат Халяль',
        type: 'certificate',
        status: 'under_review',
        requestedFrom: 'seller',
        requestedAt: '2025-02-24T09:00:00Z',
        uploadedAt: '2025-03-01T09:00:00Z',
        uploadedByRole: 'seller',
      },
      {
        id: 'doc-3-4',
        name: 'Коносамент',
        type: 'shipping',
        status: 'missing_info',
        requestedFrom: 'seller',
        requestedAt: '2025-03-05T09:30:00Z',
        note: 'Ожидаем уточнение от перевозчика',
        reviewComment: 'Нужен обновлённый номер рейса',
      },
    ],
    statusHistory: [
      { from: 'new', to: 'under_review', changedBy: 'system', changedByRole: 'system', changedAt: '2025-02-15T07:00:00Z' },
      { from: 'under_review', to: 'documents_preparation', changedBy: 'Марат Т.', changedByRole: 'admin', changedAt: '2025-03-05T09:00:00Z', comment: 'Переход к оформлению документов' },
    ],
    adminComments: [
      createComment('comment-3', 'document_note', 'internal', 'Марат Т.', 'admin', 'Ожидаем логистическое подтверждение по перевозчику.', '2025-03-06T11:00:00Z'),
    ],
    readiness: createDefaultReadiness({
      buyerInfoComplete: true,
      sellerInfoComplete: true,
      productInfoComplete: true,
      logisticsInfoComplete: true,
      docsUploaded: true,
      docsApproved: false,
      readyForPreparation: true,
    }),
    totalValue: '$175 000',
  },
  {
    id: 'deal-4',
    buyerId: 'buyer-test',
    sellerId: 'techpark-astana',
    productId: 'p-solar-panel-poly',
    threadId: null,
    quantity: '200 панелей',
    destinationCountry: 'Кыргызстан',
    targetTimeline: 'Май 2025',
    incoterms: 'DAP Бишкек',
    buyerComment: 'Для солнечной электростанции, нужен сертификат качества.',
    status: 'completed',
    assignedManager: 'Айдос К.',
    createdAt: '2025-01-10T06:00:00Z',
    updatedAt: '2025-02-28T18:00:00Z',
    internalNotes: 'Сделка завершена успешно. Повторный заказ возможен в Q3.',
    documents: [
      {
        id: 'doc-4-1',
        name: 'Контракт',
        type: 'contract',
        status: 'approved',
        requestedFrom: 'buyer',
        requestedAt: '2025-01-12T10:00:00Z',
        uploadedAt: '2025-01-15T10:00:00Z',
        reviewedAt: '2025-01-15T16:00:00Z',
        uploadedByRole: 'buyer',
      },
      {
        id: 'doc-4-2',
        name: 'Инвойс',
        type: 'invoice',
        status: 'approved',
        requestedFrom: 'seller',
        requestedAt: '2025-01-15T11:00:00Z',
        uploadedAt: '2025-01-20T11:00:00Z',
        reviewedAt: '2025-01-20T15:00:00Z',
        uploadedByRole: 'seller',
      },
      {
        id: 'doc-4-3',
        name: 'Сертификат качества',
        type: 'certificate',
        status: 'approved',
        requestedFrom: 'seller',
        requestedAt: '2025-01-18T11:00:00Z',
        uploadedAt: '2025-02-01T09:00:00Z',
        reviewedAt: '2025-02-02T10:00:00Z',
        uploadedByRole: 'seller',
      },
      {
        id: 'doc-4-4',
        name: 'Транспортная накладная',
        type: 'shipping',
        status: 'approved',
        requestedFrom: 'seller',
        requestedAt: '2025-02-10T09:00:00Z',
        uploadedAt: '2025-02-15T14:00:00Z',
        reviewedAt: '2025-02-16T09:00:00Z',
        uploadedByRole: 'seller',
      },
    ],
    statusHistory: [
      { from: 'new', to: 'under_review', changedBy: 'system', changedByRole: 'system', changedAt: '2025-01-10T06:00:00Z' },
      { from: 'under_review', to: 'documents_preparation', changedBy: 'Айдос К.', changedByRole: 'admin', changedAt: '2025-02-01T08:00:00Z' },
      { from: 'documents_preparation', to: 'approved', changedBy: 'Айдос К.', changedByRole: 'admin', changedAt: '2025-02-20T18:00:00Z', comment: 'Документы полностью готовы и подтверждены' },
      { from: 'approved', to: 'completed', changedBy: 'Айдос К.', changedByRole: 'admin', changedAt: '2025-02-28T18:00:00Z', comment: 'Поставка выполнена' },
    ],
    adminComments: [
      createComment('comment-4', 'status_note', 'internal', 'Айдос К.', 'admin', 'Кейс закрыт без замечаний.', '2025-02-28T18:10:00Z'),
    ],
    readiness: createDefaultReadiness({
      buyerInfoComplete: true,
      sellerInfoComplete: true,
      productInfoComplete: true,
      logisticsInfoComplete: true,
      docsUploaded: true,
      docsApproved: true,
      readyForPreparation: true,
    }),
    totalValue: '$48 000',
  },
]

export function getDealById(id: string): DealCase | undefined {
  return deals.find((deal) => deal.id === id)
}

export function getAllDeals(): DealCase[] {
  return [...deals].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export function getDealsByBuyer(buyerId: string): DealCase[] {
  return deals.filter((deal) => deal.buyerId === buyerId).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export function getDealsBySeller(sellerId: string): DealCase[] {
  return deals.filter((deal) => deal.sellerId === sellerId).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export function getDealsByParticipant(participantId: string): DealCase[] {
  return deals
    .filter((deal) => deal.buyerId === participantId || deal.sellerId === participantId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export function createDeal(
  buyerId: string,
  sellerId: string,
  productId: string,
  threadId: string | null,
  data: { quantity: string; destinationCountry: string; targetTimeline: string; incoterms: string; buyerComment: string },
): DealCase {
  // Timestamp-derived ids are part of the current demo behavior and are relied
  // on by linked thread/system-message flows immediately after creation.
  const now = new Date().toISOString()
  const deal: DealCase = {
    id: `deal-${Date.now()}`,
    buyerId,
    sellerId,
    productId,
    threadId,
    quantity: data.quantity,
    destinationCountry: data.destinationCountry,
    targetTimeline: data.targetTimeline,
    incoterms: data.incoterms,
    buyerComment: data.buyerComment,
    status: 'new',
    assignedManager: null,
    createdAt: now,
    updatedAt: now,
    internalNotes: '',
    documents: [],
    statusHistory: [],
    adminComments: [],
    readiness: createDefaultReadiness({
      buyerInfoComplete: true,
      productInfoComplete: true,
    }),
    totalValue: undefined,
  }
  deals.push(deal)
  notifyPlatformDataChange()
  return deal
}

export function updateDealStatus(
  id: string,
  newStatus: DealStatus,
  changedBy: string,
  comment?: string,
  changedByRole: ActorRole = 'admin',
): DealCase | null {
  // Status history is append-only and feeds both admin timeline and user-facing
  // case state, so updates must stay consistent with the current transition log.
  const deal = deals.find((item) => item.id === id)
  if (!deal) return null
  if (deal.status === newStatus) return deal
  const change: StatusChange = {
    from: deal.status,
    to: newStatus,
    changedBy,
    changedByRole,
    changedAt: new Date().toISOString(),
    comment,
  }
  deal.statusHistory.push(change)
  deal.status = newStatus
  deal.updatedAt = change.changedAt
  notifyPlatformDataChange()
  return deal
}

export function updateDealFields(
  id: string,
  updates: Partial<Pick<DealCase, 'assignedManager' | 'internalNotes' | 'totalValue'>>,
): DealCase | null {
  const deal = deals.find((item) => item.id === id)
  if (!deal) return null
  if (updates.assignedManager !== undefined) deal.assignedManager = updates.assignedManager
  if (updates.internalNotes !== undefined) deal.internalNotes = updates.internalNotes
  if (updates.totalValue !== undefined) deal.totalValue = updates.totalValue
  deal.updatedAt = new Date().toISOString()
  notifyPlatformDataChange()
  return deal
}

export function updateReadinessChecklist(
  dealId: string,
  updates: Partial<DealReadinessChecklist>,
): DealReadinessChecklist | null {
  const deal = deals.find((item) => item.id === dealId)
  if (!deal) return null
  deal.readiness = { ...deal.readiness, ...updates }
  deal.updatedAt = new Date().toISOString()
  notifyPlatformDataChange()
  return deal.readiness
}

export function addDealComment(
  dealId: string,
  comment: Omit<DealComment, 'id' | 'createdAt'>,
): DealComment | null {
  const deal = deals.find((item) => item.id === dealId)
  if (!deal) return null
  const newComment: DealComment = {
    ...comment,
    id: `comment-${Date.now()}`,
    createdAt: new Date().toISOString(),
  }
  deal.adminComments.push(newComment)
  if (comment.type === 'internal_note' && comment.visibility === 'internal') {
    deal.internalNotes = newComment.body
  }
  deal.updatedAt = newComment.createdAt
  notifyPlatformDataChange()
  return newComment
}

export function addDealDocument(
  dealId: string,
  doc: Omit<DealDocument, 'id'>,
): DealDocument | null {
  const deal = deals.find((item) => item.id === dealId)
  if (!deal) return null
  const newDoc: DealDocument = { ...doc, id: `doc-${Date.now()}` }
  deal.documents.push(newDoc)
  syncDealReadinessFromDocuments(deal)
  deal.updatedAt = new Date().toISOString()
  notifyPlatformDataChange()
  return newDoc
}

export function requestDealDocument(
  dealId: string,
  data: { name: string; type: DocType; requestedFrom: 'buyer' | 'seller'; note?: string },
): DealDocument | null {
  return addDealDocument(dealId, {
    name: data.name,
    type: data.type,
    status: 'requested',
    requestedFrom: data.requestedFrom,
    requestedAt: new Date().toISOString(),
    note: data.note,
  })
}

export function updateDocumentStatus(
  dealId: string,
  docId: string,
  status: DocStatus,
  reviewComment?: string,
): DealDocument | null {
  const deal = deals.find((item) => item.id === dealId)
  if (!deal) return null
  const doc = deal.documents.find((item) => item.id === docId)
  if (!doc) return null
  doc.status = status
  if (status === 'uploaded') doc.uploadedAt = new Date().toISOString()
  if (['under_review', 'approved', 'rejected', 'missing_info'].includes(status)) {
    doc.reviewedAt = new Date().toISOString()
  }
  if (reviewComment !== undefined) {
    doc.reviewComment = reviewComment
  }
  syncDealReadinessFromDocuments(deal)
  deal.updatedAt = new Date().toISOString()
  notifyPlatformDataChange()
  return doc
}

export function getDealProduct(deal: DealCase) {
  return products.find((product) => product.id === deal.productId) ?? null
}

export function getDealSeller(deal: DealCase) {
  return sellers.find((seller) => seller.id === deal.sellerId) ?? null
}

export function isDealWaitingForBuyer(deal: DealCase): boolean {
  return deal.status === 'waiting_buyer_info'
}

export function isDealWaitingForSeller(deal: DealCase): boolean {
  return deal.status === 'waiting_seller_info'
}

/* ── Этапы расчётов (Payment Stages) ── */

export type PaymentStageStatus = 'pending' | 'invoiced' | 'paid' | 'confirmed'

export type PaymentStage = {
  id: string
  label: string
  percentage: number
  amountUsd: number | null
  status: PaymentStageStatus
  dueDate: string | null
  paidAt: string | null
}

export type DealPaymentPlan = {
  dealId: string
  stages: PaymentStage[]
  totalUsd: number
}

const paymentPlans = new Map<string, DealPaymentPlan>()

export function getPaymentPlan(dealId: string): DealPaymentPlan | null {
  return paymentPlans.get(dealId) ?? null
}

export function createPaymentPlan(dealId: string, totalUsd: number, stageDefinitions: { label: string; percentage: number }[]): DealPaymentPlan {
  const stages: PaymentStage[] = stageDefinitions.map((def, i) => ({
    id: `pay-${dealId}-${i}`,
    label: def.label,
    percentage: def.percentage,
    amountUsd: Math.round(totalUsd * def.percentage / 100),
    status: 'pending',
    dueDate: null,
    paidAt: null,
  }))
  const plan: DealPaymentPlan = { dealId, stages, totalUsd }
  paymentPlans.set(dealId, plan)
  notifyPlatformDataChange()
  return plan
}

export function updatePaymentStage(dealId: string, stageId: string, updates: Partial<Pick<PaymentStage, 'status' | 'dueDate' | 'paidAt'>>): DealPaymentPlan | null {
  const plan = paymentPlans.get(dealId)
  if (!plan) return null
  const stage = plan.stages.find((s) => s.id === stageId)
  if (!stage) return null

  if (updates.status !== undefined) stage.status = updates.status
  if (updates.dueDate !== undefined) stage.dueDate = updates.dueDate
  if (updates.paidAt !== undefined) stage.paidAt = updates.paidAt
  notifyPlatformDataChange()
  return plan
}

export const DEFAULT_PAYMENT_STAGES = [
  { label: 'Аванс (предоплата)', percentage: 30 },
  { label: 'По факту отгрузки', percentage: 50 },
  { label: 'Финальный платёж', percentage: 20 },
]

/* ── Страхование и гарантии (KazakhExport) ── */

export type GuaranteeType = 'export_credit' | 'insurance' | 'letter_of_credit' | 'bank_guarantee'

export type DealGuarantee = {
  id: string
  dealId: string
  type: GuaranteeType
  provider: string
  enabled: boolean
  notes: string
}

export const GUARANTEE_TYPES: { id: GuaranteeType; name: string; provider: string }[] = [
  { id: 'export_credit', name: 'Экспортное кредитование', provider: 'KazakhExport' },
  { id: 'insurance', name: 'Страхование экспортных рисков', provider: 'KazakhExport' },
  { id: 'letter_of_credit', name: 'Аккредитив', provider: 'Банк-партнёр' },
  { id: 'bank_guarantee', name: 'Банковская гарантия', provider: 'Банк-партнёр' },
]

const dealGuarantees = new Map<string, DealGuarantee[]>()

export function getDealGuarantees(dealId: string): DealGuarantee[] {
  return dealGuarantees.get(dealId) ?? []
}

export function setDealGuarantee(dealId: string, type: GuaranteeType, enabled: boolean, notes?: string): DealGuarantee[] {
  const list = dealGuarantees.get(dealId) ?? []
  const existing = list.find((g) => g.type === type)
  const meta = GUARANTEE_TYPES.find((g) => g.id === type)

  if (existing) {
    existing.enabled = enabled
    if (notes !== undefined) existing.notes = notes
  } else {
    list.push({
      id: `guar-${dealId}-${type}`,
      dealId,
      type,
      provider: meta?.provider ?? '',
      enabled,
      notes: notes ?? '',
    })
  }

  dealGuarantees.set(dealId, list)
  notifyPlatformDataChange()
  return list
}
