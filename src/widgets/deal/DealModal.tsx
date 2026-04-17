import { useState } from 'react'
import { Button } from '@shared/ui/Button'
import { Input } from '@shared/ui/Input'
import { Textarea } from '@shared/ui/Textarea'
import { createDeal } from '@features/deals/dealData'
import { addSystemMessage, linkThreadToDeal } from '@features/messaging/messagingData'
import type { Product } from '@mocks/mockData'

type DealModalProps = {
  product: Product
  buyerId: string
  threadId: string | null
  onClose: () => void
  onSuccess: (dealId: string) => void
}

export function DealModal({ product, buyerId, threadId, onClose, onSuccess }: DealModalProps) {
  const [quantity, setQuantity] = useState('')
  const [destinationCountry, setDestinationCountry] = useState('')
  const [targetTimeline, setTargetTimeline] = useState('')
  const [incoterms, setIncoterms] = useState(product.incoterms || '')
  const [buyerComment, setBuyerComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!quantity.trim() || !destinationCountry.trim() || !targetTimeline.trim()) {
      setError('Заполните объём/количество, страну назначения и сроки.')
      return
    }
    const deal = createDeal(buyerId, product.seller.id, product.id, threadId, {
      quantity: quantity.trim(),
      destinationCountry: destinationCountry.trim(),
      targetTimeline: targetTimeline.trim(),
      incoterms: incoterms.trim(),
      buyerComment: buyerComment.trim(),
    })
    if (threadId) {
      addSystemMessage(threadId, `Создана сделка #${deal.id} — ${product.name}, ${quantity.trim()} → ${destinationCountry.trim()}`)
      linkThreadToDeal(threadId, deal.id)
    }
    setSubmitted(true)
    onSuccess(deal.id)
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-slate-900">Сделка оформлена</h3>
        <p className="mt-2 text-sm text-slate-600">
          Заявка передана администрации. Менеджер свяжется с вами после проверки деталей.
        </p>
        <div className="mt-6 flex justify-end">
          <Button variant="primary" onClick={onClose}>Закрыть</Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-white p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-slate-900">Оформить сделку</h3>
      <p className="mt-1 text-sm text-slate-600">
        Товар: {product.name}. Администрация проверит заявку и свяжется с обеими сторонами.
      </p>
      <div className="mt-6 grid gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Объём / количество *</label>
          <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Напр.: 1 контейнер, 10 000 шт." required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Страна назначения *</label>
          <Input value={destinationCountry} onChange={(e) => setDestinationCountry(e.target.value)} placeholder="Напр.: Германия, Берлин" required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Желаемые сроки *</label>
          <Input value={targetTimeline} onChange={(e) => setTargetTimeline(e.target.value)} placeholder="Напр.: до конца Q2 2025" required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Условия поставки (Incoterms)</label>
          <Input value={incoterms} onChange={(e) => setIncoterms(e.target.value)} placeholder="Напр.: FOB Алматы, CIF Гамбург" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Комментарий</label>
          <Textarea value={buyerComment} onChange={(e) => setBuyerComment(e.target.value)} placeholder="Дополнительные пожелания или условия" rows={3} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="submit" variant="primary">Оформить сделку</Button>
        <Button type="button" variant="secondary" onClick={onClose}>Отмена</Button>
      </div>
    </form>
  )
}
