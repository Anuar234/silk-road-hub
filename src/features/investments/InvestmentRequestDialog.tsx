import { useState } from 'react'
import { Mail, Send, X } from 'lucide-react'
import { Button } from '@shared/ui/Button'
import { Input } from '@shared/ui/Input'
import { apiCreateInvestmentRequest } from '@shared/api/investmentRequestApi'

type Props = {
  projectId: string
  projectTitle: string
  onClose: () => void
  onSent: () => void
}

export function InvestmentRequestDialog({ projectId, projectTitle, onClose, onSent }: Props) {
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setError(null)
    const trimmed = message.trim()
    if (trimmed.length < 20) {
      setError('Сообщение должно содержать не менее 20 символов.')
      return
    }
    const numericAmount = Number(amount.replace(/\s/g, ''))
    if (amount && (!Number.isFinite(numericAmount) || numericAmount < 0)) {
      setError('Некорректная сумма инвестиций.')
      return
    }

    setLoading(true)
    try {
      await apiCreateInvestmentRequest(projectId, {
        amountUsd: amount ? Math.floor(numericAmount) : 0,
        message: trimmed,
      })
      onSent()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка отправки запроса.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="invreq-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="invreq-title" className="text-lg font-semibold text-slate-900">
              Инвест-запрос
            </h2>
            <p className="mt-1 text-sm text-slate-600">По проекту: {projectTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Закрыть"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-700">Предполагаемая сумма, USD</span>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="Например, 500000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-700">Сообщение инициатору *</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Кратко опишите интерес, условия, сроки, контактную информацию."
              rows={6}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            />
            <span className="mt-1 block text-xs text-slate-400">Минимум 20 символов.</span>
          </label>

          <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            <Mail className="size-4 shrink-0 text-slate-400" />
            <span>
              Запрос будет сохранён в системе и передан инициатору проекта. Администратор платформы
              (QazTrade / Kazakh Invest) может сопровождать переговоры до подписания обязательств.
            </span>
          </div>

          {error && (
            <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-800">
              {error}
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Отмена
          </Button>
          <Button onClick={() => void submit()} disabled={loading || !message.trim()} className="gap-2">
            <Send className="size-4" />
            {loading ? 'Отправка…' : 'Отправить запрос'}
          </Button>
        </div>
      </div>
    </div>
  )
}
