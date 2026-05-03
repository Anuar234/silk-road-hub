import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Building2, MessageCircle, Plus, Trash2, X } from 'lucide-react'
import { Container } from '@widgets/layout/Container'
import { apiOpenThread, apiPostMessage } from '@shared/api/messagingApi'
import { Badge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { Textarea } from '@shared/ui/Textarea'
import {
  apiAddRfqMatch,
  apiDeleteRfqMatch,
  apiGetRfq,
  apiUpdateRfq,
  RFQ_STATUS_LABELS,
  RFQ_STATUS_TONE,
  type Rfq,
  type RfqStatus,
} from '@shared/api/rfqApi'
import { apiGetUsers } from '@shared/api/usersApi'
import type { ApiUser } from '@shared/api/authApi'
import { useAuth } from '@features/auth/auth'

export function AppRfqDetailPage() {
  const { id } = useParams()
  const auth = useAuth()
  const navigate = useNavigate()
  const [rfq, setRfq] = useState<Rfq | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contactBusy, setContactBusy] = useState(false)

  const isAdmin = auth.role === 'admin'
  const isOwner = !!rfq && rfq.buyerId === auth.userId
  const isSeller = auth.role === 'seller'
  const isMatchedSeller =
    isSeller && !!rfq?.matches?.some((m) => m.sellerId === auth.userId)
  const isActiveRfq = !!rfq && rfq.status !== 'fulfilled' && rfq.status !== 'closed'
  // Sellers who aren't matched yet but see an active RFQ get a direct
  // "write to buyer" path that opens (or reuses) a messaging thread.
  const canSellerContact = isSeller && !isMatchedSeller && isActiveRfq && !!rfq
  // Admin lives under /admin/rfq, others under /app/rfq.
  const basePath = isAdmin ? '/admin/rfq' : '/app/rfq'

  const handleContactBuyer = async () => {
    if (!rfq) return
    setContactBusy(true)
    setError(null)
    try {
      const thread = await apiOpenThread({ counterpartId: rfq.buyerId })
      // Seed the conversation with explicit RFQ context so the buyer
      // immediately sees who is writing and why. Failure to post the intro
      // shouldn't block navigation — the thread already exists.
      const intro = buildSellerIntroMessage(rfq.title, rfq.id)
      try {
        await apiPostMessage(thread.id, intro)
      } catch {
        // ignored — buyer will just see an empty thread, seller can type
      }
      navigate(`/app/messages/${thread.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось открыть переписку.')
    } finally {
      setContactBusy(false)
    }
  }

  const reload = async () => {
    if (!id) return
    try {
      const r = await apiGetRfq(id)
      setRfq(r)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Запрос не найден')
    }
  }

  useEffect(() => {
    let cancelled = false
    if (!id) return
    void apiGetRfq(id)
      .then((r) => {
        if (!cancelled) setRfq(r)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Запрос не найден')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <Container className="py-8 text-sm text-slate-500">Загрузка…</Container>

  if (error || !rfq) {
    return (
      <Container className="py-8">
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error ?? 'Запрос не найден.'}
        </div>
        <Link to={basePath} className="mt-4 inline-block text-sm text-brand-blue hover:underline">
          ← К списку запросов
        </Link>
      </Container>
    )
  }

  return (
    <Container className="space-y-6 py-6">
      <Link to={basePath} className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900">
        <ArrowLeft className="size-4" /> К списку запросов
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{rfq.title}</h1>
            <Badge tone={RFQ_STATUS_TONE[rfq.status]}>{RFQ_STATUS_LABELS[rfq.status]}</Badge>
          </div>
          <div className="mt-1 text-sm text-slate-600">
            Запрос #{rfq.id.slice(0, 8)} · создан {new Date(rfq.createdAt).toLocaleDateString('ru-RU')}
            {rfq.buyerName && ` · ${rfq.buyerName}`}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {canSellerContact && (
            <Button
              variant="primary"
              size="sm"
              className="gap-1"
              disabled={contactBusy}
              onClick={() => void handleContactBuyer()}
            >
              <MessageCircle className="size-4" />
              {contactBusy ? 'Открываем переписку…' : 'Написать покупателю'}
            </Button>
          )}
          {isOwner && rfq.status === 'open' && (
            <Link to={`${basePath}/${rfq.id}/edit`}>
              <Button variant="secondary" size="sm">Редактировать</Button>
            </Link>
          )}
          {isOwner && rfq.status !== 'closed' && rfq.status !== 'fulfilled' && (
            <CloseButton rfqId={rfq.id} onDone={reload} />
          )}
        </div>
      </div>

      <Card>
        <CardHeader title="Что нужно" />
        <CardContent className="grid gap-3">
          {rfq.description && (
            <div>
              <div className="text-xs font-medium text-slate-500">Описание</div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{rfq.description}</p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Row label="Страна назначения" value={rfq.targetCountry || '—'} />
            <Row label="Объём" value={rfq.quantity || '—'} />
            <Row label="Бюджет (USD)" value={rfq.budgetUsd ? `до $${rfq.budgetUsd.toLocaleString('en-US')}` : '—'} />
            <Row
              label="Желаемый срок"
              value={rfq.targetDate ? new Date(rfq.targetDate).toLocaleDateString('ru-RU') : '—'}
            />
            <Row label="Incoterms" value={rfq.incoterms || '—'} />
            {rfq.notes && <Row label="Дополнительно" value={rfq.notes} fullWidth />}
          </div>
        </CardContent>
      </Card>

      {isMatchedSeller && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="py-4 text-sm text-emerald-900">
            Вас подобрала администрация как поставщика по этому запросу. Откройте переписку с покупателем,
            обсудите детали и предложите коммерческое условие.
          </CardContent>
        </Card>
      )}

      <MatchesSection rfq={rfq} isAdmin={isAdmin} onChange={reload} />

      {isAdmin && (
        <AdminControls rfq={rfq} onChange={reload} />
      )}
    </Container>
  )
}

function Row({ label, value, fullWidth }: { label: string; value: string; fullWidth?: boolean }) {
  return (
    <div className={fullWidth ? 'sm:col-span-2' : undefined}>
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{value}</div>
    </div>
  )
}

function CloseButton({ rfqId, onDone }: { rfqId: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false)
  const handleClose = async () => {
    if (!confirm('Закрыть запрос? Это действие нельзя отменить.')) return
    setBusy(true)
    try {
      await apiUpdateRfq(rfqId, { status: 'closed' })
      onDone()
    } finally {
      setBusy(false)
    }
  }
  return (
    <Button variant="secondary" size="sm" disabled={busy} onClick={() => void handleClose()}>
      Закрыть запрос
    </Button>
  )
}

function MatchesSection({ rfq, isAdmin, onChange }: { rfq: Rfq; isAdmin: boolean; onChange: () => void }) {
  const matches = rfq.matches ?? []
  return (
    <Card>
      <CardHeader title={`Подобранные продавцы (${matches.length})`} subtitle="Подбор администрации" />
      <CardContent className="grid gap-3">
        {matches.length === 0 ? (
          <p className="text-sm text-slate-500">
            Пока никто не подобран. Администратор скоро рассмотрит запрос и предложит поставщиков.
          </p>
        ) : (
          matches.map((m) => (
            <div key={m.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border bg-white p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-900">
                    {m.sellerCompany || m.sellerName || m.sellerEmail || m.sellerId.slice(0, 8)}
                  </span>
                </div>
                {m.sellerName && m.sellerCompany && (
                  <div className="mt-0.5 text-xs text-slate-500">Контакт: {m.sellerName}</div>
                )}
                {m.note && <p className="mt-1 text-sm text-slate-600">{m.note}</p>}
                <div className="mt-1 text-xs text-slate-500">Подобран {new Date(m.createdAt).toLocaleDateString('ru-RU')}</div>
              </div>
              <div className="flex items-center gap-2">
                {m.threadId && (
                  <Link to={`/app/messages/${m.threadId}`}>
                    <Button variant="primary" size="sm" className="gap-1">
                      <MessageCircle className="size-3.5" />
                      Переписка
                    </Button>
                  </Link>
                )}
                {isAdmin && (
                  <RemoveMatchButton rfqId={rfq.id} matchId={m.id} onChange={onChange} />
                )}
              </div>
            </div>
          ))
        )}

        {isAdmin && rfq.status !== 'closed' && rfq.status !== 'fulfilled' && (
          <AddMatchForm rfqId={rfq.id} onChange={onChange} />
        )}
      </CardContent>
    </Card>
  )
}

function RemoveMatchButton({ rfqId, matchId, onChange }: { rfqId: string; matchId: string; onChange: () => void }) {
  const [busy, setBusy] = useState(false)
  const handleRemove = async () => {
    if (!confirm('Убрать продавца из подборки?')) return
    setBusy(true)
    try {
      await apiDeleteRfqMatch(rfqId, matchId)
      onChange()
    } finally {
      setBusy(false)
    }
  }
  return (
    <Button variant="secondary" size="sm" disabled={busy} className="gap-1 text-rose-600 border-rose-200 hover:bg-rose-50" onClick={() => void handleRemove()}>
      <Trash2 className="size-3.5" />
    </Button>
  )
}

function AddMatchForm({ rfqId, onChange }: { rfqId: string; onChange: () => void }) {
  const [open, setOpen] = useState(false)
  const [sellers, setSellers] = useState<ApiUser[]>([])
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string>('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    void apiGetUsers().then((all) => setSellers(all.filter((u) => u.role === 'seller')))
  }, [open])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sellers
    return sellers.filter((s) =>
      [s.displayName, s.email, s.companyName, s.bin].some((v) => (v ?? '').toLowerCase().includes(q)),
    )
  }, [sellers, search])

  const handleAdd = async () => {
    if (!selectedId) {
      setErr('Выберите продавца из списка')
      return
    }
    setBusy(true)
    setErr(null)
    try {
      await apiAddRfqMatch(rfqId, { sellerId: selectedId, note: note.trim() })
      setOpen(false)
      setSelectedId('')
      setNote('')
      setSearch('')
      onChange()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Не удалось добавить продавца')
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <div>
        <Button variant="primary" size="sm" className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Подобрать продавца
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">Новая подборка</div>
        <button type="button" onClick={() => setOpen(false)} className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-700">
          <X className="size-4" />
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Поиск: компания, email, ФИО, БИН"
        className="mt-3 h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
      />

      <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-border bg-white">
        {filtered.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-500">Продавцы не найдены</div>
        ) : (
          filtered.map((s) => {
            const active = selectedId === s.id
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedId(s.id)}
                className={`flex w-full items-center justify-between border-b border-border px-3 py-2 text-left text-sm transition-colors last:border-b-0 ${
                  active ? 'bg-brand-blue/5' : 'hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="font-medium text-slate-900">{s.companyName || s.displayName}</div>
                  <div className="text-xs text-slate-500">{s.email}{s.bin ? ` · БИН ${s.bin}` : ''}</div>
                </div>
                {active && <ArrowRight className="size-4 text-brand-blue" />}
              </button>
            )
          })
        )}
      </div>

      <div className="mt-3">
        <div className="mb-1 text-xs font-medium text-slate-700">Комментарий продавцу (необязательно)</div>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Например: соответствует требованиям по объёму и сертификации"
          rows={2}
        />
      </div>

      {err && <div role="alert" className="mt-2 text-sm text-rose-600">{err}</div>}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="primary" size="sm" disabled={busy} onClick={() => void handleAdd()}>
          {busy ? 'Подбираем…' : 'Подобрать и открыть переписку'}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>Отмена</Button>
      </div>
    </div>
  )
}

