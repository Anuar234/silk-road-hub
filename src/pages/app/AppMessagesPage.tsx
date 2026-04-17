import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { buildFlashState } from '@shared/api/navigationState'
import { FileText, Send, ShieldCheck, ShoppingBag } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { uploadDealFile } from '@shared/api/fileApi'
import { Button } from '@shared/ui/Button'
import { Badge } from '@shared/ui/Badge'
import { Input } from '@shared/ui/Input'
import { Textarea } from '@shared/ui/Textarea'
import { useAuth } from '@features/auth/auth'
import { cx } from '@shared/lib/cx'
import {
  findOrCreateThread,
  getThreadMessages,
  getThreadProduct,
  addMessage,
  addSystemMessage,
  getParticipantId,
  getSellerIdFromAuth,
} from '@features/messaging/messagingData'
import { sellers } from '@mocks/mockData'
import { DealModal } from '@widgets/deal/DealModal'
import { addDealDocument, getDealById, updateDealFields, updateDealStatus, DEAL_STATUS_LABELS, DEAL_STATUS_TONE } from '@features/deals/dealData'
import type { DocType } from '@features/deals/dealData'
import { getThreadsForAuth } from '@features/platform/platformSelectors'
import { usePlatformDataVersion } from '@shared/hooks/usePlatformDataVersion'

/**
 * Central communication surface for buyer, seller, and admin-linked deal flows.
 * This page is one of the highest-risk migration points because it joins
 * routing, auth gates, messages, deals, and document uploads in one screen.
 */
