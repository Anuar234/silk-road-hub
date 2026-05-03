import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { buildFlashState } from '@shared/api/navigationState'
import { FileText, MessageCircle, Send, ShieldCheck, ShoppingBag } from 'lucide-react'
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { uploadDealFile } from '@shared/api/fileApi'
import { apiResendVerification } from '@shared/api/authApi'
import {
  apiListMessages,
  apiListThreads,
  apiMarkThreadRead,
  apiOpenThread,
  apiPostMessage,
  type MessageRow,
  type MessageThread,
} from '@shared/api/messagingApi'
import { Button } from '@shared/ui/Button'
import { Badge } from '@shared/ui/Badge'
import { Input } from '@shared/ui/Input'
import { Textarea } from '@shared/ui/Textarea'
import { useAuth } from '@features/auth/auth'
import { cx } from '@shared/lib/cx'
import { DealModal } from '@widgets/deal/DealModal'
import {
  addDealDocument,
  DEAL_STATUS_LABELS,
  DEAL_STATUS_TONE,
  getDealByThreadId,
  updateDealFields,
  updateDealStatus,
} from '@features/deals/dealData'
import type { DocType } from '@features/deals/dealData'
import { products } from '@mocks/mockData'
import { usePlatformDataVersion } from '@shared/hooks/usePlatformDataVersion'

const MESSAGE_POLL_INTERVAL_MS = 8000

/**
 * Buyer↔seller messaging surface backed by the real /api/messaging endpoints.
 * Deal-related actions still operate against the in-memory deal store; that
 * lookup is by threadId so the UI panel for an open deal works regardless of
 * whether `related_deal_id` has been populated server-side.
 */
