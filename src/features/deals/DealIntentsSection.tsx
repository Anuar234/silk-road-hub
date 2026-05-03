import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, FileSignature, Plus, X, XCircle } from 'lucide-react'
import { Badge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { Input } from '@shared/ui/Input'
import { Textarea } from '@shared/ui/Textarea'
import {
  apiCancelIntent,
  apiCreateIntent,
  apiListIntents,
  apiSignIntent,
  INTENT_KIND_LABELS,
  type DealIntent,
  type IntentKind,
} from '@shared/api/dealIntentApi'
import { updateDealStatus, getDealById } from '@features/deals/dealData'
import { useAuth } from '@features/auth/auth'

type Props = {
  dealId: string
  /** True for buyer/seller participants of the deal — they can create/sign. */
  canParticipate: boolean
  /** Pass 'buyer' / 'seller' to disambiguate side for admin signing. */
  signAs?: 'buyer' | 'seller'
}

/**
 * UI for ТЗ §5.3 «фиксация договорённостей (LOI, MOU)». Lists intents for the
 * deal, lets either side draft a new one and lets each side sign their half.
 * When both sides have signed, the linked deal is transitioned to phase
 * 'intent_fixed' in the (still in-memory) deal store.
 */
export function DealIntentsSection({ dealId, canParticipate, signAs }: Props) {
  const auth = useAuth()
  const [intents, setIntents] = useState<DealIntent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [draftKind, setDraftKind] = useState<IntentKind>('loi')
  const [draftTitle, setDraftTitle] = useState('')
  const [draftSummary, setDraftSummary] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void apiListIntents(dealId)
      .then((list) => {
        if (!cancelled) setIntents(list)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Не удалось загрузить договорённости.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [dealId])

  const sideForSign: 'buyer' | 'seller' | undefined = useMemo(() => {
    if (signAs) return signAs
    if (auth.role === 'buyer') return 'buyer'
    if (auth.role === 'seller') return 'seller'
    return undefined
  }, [signAs, auth.role])

  const handleCreate = async () => {
    if (!draftTitle.trim()) {
      setError('Укажите заголовок договорённости.')
      return
    }
    setError(null)
    try {
      const created = await apiCreateIntent(dealId, {
        kind: draftKind,
        title: draftTitle.trim(),
        summary: draftSummary.trim(),
      })
      setIntents((prev) => [created, ...prev])
      setDraftTitle('')
      setDraftSummary('')
      setDraftKind('loi')
      setCreating(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать договорённость.')
    }
  }

  const promoteDealIfNeeded = (updated: DealIntent) => {
    if (updated.status !== 'signed') return
    const deal = getDealById(updated.dealId)
    if (!deal) return
    // Don't downgrade contracts/in-execution back to intent_fixed.
    const earlyPhases = [
      'new',
      'under_review',
      'waiting_buyer_info',
      'waiting_seller_info',
      'documents_preparation',
      'negotiating',
    ]
    if (!earlyPhases.includes(deal.status)) return
    updateDealStatus(
      deal.id,
      'intent_fixed',
      auth.displayName ?? auth.email ?? 'Участник',
      `${INTENT_KIND_LABELS[updated.kind].split(' · ')[0]} «${updated.title}» подписан обеими сторонами`,
      sideForSign ?? 'admin',
    )
  }

  const handleSign = async (intentId: string) => {
    setBusyId(intentId)
    setError(null)
    try {
      const updated = await apiSignIntent(intentId, sideForSign)
      setIntents((prev) => prev.map((i) => (i.id === intentId ? updated : i)))
      promoteDealIfNeeded(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось подписать.')
    } finally {
      setBusyId(null)
    }
  }

  const handleCancel = async (intentId: string) => {
    setBusyId(intentId)
    setError(null)
    try {
      const updated = await apiCancelIntent(intentId)
      setIntents((prev) => prev.map((i) => (i.id === intentId ? updated : i)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось отменить.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Card>
      <CardHeader
        title="Договорённости (LOI / MOU)"
        subtitle="Фиксация намерений до подписания контракта (ТЗ §5.3)"
      />
      <CardContent className="grid gap-3">
        {error && (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        {loading && <div className="text-sm text-slate-500">Загрузка…</div>}

        {!loading && intents.length === 0 && !creating && (
          <div className="rounded-xl border border-dashed border-border bg-slate-50 px-4 py-3 text-sm text-slate-600">
            По этой сделке ещё нет зафиксированных договорённостей. Создайте LOI или MOU, когда стороны
            согласовали ключевые условия.
          </div>
        )}

        {intents.map((intent) => (
          <IntentCard
            key={intent.id}
            intent={intent}
            canParticipate={canParticipate}
            sideForSign={sideForSign}
            busy={busyId === intent.id}
            onSign={() => void handleSign(intent.id)}
            onCancel={() => void handleCancel(intent.id)}
          />
        ))}

        {creating ? (
          <div className="rounded-2xl border border-border bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">Новая договорённость</div>
            <div className="mt-3 grid gap-3">
              <div className="flex flex-wrap gap-2">
                <KindButton active={draftKind === 'loi'} onClick={() => setDraftKind('loi')}>
                  LOI
                </KindButton>
                <KindButton active={draftKind === 'mou'} onClick={() => setDraftKind('mou')}>
                  MOU
                </KindButton>
              </div>
              <Input
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Заголовок (например: «LOI о поставке 15 000 ед. мёда в Германию»)"
              />
              <Textarea
                value={draftSummary}
                onChange={(e) => setDraftSummary(e.target.value)}
                placeholder="Краткое содержание: предмет, объём, сроки, ключевые условия"
                rows={4}
              />
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" size="sm" onClick={() => void handleCreate()}>
                  Создать
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setCreating(false)
                    setDraftTitle('')
                    setDraftSummary('')
                  }}
                >
                  Отмена
                </Button>
              </div>
            </div>
          </div>
        ) : canParticipate ? (
          <div>
            <Button variant="secondary" size="sm" className="gap-2" onClick={() => setCreating(true)}>
              <Plus className="size-4" />
              Зафиксировать договорённость
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function IntentCard({
  intent,
  canParticipate,
  sideForSign,
  busy,
  onSign,
  onCancel,
}: {
  intent: DealIntent
  canParticipate: boolean
  sideForSign: 'buyer' | 'seller' | undefined
  busy: boolean
  onSign: () => void
  onCancel: () => void
}) {
  const isSigned = intent.status === 'signed'
  const isCancelled = intent.status === 'cancelled'
  const mySideAlreadySigned =
    (sideForSign === 'buyer' && intent.signedByBuyer) || (sideForSign === 'seller' && intent.signedBySeller)
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <FileSignature className="size-4 text-brand-blue" />
            <span className="text-sm font-semibold uppercase tracking-wide text-slate-700">
              {intent.kind.toUpperCase()}
            </span>
            {isSigned ? (
              <Badge tone="success">Подписан</Badge>
            ) : isCancelled ? (
              <Badge tone="neutral">Отменён</Badge>
            ) : (
              <Badge tone="warning">Черновик</Badge>
            )}
          </div>
          <div className="mt-1 text-base font-semibold text-slate-900">{intent.title}</div>
          {intent.summary && <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{intent.summary}</p>}
        </div>
        <div className="text-right text-xs text-slate-500">
          <div>Создан: {new Date(intent.createdAt).toLocaleDateString('ru-RU')}</div>
          {intent.signedAt && <div>Подписан: {new Date(intent.signedAt).toLocaleDateString('ru-RU')}</div>}
          {intent.cancelledAt && <div>Отменён: {new Date(intent.cancelledAt).toLocaleDateString('ru-RU')}</div>}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
        <SignBadge side="Покупатель" signed={intent.signedByBuyer} />
        <SignBadge side="Продавец" signed={intent.signedBySeller} />
      </div>

      {!isSigned && !isCancelled && canParticipate && sideForSign && !mySideAlreadySigned && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={onSign} disabled={busy} className="gap-1">
            <CheckCircle2 className="size-4" />
            Подписать как {sideForSign === 'buyer' ? 'покупатель' : 'продавец'}
          </Button>
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={busy} className="gap-1 text-rose-600 border-rose-200 hover:bg-rose-50">
            <X className="size-4" />
            Отменить
          </Button>
        </div>
      )}

      {!isSigned && !isCancelled && mySideAlreadySigned && (
        <div className="mt-3 text-xs text-slate-500">
          Вы уже подписали со своей стороны. Ждём подпись второй стороны.
        </div>
      )}
    </div>
  )
}

function SignBadge({ side, signed }: { side: string; signed: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
        signed ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
      }`}
    >
      {signed ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
      {side}: {signed ? 'подписал' : 'не подписал'}
    </span>
  )
}

function KindButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? 'bg-brand-blue text-white' : 'bg-white text-slate-700 ring-1 ring-border hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  )
}