export function AppMessagesPage() {
  const { threadId } = useParams()
  const [searchParams] = useSearchParams()
  const sellerIdFromQuery = searchParams.get('seller')
  const productIdFromQuery = searchParams.get('product')
  const auth = useAuth()
  const navigate = useNavigate()
  const version = usePlatformDataVersion()

  const myId = useMemo(() => getParticipantId(auth), [auth])
  const mySellerId = useMemo(() => getSellerIdFromAuth(auth), [auth])
  const isBuyerRole = auth.role === 'buyer'
  const canMessage = isBuyerRole ? auth.emailVerified : true

  const [inputText, setInputText] = useState('')
  const [resendSent, setResendSent] = useState(false)
  const [showDealModal, setShowDealModal] = useState(false)
  const [adminComment, setAdminComment] = useState('')
  const [docName, setDocName] = useState('')
  const [docType, setDocType] = useState<DocType>('contract')
  const [docNote, setDocNote] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [isUploadingDoc, setIsUploadingDoc] = useState(false)
  const [docError, setDocError] = useState<string | null>(null)
  const modalShellRef = useRef<HTMLDivElement | null>(null)
  const modalTriggerRef = useRef<HTMLElement | null>(null)

  const availableThreads = useMemo(() => getThreadsForAuth(auth), [auth, version])
  const queryThread = useMemo(() => {
    // Opening `/app/messages?seller=...&product=...` is the compatibility path
    // used by catalog/detail pages to bootstrap a conversation without breaking
    // existing links or CTA behavior.
    if (threadId || !sellerIdFromQuery) return null
    return findOrCreateThread(myId, sellerIdFromQuery, productIdFromQuery)
  }, [threadId, sellerIdFromQuery, productIdFromQuery, myId])

  useEffect(() => {
    if (!threadId && queryThread) {
      navigate(`/app/messages/${queryThread.id}`, { replace: true })
    }
  }, [threadId, queryThread, navigate])

  useEffect(() => {
    if (!showDealModal) return
    modalTriggerRef.current = document.activeElement as HTMLElement | null
    const focusables = modalShellRef.current?.querySelectorAll<HTMLElement>(
      'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',
    )
    const first = focusables?.[0]
    first?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setShowDealModal(false)
        return
      }
      if (event.key !== 'Tab' || !focusables || focusables.length === 0) return
      const focused = document.activeElement as HTMLElement | null
      const firstFocusable = focusables[0]
      const lastFocusable = focusables[focusables.length - 1]
      if (!event.shiftKey && focused === lastFocusable) {
        event.preventDefault()
        firstFocusable.focus()
      } else if (event.shiftKey && focused === firstFocusable) {
        event.preventDefault()
        lastFocusable.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      modalTriggerRef.current?.focus()
    }
  }, [showDealModal])

  const currentThread = threadId ? availableThreads.find((t) => t.id === threadId) ?? null : queryThread

  void version
  const messageList = currentThread ? getThreadMessages(currentThread.id) : []
  const threadProduct = currentThread ? getThreadProduct(currentThread) : null
  const seller = currentThread ? sellers.find((s) => s.id === currentThread.sellerId) : null
  const relatedDeal = currentThread?.relatedDealId ? (getDealById(currentThread.relatedDealId) ?? null) : null

  const amBuyerInThread = currentThread ? currentThread.buyerId === myId || currentThread.buyerId === mySellerId : false
  const amSellerInThread = currentThread ? currentThread.sellerId === myId || currentThread.sellerId === mySellerId : false
  const adminJoined = useMemo(() => {
    if (!relatedDeal) return false
    return messageList.some((m) => m.senderRole === 'admin') || Boolean(relatedDeal.assignedManager)
  }, [messageList, relatedDeal])

  const getCurrentSender = () => {
    if (!currentThread) return null
    if (amBuyerInThread) {
      return { id: currentThread.buyerId, role: 'buyer' as const, label: 'Покупатель' }
    }
    return { id: currentThread.sellerId, role: 'seller' as const, label: 'Продавец' }
  }

  const handleSend = () => {
    if (!currentThread || !inputText.trim() || !canMessage) return
    const sender = getCurrentSender()
    if (!sender) return
    addMessage(currentThread.id, sender.id, sender.role, inputText.trim())
    setInputText('')
  }

  const handleResendEmail = () => {
    setResendSent(true)
    setTimeout(() => setResendSent(false), 3000)
  }

  const handleConfirmEmail = () => {
    auth.setEmailVerified(true)
  }

  const handleDealSuccess = (dealId: string) => {
    setShowDealModal(false)
    navigate(`/app/deals/${dealId}`, { state: buildFlashState('Сделка создана успешно.') })
  }

  const handleRequestAdmin = () => {
    // Admin escalation updates both the deal workflow state and the shared chat
    // so participants see the transition in the same conversation stream.
    if (!currentThread || !relatedDeal) return
    const sender = getCurrentSender()
    if (!sender) return
    const comment = adminComment.trim()
    const changedBy = sender.label
    if (relatedDeal.status === 'new') {
      updateDealStatus(relatedDeal.id, 'under_review', changedBy, 'Запрошено подключение администратора из переписки', sender.role)
    }
    if (!relatedDeal.assignedManager) {
      updateDealFields(relatedDeal.id, { assignedManager: 'Команда Silk Road Hub' })
    }
    if (comment) {
      addMessage(currentThread.id, sender.id, sender.role, `Комментарий для администрации: ${comment}`)
    }
    addSystemMessage(currentThread.id, `${changedBy} запросил подключение администратора по сделке #${relatedDeal.id}.`)
    addMessage(
      currentThread.id,
      'admin-panel',
      'admin',
      comment
        ? 'Администрация подключилась к переписке, приняла комментарий и начинает обработку сделки.'
        : 'Администрация подключилась к переписке и начинает обработку сделки.',
    )
    setAdminComment('')
  }

  const handleSendToDocuments = () => {
    if (!currentThread || !relatedDeal) return
    const sender = getCurrentSender()
    if (!sender) return
    const comment = adminComment.trim()
    const changedBy = sender.label
    if (!['documents_preparation', 'completed', 'cancelled'].includes(relatedDeal.status)) {
      updateDealStatus(relatedDeal.id, 'documents_preparation', changedBy, 'Стороны подтвердили переход к подготовке документов', sender.role)
    }
    if (comment) {
      addMessage(currentThread.id, sender.id, sender.role, `Комментарий по документам: ${comment}`)
    }
    addSystemMessage(currentThread.id, `Сделка #${relatedDeal.id} переведена на этап подготовки документов.`)
    addMessage(currentThread.id, 'admin-panel', 'admin', 'Администрация начала этап подготовки документов. Проверьте карточку сделки и список требуемых файлов.')
    setAdminComment('')
  }

  const handleSubmitDocument = async () => {
    // Document uploads from chat are first-class workflow events: they create a
    // DealDocument record and can also move the deal into document preparation.
    if (!currentThread || !relatedDeal || (!docName.trim() && !selectedFile)) return
    const sender = getCurrentSender()
    if (!sender) return
    setDocError(null)
    setIsUploadingDoc(true)
    const effectiveDocName = docName.trim() || selectedFile?.name || 'Документ'
    let fileMetadata: Awaited<ReturnType<typeof uploadDealFile>> | null = null
    if (selectedFile) {
      try {
        fileMetadata = await uploadDealFile(selectedFile)
      } catch (error) {
        setDocError(error instanceof Error ? error.message : 'Ошибка загрузки файла.')
        setIsUploadingDoc(false)
        return
      }
    }
    addDealDocument(relatedDeal.id, {
      name: effectiveDocName,
      type: docType,
      status: 'uploaded',
      uploadedAt: new Date().toISOString(),
      uploadedByRole: sender.role,
      note: docNote.trim() || `Добавлено через переписку (${sender.label.toLowerCase()})`,
      sourceFileName: selectedFile?.name,
      sourceFileSize: selectedFile?.size,
      fileId: fileMetadata?.fileId,
      downloadUrl: fileMetadata?.downloadUrl,
    })
    if (!['documents_preparation', 'completed', 'cancelled'].includes(relatedDeal.status)) {
      updateDealStatus(relatedDeal.id, 'documents_preparation', sender.label, 'Документы загружены через общую переписку', sender.role)
    }
    addSystemMessage(currentThread.id, `${sender.label} добавил документ «${effectiveDocName}» в сделку #${relatedDeal.id}.`)
    addMessage(currentThread.id, 'admin-panel', 'admin', 'Документ получен. Администрация проверит его и обновит статус сделки.')
    setDocName('')
    setDocType('contract')
    setDocNote('')
    setSelectedFile(null)
    setFileInputKey((value) => value + 1)
    setIsUploadingDoc(false)
  }

  const displayThreads = availableThreads

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[400px] flex-col py-6 lg:flex-row lg:gap-6">
      {/* Thread list */}
      <div className="w-full shrink-0 rounded-2xl border border-border bg-white lg:w-80">
        <div className="border-b border-border p-3">
          <h2 className="text-base font-semibold text-slate-900">Сообщения</h2>
        </div>
        <div className="max-h-[280px] overflow-y-auto lg:max-h-[calc(100vh-14rem)]">
          {displayThreads.length === 0 ? (
            <div className="p-4">
              <div className="rounded-2xl border border-dashed border-border bg-slate-50 p-4 text-sm text-slate-500">
                <div className="font-medium text-slate-900">Пока нет диалогов</div>
                <div className="mt-1">Откройте каталог, выберите товар и нажмите «Написать продавцу», чтобы начать переписку.</div>
                <Link to="/app/catalog">
                  <Button variant="secondary" size="sm" className="mt-3">Перейти в каталог</Button>
                </Link>
              </div>
            </div>
          ) : (
            displayThreads.map((t) => {
              const product = getThreadProduct(t)
              const sellerName = sellers.find((s) => s.id === t.sellerId)?.name ?? t.sellerId
              const buyerLabel = t.buyerId
              const imBuyerHere = t.buyerId === myId || t.buyerId === mySellerId
              const msgs = getThreadMessages(t.id)
              const lastMsg = msgs[msgs.length - 1]
              const isActive = t.id === currentThread?.id
              const threadDeal = t.relatedDealId ? getDealById(t.relatedDealId) : null
              return (
                <Link
                  key={t.id}
                  to={`/app/messages/${t.id}`}
                  className={cx(
                    'block border-b border-border p-3 text-left transition-colors',
                    isActive ? 'bg-brand-yellow-soft' : 'hover:bg-slate-50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{product?.name ?? sellerName}</span>
                    {threadDeal && (
                      <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${DEAL_STATUS_TONE[threadDeal.status]}`}>
                        {DEAL_STATUS_LABELS[threadDeal.status]}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    {imBuyerHere ? `Продавец: ${sellerName}` : `Покупатель: ${buyerLabel}`}
                  </div>
                  {lastMsg && (
                    <div className="mt-1 truncate text-sm text-slate-600">
                      {lastMsg.isSystemMessage ? '⚙ ' : lastMsg.senderRole === 'admin' ? '👤 Админ: ' : ''}
                      {lastMsg.body}
                    </div>
                  )}
                </Link>
              )
            })
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-white lg:mt-0">
        {!currentThread ? (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-slate-500">
            Выберите диалог или откройте товар в каталоге и нажмите «Написать продавцу».
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">{threadProduct?.name ?? seller?.name ?? 'Диалог'}</h3>
                  {relatedDeal && (
                    <Link to={`/app/deals/${relatedDeal.id}`}>
                      <Badge tone="neutral" className={DEAL_STATUS_TONE[relatedDeal.status]}>
                        Сделка: {DEAL_STATUS_LABELS[relatedDeal.status]}
                      </Badge>
                    </Link>
                  )}
                </div>
                <p className="text-sm text-slate-600">
                  {amBuyerInThread
                    ? `Продавец: ${seller?.name ?? currentThread.sellerId} · ${seller?.country ?? ''}`
                    : `Покупатель: ${currentThread.buyerId}`}
                </p>
              </div>
              <div className="flex flex-wrap items-start justify-end gap-2">
                {threadProduct && (
                  <Link
                    to={`/app/catalog/product/${threadProduct.slug}`}
                    className="rounded-xl border border-border bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Открыть товар
                  </Link>
                )}
                {amBuyerInThread && threadProduct && !relatedDeal && (
                  <Button variant="primary" size="sm" className="gap-1" onClick={() => setShowDealModal(true)}>
                    <ShoppingBag className="size-3.5" /> Оформить сделку
                  </Button>
                )}
                {relatedDeal && (
                  <Link to={`/app/deals/${relatedDeal.id}`}>
                    <Button variant="secondary" size="sm" className="gap-1">
                      <ShoppingBag className="size-3.5" /> Детали сделки
                    </Button>
                  </Link>
                )}
                {relatedDeal && !['completed', 'cancelled'].includes(relatedDeal.status) && (
                  <Button variant="primary" size="sm" className="gap-1" onClick={handleRequestAdmin}>
                    <ShieldCheck className="size-3.5" /> Вызвать администратора
                  </Button>
                )}
                {relatedDeal && !['documents_preparation', 'completed', 'cancelled'].includes(relatedDeal.status) && (
                  <Button variant="secondary" size="sm" className="gap-1" onClick={handleSendToDocuments}>
                    <FileText className="size-3.5" /> На подготовку документов
                  </Button>
                )}
                {!relatedDeal && !threadProduct && (
                  <Link to={`/catalog/seller/${currentThread.sellerId}`}>
                    <Button variant="primary" size="sm" className="gap-1">
                      <ShoppingBag className="size-3.5" /> Выбрать товар для сделки
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            {relatedDeal && (
              <div className="shrink-0 border-b border-border bg-slate-50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="neutral">Групповая переписка сделки</Badge>
                  <Badge tone={adminJoined ? 'success' : 'warning'}>
                    {adminJoined ? 'Администратор подключен' : 'Ожидает подключения администратора'}
                  </Badge>
                  <Badge tone="info">Статус: {DEAL_STATUS_LABELS[relatedDeal.status]}</Badge>
                </div>
                <div className="mt-3 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-white p-4">
                    <div className="text-sm font-semibold text-slate-900">Комментарий для администрации</div>
                    <p className="mt-1 text-xs text-slate-500">
                      Здесь стороны могут пояснить детали сделки, условия и что именно нужно обработать.
                    </p>
                    <div className="mt-3">
                      <Textarea
                        value={adminComment}
                        onChange={(e) => setAdminComment(e.target.value)}
                        placeholder="Напр.: согласовали объем, нужен контракт и проверка сертификатов."
                        rows={4}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="primary" size="sm" className="gap-1" onClick={handleRequestAdmin}>
                        <ShieldCheck className="size-3.5" /> Позвать администратора
                      </Button>
                      <Button variant="secondary" size="sm" className="gap-1" onClick={handleSendToDocuments}>
                        <FileText className="size-3.5" /> Передать в обработку документов
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border bg-white p-4">
                    <div className="text-sm font-semibold text-slate-900">Документы в общий поток сделки</div>
                    <p className="mt-1 text-xs text-slate-500">
                      Добавленные документы сразу попадут в сделку и будут видны администратору в обработке.
                    </p>
                    <div className="mt-3 grid gap-3">
                      <Input
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        placeholder="Название документа"
                      />
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value as DocType)}
                        className="h-11 rounded-xl border border-border bg-white px-3 text-sm text-slate-900"
                      >
                        <option value="contract">Контракт</option>
                        <option value="invoice">Инвойс</option>
                        <option value="certificate">Сертификат</option>
                        <option value="shipping">Логистика</option>
                        <option value="other">Другое</option>
                      </select>
                      <Input
                        value={docNote}
                        onChange={(e) => setDocNote(e.target.value)}
                        placeholder="Комментарий к документу"
                      />
                      <div className="rounded-xl border border-dashed border-border bg-slate-50 p-3">
                        <label className="block cursor-pointer text-sm font-medium text-slate-700">
                          Выбрать файл
                          <input
                            key={fileInputKey}
                            type="file"
                            className="mt-2 block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-medium file:text-slate-700"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                          />
                        </label>
                        {selectedFile && (
                          <div className="mt-2 text-xs text-slate-500">
                            Файл: {selectedFile.name} ({Math.max(1, Math.round(selectedFile.size / 1024))} КБ)
                          </div>
                        )}
                      </div>
                      {docError ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                          {docError}
                        </div>
                      ) : null}
                      <div>
                        <Button variant="secondary" size="sm" className="gap-1" onClick={() => void handleSubmitDocument()} disabled={isUploadingDoc}>
                          <FileText className="size-3.5" /> Загрузить документ
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {!relatedDeal && (
              <div className="shrink-0 border-b border-border bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {threadProduct
                  ? 'После согласования нажмите «Оформить сделку», затем сможете вызвать администратора и передать сделку на этап документов.'
                  : 'В этом диалоге пока не выбран товар. Сначала выберите товар продавца, затем оформите сделку и передайте ее администрации.'}
              </div>
            )}

            {/* Email verification gate (buyers only) */}
            {isBuyerRole && !canMessage && (
              <div className="mx-4 mt-4 shrink-0 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="font-medium text-amber-800">Подтвердите почту, чтобы написать продавцу</p>
                <p className="mt-1 text-sm text-amber-700">Отправьте сообщение только после подтверждения email.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={handleResendEmail} disabled={resendSent}>
                    {resendSent ? 'Письмо отправлено' : 'Отправить письмо повторно'}
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleConfirmEmail}>
                    Я уже подтвердил почту
                  </Button>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 px-4 pt-4 pb-8">
              <div className="flex min-h-full flex-col justify-end gap-3">
                {messageList.map((m) => {
                  if (m.isSystemMessage) {
                    return (
                      <div key={m.id} className="flex justify-center">
                        <div className="max-w-[80%] rounded-xl border border-slate-200 bg-white px-4 py-2 text-center text-xs text-slate-500 italic shadow-sm">
                          {m.body}
                          <div className="mt-0.5 text-[10px] text-slate-400">{new Date(m.createdAt).toLocaleString('ru-RU')}</div>
                        </div>
                      </div>
                    )
                  }
                  if (m.senderRole === 'admin') {
                    return (
                      <div key={m.id} className="flex justify-center">
                        <div className="max-w-[82%] rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
                          <div className="mb-0.5 text-[10px] font-semibold uppercase text-amber-600">Администратор</div>
                          <p className="whitespace-pre-wrap">{m.body}</p>
                          <p className="mt-1 text-xs text-amber-500">{new Date(m.createdAt).toLocaleString('ru-RU')}</p>
                        </div>
                      </div>
                    )
                  }
                  const isMine = (amBuyerInThread && m.senderRole === 'buyer') || (amSellerInThread && !amBuyerInThread && m.senderRole === 'seller')
                  return (
                    <div key={m.id} className={isMine ? 'ml-8 flex justify-end' : 'mr-8'}>
                      <div
                        className={cx(
                          'max-w-[82%] rounded-2xl px-4 py-3 text-sm shadow-sm ring-1 ring-black/5',
                          isMine ? 'bg-brand-blue text-white' : 'border border-slate-200 bg-white text-slate-900'
                        )}
                      >
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <p className={cx('mt-1 text-xs', isMine ? 'text-blue-100' : 'text-slate-500')}>
                          {new Date(m.createdAt).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Input */}
            <div className="shrink-0 border-t border-border bg-white/95 p-4 shadow-[0_-10px_30px_-24px_rgba(15,23,42,0.45)] backdrop-blur">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder={canMessage ? 'Введите сообщение…' : 'Подтвердите почту, чтобы написать'}
                  className="flex-1 rounded-xl border border-border px-4 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                  disabled={!canMessage}
                />
                <Button variant="primary" onClick={handleSend} disabled={!canMessage || !inputText.trim()} className="gap-1">
                  <Send className="size-4" />
                  Отправить
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Deal modal */}
      {showDealModal && threadProduct && currentThread && (
        <div className="motion-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowDealModal(false)}>
          <div
            ref={modalShellRef}
            role="dialog"
            aria-modal="true"
            aria-label="Оформить сделку"
            onClick={(e) => e.stopPropagation()}
            className="motion-modal-panel max-w-md w-full"
          >
            <DealModal
              product={threadProduct}
              buyerId={currentThread.buyerId}
              threadId={currentThread.id}
              onClose={() => setShowDealModal(false)}
              onSuccess={handleDealSuccess}
            />
          </div>
        </div>
      )}
    </div>
  )
}
