import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, Send } from 'lucide-react'
import { Badge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { Input } from '@shared/ui/Input'
import { getAdminMessagesView } from '@features/admin/adminData'
import { DEAL_STATUS_LABELS, DEAL_STATUS_TONE } from '@features/deals/dealData'
import { addMessage } from '@features/messaging/messagingData'
import { usePlatformDataVersion } from '@shared/hooks/usePlatformDataVersion'

export function AdminMessagesPage() {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const version = usePlatformDataVersion()

  const threads = useMemo(() => getAdminMessagesView(), [version])
  const selected = threads.find((item) => item.thread.id === (selectedThreadId ?? threads[0]?.thread.id)) ?? threads[0] ?? null

  const handleSend = () => {
    if (!selected || !draft.trim()) return
    addMessage(selected.thread.id, 'admin-panel', 'admin', draft.trim())
    setDraft('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Сообщения</h1>
        <div className="text-sm text-slate-500">Администратор видит все deal-linked переписки и отвечает от имени платформы.</div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="py-5">
            <div className="text-2xl font-bold text-slate-900">{threads.length}</div>
            <div className="mt-1 text-sm text-slate-600">Активные треды</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <div className="text-2xl font-bold text-slate-900">{threads.filter((item) => item.deal).length}</div>
            <div className="mt-1 text-sm text-slate-600">Связаны со сделкой</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <div className="text-2xl font-bold text-slate-900">{threads.filter((item) => !item.deal).length}</div>
            <div className="mt-1 text-sm text-slate-600">Ещё без DealCase</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader title="Потоки переписки" subtitle={`${threads.length} активных тредов`} />
          <CardContent className="space-y-2">
            {threads.length === 0 && <p className="text-sm text-slate-500">Переписок пока нет.</p>}
            {threads.map((item) => (
              <button
                key={item.thread.id}
                type="button"
                onClick={() => setSelectedThreadId(item.thread.id)}
                className={`w-full rounded-2xl border p-3 text-left transition-colors ${selected?.thread.id === item.thread.id ? 'border-brand-blue bg-brand-blue/5' : 'border-border hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">{item.product?.name ?? item.seller?.name ?? item.thread.id}</span>
                  {item.deal && <Badge tone="neutral" className={DEAL_STATUS_TONE[item.deal.status]}>{DEAL_STATUS_LABELS[item.deal.status]}</Badge>}
                </div>
                <div className="mt-1 text-xs text-slate-500">Продавец: {item.seller?.name ?? item.thread.sellerId}</div>
                <div className="mt-1 truncate text-sm text-slate-600">{item.lastMessage?.body ?? 'Нет сообщений'}</div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          {!selected ? (
            <CardContent className="py-12 text-center text-sm text-slate-500">
              <MessageSquare className="mx-auto mb-3 size-10 text-slate-300" />
              Нет выбранного треда.
            </CardContent>
          ) : (
            <>
              <CardHeader
                title={selected.product?.name ?? selected.seller?.name ?? selected.thread.id}
                subtitle={selected.deal ? `Сделка ${selected.deal.id}` : 'Тред без сделки'}
              />
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-border bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {selected.deal
                    ? 'Используйте этот поток для координации buyer, seller и admin внутри одного кейса.'
                    : 'Этот тред ещё не связан со сделкой. После создания DealCase он появится в полном workflow.'}
                </div>
                <div className="flex flex-wrap gap-2">
                  {selected.deal && (
                    <Link to={`/admin/deals/${selected.deal.id}`} className="text-sm font-medium text-brand-blue hover:underline">
                      Открыть карточку сделки
                    </Link>
                  )}
                  {selected.deal && <Badge tone="neutral" className={DEAL_STATUS_TONE[selected.deal.status]}>{DEAL_STATUS_LABELS[selected.deal.status]}</Badge>}
                </div>

                <div className="max-h-[460px] space-y-2 overflow-y-auto rounded-2xl border border-border bg-slate-50 p-4">
                  {selected.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-2xl px-4 py-3 text-sm ${
                        message.isSystemMessage
                          ? 'border border-slate-200 bg-white text-center text-slate-500'
                          : message.senderRole === 'admin'
                            ? 'ml-auto max-w-[80%] border border-amber-200 bg-amber-50 text-amber-900'
                            : message.senderRole === 'buyer'
                              ? 'mr-auto max-w-[80%] bg-brand-blue/10 text-slate-900'
                              : 'mr-auto max-w-[80%] bg-white text-slate-900'
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
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && !event.shiftKey && (event.preventDefault(), handleSend())}
                    placeholder="Ответить от имени администрации..."
                  />
                  <Button variant="primary" size="sm" onClick={handleSend} className="gap-2" disabled={!draft.trim()}>
                    <Send className="size-4" />
                    Отправить
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