export function AppMessagesPage() {
  const { threadId } = useParams()
  const [searchParams] = useSearchParams()
  const sellerIdFromQuery = searchParams.get('seller')
  const productIdFromQuery = searchParams.get('product')
  const auth = useAuth()
  const navigate = useNavigate()
  const version = usePlatformDataVersion()

  const isBuyerRole = auth.role === 'buyer'
  const canMessage = isBuyerRole ? auth.emailVerified : true

  const [threads, setThreads] = useState<MessageThread[]>([])
  const [threadsError, setThreadsError] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [messagesError, setMessagesError] = useState<string | null>(null)
  const [openError, setOpenError] = useState<string | null>(null)

  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [resendState, setResendState] = useState<'idle' | 'pending' | 'sent' | 'error'>('idle')
  const [resendError, setResendError] = useState<string | null>(null)
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
  // Message UX refs — keep the chat scrolled to the latest message and let
  // the textarea grow with content up to a sensible cap.
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const [messagesLoading, setMessagesLoading] = useState(false)

  const refreshThreads = useCallback(async () => {
    try {
      const list = await apiListThreads()
      setThreads(list)
      setThreadsError(null)
    } catch (e) {
      setThreadsError(e instanceof Error ? e.message : 'Не удалось загрузить переписки.')
    }
  }, [])

  // Initial threads fetch + after every send.
  useEffect(() => {
    void refreshThreads()
  }, [refreshThreads])

  // Bootstrap from `?seller=X&product=Y`: open or reuse a thread, then redirect
  // to /app/messages/:id so the URL is shareable and reload-stable.
  useEffect(() => {
    if (threadId || !sellerIdFromQuery) return
    let cancelled = false
    void apiOpenThread({
      counterpartId: sellerIdFromQuery,
      productId: productIdFromQuery ?? undefined,
    })
      .then((t) => {
        if (cancelled) return
        navigate(`/app/messages/${t.id}`, { replace: true })
        // Refresh inbox so the new thread appears in the sidebar.
        void refreshThreads()
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setOpenError(e instanceof Error ? e.message : 'Не удалось открыть переписку.')
      })
    return () => {
      cancelled = true
    }
  }, [threadId, sellerIdFromQuery, productIdFromQuery, navigate, refreshThreads])

  // Load messages when thread changes; poll every 8s while it's open so new
  // messages from the counterpart appear without a full page refresh. Pilot:
  // polling is good enough; WebSockets are an Этап 2 task.
  useEffect(() => {
    if (!threadId) {
      setMessages([])
      setMessagesError(null)
      setMessagesLoading(false)
      return
    }
    let cancelled = false
    setMessagesLoading(true)

    const load = async (markRead: boolean) => {
      try {
        const list = await apiListMessages(threadId)
        if (cancelled) return
        setMessages(list)
        setMessagesError(null)
        if (markRead) {
          // Fire-and-forget: read receipt failures shouldn't break the chat.
          void apiMarkThreadRead(threadId).then(() => {
            void refreshThreads()
          }).catch(() => {})
        }
      } catch (e) {
        if (cancelled) return
        setMessagesError(e instanceof Error ? e.message : 'Не удалось загрузить сообщения.')
      } finally {
        if (!cancelled && markRead) setMessagesLoading(false)
      }
    }
    void load(true)
    const handle = window.setInterval(() => void load(false), MESSAGE_POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      window.clearInterval(handle)
    }
  }, [threadId, refreshThreads])

  // Stick the chat to the latest message whenever the list grows.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' })
  }, [messages.length, threadId])

  // Auto-grow the message textarea up to ~6 lines, then internal scroll.
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [inputText])

  const currentThread = useMemo(
    () => (threadId ? threads.find((t) => t.id === threadId) ?? null : null),
    [threadId, threads],
  )

  const amBuyerInThread = currentThread?.buyerId === auth.userId
  const amSellerInThread = currentThread?.sellerId === auth.userId

  // Deal lookup is local: messaging API has no awareness of the still-mock deal
  // store. usePlatformDataVersion ticks when deals mutate (via storeEvents).
  void version
  const relatedDeal = currentThread ? getDealByThreadId(currentThread.id) ?? null : null
  const threadProduct = useMemo(() => {
    if (!currentThread?.productId) return null
    // Prefer mock catalog product (has slug + media); fallback to whatever the
    // server returned. Real backend products will be present here once the
    // catalog is fully DB-backed.
    return products.find((p) => p.id === currentThread.productId) ?? null
  }, [currentThread])

  const adminJoined = useMemo(() => {
    if (!relatedDeal) return false
    return messages.some((m) => m.senderRole === 'admin') || Boolean(relatedDeal.assignedManager)
  }, [messages, relatedDeal])

  // Modal focus trap (kept verbatim from prior version).
  useEffect(() => {
    if (!showDealModal) return
    modalTriggerRef.current = document.activeElement as HTMLElement | null
    const focusables = modalShellRef.current?.querySelectorAll<HTMLElement>(
      'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',
    )
    focusables?.[0]?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setShowDealModal(false)
        return
      }
      if (event.key !== 'Tab' || !focusables || focusables.length === 0) return
      const focused = document.activeElement as HTMLElement | null
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (!event.shiftKey && focused === last) {
        event.preventDefault()
        first.focus()
      } else if (event.shiftKey && focused === first) {
        event.preventDefault()
        last.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      modalTriggerRef.current?.focus()
    }
  }, [showDealModal])

  const handleSend = async () => {
    if (!currentThread || !inputText.trim() || !canMessage || sending) return
    const body = inputText.trim()
    setSending(true)
    try {
      const msg = await apiPostMessage(currentThread.id, body)
      setMessages((prev) => [...prev, msg])
      setInputText('')
      void refreshThreads()
    } catch (e) {
      setMessagesError(e instanceof Error ? e.message : 'Не удалось отправить сообщение.')
    } finally {
      setSending(false)
    }
  }

  const handleResendEmail = async () => {
    setResendState('pending')
    setResendError(null)
    try {
      await apiResendVerification()
      setResendState('sent')
    } catch (e) {
      setResendError(e instanceof Error ? e.message : 'Не удалось отправить ссылку.')
      setResendState('error')
    }
  }
  // Pilot/test escape hatch: while there are no real users and SMTP is not
  // wired in, testers need to bypass the email gate without copying tokens
  // from backend logs. Hidden with NEXT_PUBLIC_ENABLE_DEMO_LOGIN=false.
  const demoEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN !== 'false'
  const handleConfirmEmail = () => auth.setEmailVerified(true)

  const handleDealSuccess = (dealId: string) => {
    setShowDealModal(false)
    navigate(`/app/deals/${dealId}`, { state: buildFlashState('Сделка создана успешно.') })
  }

  const handleRequestAdmin = async () => {
    if (!currentThread || !relatedDeal) return
    const role = amBuyerInThread ? 'buyer' : amSellerInThread ? 'seller' : null
    if (!role) return
    if (relatedDeal.status === 'new') {
      updateDealStatus(relatedDeal.id, 'under_review', auth.displayName ?? auth.email ?? 'Участник', 'Запрошено подключение администратора из переписки', role)
    }
    if (!relatedDeal.assignedManager) {
      updateDealFields(relatedDeal.id, { assignedManager: 'Команда Silk Road Hub' })
    }
    if (adminComment.trim()) {
      try {
        const msg = await apiPostMessage(currentThread.id, `Комментарий для администрации: ${adminComment.trim()}`)
        setMessages((prev) => [...prev, msg])
      } catch {
        // status update already happened; failure to post the chat note isn't fatal
      }
    }
    setAdminComment('')
  }

  const handleSendToDocuments = async () => {
    if (!currentThread || !relatedDeal) return
    const role = amBuyerInThread ? 'buyer' : amSellerInThread ? 'seller' : null
    if (!role) return
    if (!['documents_preparation', 'completed', 'cancelled'].includes(relatedDeal.status)) {
      updateDealStatus(relatedDeal.id, 'documents_preparation', auth.displayName ?? auth.email ?? 'Участник', 'Стороны подтвердили переход к подготовке документов', role)
    }
    if (adminComment.trim()) {
      try {
        const msg = await apiPostMessage(currentThread.id, `Комментарий по документам: ${adminComment.trim()}`)
        setMessages((prev) => [...prev, msg])
      } catch {
        // ignored
      }
    }
    setAdminComment('')
  }

  const handleSubmitDocument = async () => {
    if (!currentThread || !relatedDeal || (!docName.trim() && !selectedFile)) return
    const role = amBuyerInThread ? 'buyer' : amSellerInThread ? 'seller' : null
    if (!role) return
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
      uploadedByRole: role,
      note: docNote.trim() || `Добавлено через переписку (${role === 'buyer' ? 'покупатель' : 'продавец'})`,
      sourceFileName: selectedFile?.name,
      sourceFileSize: selectedFile?.size,
      fileId: fileMetadata?.fileId,
      downloadUrl: fileMetadata?.downloadUrl,
    })
    if (!['documents_preparation', 'completed', 'cancelled'].includes(relatedDeal.status)) {
      updateDealStatus(relatedDeal.id, 'documents_preparation', auth.displayName ?? auth.email ?? 'Участник', 'Документы загружены через общую переписку', role)
    }
    try {
      const msg = await apiPostMessage(currentThread.id, `Документ «${effectiveDocName}» добавлен в сделку.`)
      setMessages((prev) => [...prev, msg])
    } catch {
      // ignored
    }
    setDocName('')
    setDocType('contract')
    setDocNote('')
    setSelectedFile(null)
    setFileInputKey((value) => value + 1)
    setIsUploadingDoc(false)
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[400px] flex-col py-6 lg:flex-row lg:gap-6">
      {/* Thread list */}
      <div className="w-full shrink-0 rounded-2xl border border-border bg-white lg:w-80">
        <div className="border-b border-border p-3">
          <h2 className="text-base font-semibold text-slate-900">Сообщения</h2>
        </div>
        <div className="max-h-[280px] overflow-y-auto lg:max-h-[calc(100vh-14rem)]">
          {threadsError && (
            <div className="m-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {threadsError}
            </div>
          )}
          {!threadsError && threads.length === 0 ? (
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
            threads.map((t) => {
              const isActive = t.id === currentThread?.id
              const counterpartName = t.buyerId === auth.userId ? t.sellerName : t.buyerName
              const threadDeal = getDealByThreadId(t.id)
              const unread = t.unreadCount > 0
              const lastTime = t.lastMessageAt ?? t.updatedAt
              return (
                <Link
                  key={t.id}
                  to={`/app/messages/${t.id}`}
                  className={cx(
                    'flex gap-3 border-b border-border p-3 text-left transition-colors',
                    isActive ? 'bg-brand-yellow-soft' : 'hover:bg-slate-50',
                  )}
                >
                  <div className="shrink-0">
                    <span className="grid size-10 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                      {initials(counterpartName ?? t.productName ?? 'Д')}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cx('truncate font-medium text-slate-900', unread && 'font-semibold')}>
                        {t.productName ?? counterpartName ?? 'Диалог'}
                      </span>
                      <span className="ml-auto shrink-0 text-[11px] text-slate-500">
                        {formatThreadTime(lastTime)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                      <span className="truncate">
                        {t.buyerId === auth.userId ? `Продавец: ${t.sellerName ?? '—'}` : `Покупатель: ${t.buyerName ?? '—'}`}
                      </span>
                      {threadDeal && (
                        <span className={cx('shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium', DEAL_STATUS_TONE[threadDeal.status])}>
                          {DEAL_STATUS_LABELS[threadDeal.status]}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={cx('truncate text-sm', unread ? 'font-medium text-slate-900' : 'text-slate-600')}>
                        {t.lastMessageBody
                          ? `${t.lastMessageRole === 'system' ? '⚙ ' : t.lastMessageRole === 'admin' ? '👤 Админ: ' : ''}${t.lastMessageBody}`
                          : <span className="italic text-slate-400">Сообщений ещё нет</span>}
                      </span>
                      {unread && (
                        <span className="ml-auto inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-blue px-1.5 text-[10px] font-semibold text-white">
                          {t.unreadCount > 9 ? '9+' : t.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-white lg:mt-0">
        {openError && !currentThread && (
          <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {openError}
          </div>
        )}
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
                  <h3 className="font-semibold text-slate-900">
                    {currentThread.productName ?? (amBuyerInThread ? currentThread.sellerName : currentThread.buyerName) ?? 'Диалог'}
                  </h3>
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
                    ? `Продавец: ${currentThread.sellerName ?? currentThread.sellerId}`
                    : `Покупатель: ${currentThread.buyerName ?? currentThread.buyerId}`}
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
                      Опишите, что нужно проверить, согласовать или передать на следующий этап.
                    </p>
                    <div className="mt-3">
                      <Textarea
                        value={adminComment}
                        onChange={(e) => setAdminComment(e.target.value)}
                        placeholder="Напр.: согласовали объём, нужен контракт и проверка сертификатов."
                        rows={4}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="primary" size="sm" className="gap-1" onClick={() => void handleRequestAdmin()}>
                        <ShieldCheck className="size-3.5" /> Позвать администратора
                      </Button>
                      <Button variant="secondary" size="sm" className="gap-1" onClick={() => void handleSendToDocuments()}>
                        <FileText className="size-3.5" /> Передать в обработку документов
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-white p-4">
                    <div className="text-sm font-semibold text-slate-900">Документы в сделку</div>
                    <p className="mt-1 text-xs text-slate-500">
                      Файл попадает в карточку сделки и виден администратору.
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

            {/* Email verification gate (buyers only) */}
            {isBuyerRole && !canMessage && (
              <div className="mx-4 mt-4 shrink-0 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="font-medium text-amber-800">Подтвердите почту, чтобы написать продавцу</p>
                <p className="mt-1 text-sm text-amber-700">
                  Откройте ссылку из письма — после подтверждения вы сможете отправлять сообщения. Если письмо не пришло,
                  отправьте новое.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void handleResendEmail()}
                    disabled={resendState === 'pending' || resendState === 'sent'}
                  >
                    {resendState === 'pending'
                      ? 'Отправляем…'
                      : resendState === 'sent'
                        ? 'Ссылка отправлена'
                        : 'Отправить ссылку повторно'}
                  </Button>
                  {demoEnabled && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleConfirmEmail}
                      title="Тестовый шорткат: включается NEXT_PUBLIC_ENABLE_DEMO_LOGIN"
                    >
                      Я уже подтвердил почту (demo)
                    </Button>
                  )}
                  {resendState === 'error' && resendError && (
                    <span role="alert" className="text-sm text-rose-700">{resendError}</span>
                  )}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 px-4 pt-4 pb-6">
              {messagesError && (
                <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {messagesError}
                </div>
              )}

              {messagesLoading && messages.length === 0 ? (
                <MessagesSkeleton />
              ) : messages.length === 0 ? (
                <EmptyThread
                  counterpartName={
                    amBuyerInThread
                      ? currentThread.sellerName ?? 'продавцом'
                      : currentThread.buyerName ?? 'покупателем'
                  }
                />
              ) : (
                <div className="flex min-h-full flex-col justify-end gap-1.5">
                  {(() => {
                    let lastDayKey = ''
                    let lastSenderId: string | null | undefined = undefined
                    let lastIsSystem = false
                    return messages.map((m) => {
                      const created = new Date(m.createdAt)
                      const dayKey = created.toDateString()
                      const showDaySeparator = dayKey !== lastDayKey
                      lastDayKey = dayKey

                      const isSystem = m.isSystemMessage || m.senderRole === 'system'
                      const isAdmin = m.senderRole === 'admin'
                      const isMine = !isSystem && !isAdmin && m.senderId === auth.userId
                      // Group consecutive messages from the same author with no
                      // system message between them — only the first in a group
                      // gets the avatar/name header.
                      const continuation =
                        !isSystem &&
                        !isAdmin &&
                        m.senderId === lastSenderId &&
                        !lastIsSystem
                      lastSenderId = isSystem || isAdmin ? null : m.senderId ?? null
                      lastIsSystem = isSystem

                      const senderName = isMine
                        ? null
                        : amBuyerInThread
                          ? currentThread.sellerName ?? 'Продавец'
                          : currentThread.buyerName ?? 'Покупатель'

                      return (
                        <Fragment key={m.id}>
                          {showDaySeparator && <DaySeparator date={created} />}
                          {isSystem ? (
                            <div className="my-1 flex justify-center">
                              <div className="max-w-[80%] rounded-xl border border-slate-200 bg-white px-4 py-2 text-center text-xs italic text-slate-500 shadow-sm">
                                {m.body}
                                <div className="mt-0.5 text-[10px] text-slate-400">{formatTimeShort(created)}</div>
                              </div>
                            </div>
                          ) : isAdmin ? (
                            <div className="my-1 flex justify-center">
                              <div className="max-w-[82%] rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
                                <div className="mb-0.5 text-[10px] font-semibold uppercase text-amber-600">Администратор</div>
                                <p className="whitespace-pre-wrap">{m.body}</p>
                                <p className="mt-1 text-xs text-amber-500">{formatTimeShort(created)}</p>
                              </div>
                            </div>
                          ) : (
                            <div className={cx('flex items-end gap-2', isMine ? 'flex-row-reverse' : '', continuation ? 'mt-0.5' : 'mt-2')}>
                              {!isMine && (
                                <div className={cx('flex w-8 shrink-0 items-end justify-center', continuation && 'invisible')}>
                                  <span className="grid size-8 place-items-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-700">
                                    {initials(senderName)}
                                  </span>
                                </div>
                              )}
                              <div className={cx('flex max-w-[82%] flex-col', isMine ? 'items-end' : 'items-start')}>
                                {!continuation && !isMine && senderName && (
                                  <div className="mb-1 px-1 text-[11px] font-medium text-slate-500">{senderName}</div>
                                )}
                                <div
                                  className={cx(
                                    'rounded-2xl px-4 py-2.5 text-sm shadow-sm ring-1 ring-black/5',
                                    isMine ? 'bg-brand-blue text-white' : 'border border-slate-200 bg-white text-slate-900',
                                  )}
                                >
                                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                                  <p className={cx('mt-1 text-right text-[10px]', isMine ? 'text-blue-100' : 'text-slate-400')}>
                                    {formatTimeShort(created)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </Fragment>
                      )
                    })
                  })()}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="shrink-0 border-t border-border bg-white/95 p-3 shadow-[0_-10px_30px_-24px_rgba(15,23,42,0.45)] backdrop-blur sm:p-4">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void handleSend()
                    }
                  }}
                  placeholder={canMessage ? 'Введите сообщение… (Shift+Enter — новая строка)' : 'Подтвердите почту, чтобы написать'}
                  className="flex-1 resize-none rounded-xl border border-border px-4 py-2.5 text-sm leading-relaxed outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 disabled:opacity-60"
                  style={{ maxHeight: 160 }}
                  disabled={!canMessage || sending}
                />
                <Button
                  variant="primary"
                  onClick={() => void handleSend()}
                  disabled={!canMessage || !inputText.trim() || sending}
                  className="shrink-0 gap-1"
                >
                  <Send className="size-4" />
                  <span className="hidden sm:inline">{sending ? 'Отправка…' : 'Отправить'}</span>
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

// ── Helpers and inline subcomponents for the messaging UI ──────────────────

function initials(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?'
}

function formatTimeShort(d: Date): string {
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function formatDayLabel(d: Date): string {
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Сегодня'
  if (d.toDateString() === yesterday.toDateString()) return 'Вчера'
  const sameYear = today.getFullYear() === d.getFullYear()
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: sameYear ? undefined : 'numeric',
  })
}

function formatThreadTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  if (diffMs < 60_000) return 'только что'
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)} мин назад`
  const today = now.toDateString() === d.toDateString()
  if (today) return formatTimeShort(d)
  const yesterday = new Date()
  yesterday.setDate(now.getDate() - 1)
  if (yesterday.toDateString() === d.toDateString()) return 'вчера'
  const sameYear = now.getFullYear() === d.getFullYear()
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: sameYear ? undefined : '2-digit',
  })
}

function DaySeparator({ date }: { date: Date }) {
  return (
    <div className="my-3 flex items-center gap-3">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="rounded-full bg-white px-3 py-0.5 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200">
        {formatDayLabel(date)}
      </span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  )
}

function MessagesSkeleton() {
  return (
    <div className="flex flex-col gap-3 pt-4">
      {[0, 1, 2].map((i) => {
        const right = i % 2 === 1
        return (
          <div key={i} className={right ? 'flex justify-end' : 'flex items-end gap-2'}>
            {!right && <div className="size-8 shrink-0 rounded-full bg-slate-200" />}
            <div
              className={`h-12 w-[60%] animate-pulse rounded-2xl ${
                right ? 'bg-brand-blue/30' : 'bg-slate-200'
              }`}
            />
          </div>
        )
      })}
    </div>
  )
}

function EmptyThread({ counterpartName }: { counterpartName: string }) {
  return (
    <div className="flex h-full items-center justify-center px-6 text-center">
      <div className="max-w-sm">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-blue/10 text-brand-blue">
          <MessageCircle className="size-6" />
        </div>
        <p className="mt-3 text-sm font-medium text-slate-900">Начните диалог с {counterpartName}</p>
        <p className="mt-1 text-sm text-slate-600">
          Опишите, что вас интересует — собеседник увидит сообщение, как только обновит чат.
        </p>
      </div>
    </div>
  )
}
