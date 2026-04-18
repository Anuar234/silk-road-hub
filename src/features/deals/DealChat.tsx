import { useCallback, useEffect, useState } from 'react'
import { Send } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { Button } from '@shared/ui/Button'
import {
  apiCreateDealComment,
  apiListDealComments,
  DEAL_COMMENT_TYPE_LABELS,
  type DealComment,
  type DealCommentType,
  type DealCommentVisibility,
} from '@shared/api/dealApi'

type Props = {
  dealId: string
}

const typeOptions: { value: DealCommentType; label: string }[] = [
  { value: 'status_note', label: DEAL_COMMENT_TYPE_LABELS.status_note },
  { value: 'buyer_request', label: DEAL_COMMENT_TYPE_LABELS.buyer_request },
  { value: 'seller_request', label: DEAL_COMMENT_TYPE_LABELS.seller_request },
  { value: 'document_note', label: DEAL_COMMENT_TYPE_LABELS.document_note },
  { value: 'internal_note', label: DEAL_COMMENT_TYPE_LABELS.internal_note },
]

const visibilityOptions: { value: DealCommentVisibility; label: string }[] = [
  { value: 'all', label: 'Все стороны' },
  { value: 'buyer', label: 'Только покупатель' },
  { value: 'seller', label: 'Только продавец' },
  { value: 'internal', label: 'Только админ (внутреннее)' },
]

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function authorRoleLabel(role: string): string {
  switch (role) {
    case 'admin': return 'Администратор'
    case 'buyer': return 'Покупатель'
    case 'seller': return 'Продавец'
    case 'investor': return 'Инвестор'
    case 'institutional': return 'Институциональный'
    default: return role || 'Участник'
  }
}

export function DealChat({ dealId }: Props) {
  const [items, setItems] = useState<DealComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [type, setType] = useState<DealCommentType>('status_note')
  const [visibility, setVisibility] = useState<DealCommentVisibility>('all')
  const [sending, setSending] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await apiListDealComments(dealId)
      setItems(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [dealId])

  useEffect(() => {
    void load()
  }, [load])

  const send = async () => {
    const body = text.trim()
    if (!body) return
    setSending(true)
    setError(null)
    try {
      const created = await apiCreateDealComment(dealId, { body, type, visibility })
      setItems((prev) => [...prev, created])
      setText('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось отправить')
    } finally {
      setSending(false)
    }
  }

  return (
    <Card>
      <CardHeader
        title="Чат сделки"
        subtitle="Защищённые сообщения между продавцом, покупателем и администратором (ТЗ 5.3)"
      />
      <CardContent className="space-y-4">
        <div className="max-h-80 space-y-3 overflow-y-auto rounded-lg border border-border bg-slate-50/60 p-3">
          {loading && <div className="text-sm text-slate-500">Загрузка…</div>}
          {!loading && items.length === 0 && (
            <div className="text-sm text-slate-500">Сообщений пока нет. Начните переговоры первым сообщением.</div>
          )}
          {items.map((c) => (
            <div key={c.id} className="rounded-xl bg-white p-3 text-sm shadow-sm">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{c.author}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5">{authorRoleLabel(c.authorRole)}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5">{DEAL_COMMENT_TYPE_LABELS[c.type]}</span>
                {c.visibility !== 'all' && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
                    Видно: {c.visibility}
                  </span>
                )}
                <span className="ml-auto">{formatTime(c.createdAt)}</span>
              </div>
              <div className="mt-1.5 whitespace-pre-wrap text-slate-800">{c.body}</div>
            </div>
          ))}
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-800">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            <label className="flex items-center gap-1">
              Тип:
              <select
                value={type}
                onChange={(e) => setType(e.target.value as DealCommentType)}
                className="h-8 rounded-md border border-slate-300 bg-white px-1 text-xs"
              >
                {typeOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1">
              Видимость:
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as DealCommentVisibility)}
                className="h-8 rounded-md border border-slate-300 bg-white px-1 text-xs"
              >
                {visibilityOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Напишите сообщение контрагенту или администратору…"
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
          />
          <div className="flex items-center justify-end">
            <Button onClick={() => void send()} disabled={sending || !text.trim()} className="gap-2">
              <Send className="size-4" />
              {sending ? 'Отправка…' : 'Отправить'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