function AdminControls({ rfq, onChange }: { rfq: Rfq; onChange: () => void }) {
  const [status, setStatus] = useState<RfqStatus>(rfq.status)
  const [adminNotes, setAdminNotes] = useState(rfq.adminNotes ?? '')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  const handleSave = async () => {
    setSaving(true)
    try {
      await apiUpdateRfq(rfq.id, { status, adminNotes })
      setSavedAt(Date.now())
      onChange()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Администрирование" subtitle="Только для админа платформы" />
      <CardContent className="grid gap-3">
        <div>
          <div className="mb-1 text-xs font-medium text-slate-700">Статус</div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as RfqStatus)}
            className="h-10 rounded-xl border border-border bg-white px-3 text-sm"
          >
            {(['open', 'in_review', 'matched', 'fulfilled', 'closed'] as RfqStatus[]).map((s) => (
              <option key={s} value={s}>{RFQ_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <div className="mb-1 text-xs font-medium text-slate-700">Внутренние заметки (видны только админам)</div>
          <Textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={3}
            placeholder="Контекст для администрации"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" size="sm" disabled={saving} onClick={() => void handleSave()}>
            {saving ? 'Сохраняем…' : 'Сохранить'}
          </Button>
          {savedAt && Date.now() - savedAt < 4000 && (
            <span className="text-sm text-emerald-700">Сохранено</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function buildSellerIntroMessage(title: string, rfqId: string): string {
  const shortId = rfqId.slice(0, 8)
  return [
    `Здравствуйте! Пишу по вашему запросу #${shortId} «${title}».`,
    'Готов обсудить условия поставки: объём, цену, сроки, Incoterms, упаковку и сертификацию.',
    'Расскажите, что для вас критично, и я подготовлю коммерческое предложение.',
  ].join('\n\n')
}
