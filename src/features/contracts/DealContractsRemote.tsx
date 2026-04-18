import { useCallback, useEffect, useRef, useState } from 'react'
import { FileSignature, Paperclip, Plus, Scale } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { Button } from '@shared/ui/Button'
import { Badge } from '@shared/ui/Badge'
import {
  apiCreateContract,
  apiGetContracts,
  apiUpdateContract,
} from '@shared/api/contractApi'
import { uploadDealFile } from '@shared/api/fileApi'
import type {
  ApplicableLaw,
  Contract,
  ContractStatus,
  ContractTemplateType,
} from '@features/contracts/contractData'

type Props = {
  dealId: string
}

const templateLabels: Record<ContractTemplateType, string> = {
  export: 'Экспортный контракт',
  investment: 'Инвестиционный контракт',
  framework: 'Рамочное соглашение',
}

const lawLabels: Record<ApplicableLaw, string> = {
  KZ: 'Право РК',
  EN: 'Право Англии',
  UNCITRAL: 'ЮНСИТРАЛ',
  ICC: 'Правила МТП (ICC)',
}

const statusLabels: Record<ContractStatus, string> = {
  draft: 'Черновик',
  negotiation: 'Переговоры',
  signed: 'Подписан',
  active: 'В исполнении',
  completed: 'Завершён',
  terminated: 'Расторгнут',
}

function statusTone(status: ContractStatus): 'neutral' | 'info' | 'success' | 'warning' {
  switch (status) {
    case 'draft':
      return 'neutral'
    case 'negotiation':
      return 'info'
    case 'signed':
    case 'active':
      return 'success'
    case 'completed':
      return 'success'
    case 'terminated':
      return 'warning'
  }
}

// Allowed forward transitions for status switcher (simple linear flow for the pilot).
const nextStatuses: Record<ContractStatus, ContractStatus[]> = {
  draft: ['negotiation', 'terminated'],
  negotiation: ['signed', 'terminated'],
  signed: ['active', 'terminated'],
  active: ['completed', 'terminated'],
  completed: [],
  terminated: [],
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export function DealContractsRemote({ dealId }: Props) {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showNew, setShowNew] = useState(false)
  const [templateType, setTemplateType] = useState<ContractTemplateType>('export')
  const [applicableLaw, setApplicableLaw] = useState<ApplicableLaw>('KZ')
  const [notes, setNotes] = useState('')
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await apiGetContracts(dealId)
      setContracts(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [dealId])

  useEffect(() => {
    void load()
  }, [load])

  const createContract = async () => {
    setCreating(true)
    setError(null)
    try {
      const created = await apiCreateContract({
        dealId,
        templateType,
        applicableLaw,
        notes: notes.trim() || undefined,
      })
      setContracts((prev) => [created, ...prev])
      setNotes('')
      setShowNew(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать контракт')
    } finally {
      setCreating(false)
    }
  }

  const changeStatus = async (contract: Contract, next: ContractStatus) => {
    setError(null)
    try {
      const updated = await apiUpdateContract(contract.id, { status: next })
      setContracts((prev) => prev.map((c) => (c.id === contract.id ? updated : c)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось обновить статус')
    }
  }

  return (
    <Card>
      <CardHeader
        title="Контракты сделки"
        subtitle="Шаблоны, применимое право, подписанные документы, сроки (ТЗ 5.4)"
      />
      <CardContent className="space-y-4">
        {error && (
          <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-800">
            {error}
          </div>
        )}

        {loading && <div className="text-sm text-slate-500">Загрузка…</div>}

        {!loading && contracts.length === 0 && !showNew && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-5 text-center text-sm text-slate-600">
            Контрактов по сделке пока нет. Создайте первый контракт на основе типового шаблона.
          </div>
        )}

        {contracts.length > 0 && (
          <div className="space-y-3">
            {contracts.map((c) => (
              <ContractRow
                key={c.id}
                contract={c}
                onStatusChange={(next) => changeStatus(c, next)}
                onSignedUploaded={(updated) =>
                  setContracts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
                }
                onError={(msg) => setError(msg)}
              />
            ))}
          </div>
        )}

        {showNew ? (
          <div className="space-y-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <FileSignature className="size-4 text-slate-500" />
              Новый контракт
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs text-slate-600">
                Тип шаблона
                <select
                  value={templateType}
                  onChange={(e) => setTemplateType(e.target.value as ContractTemplateType)}
                  className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm"
                >
                  {(Object.keys(templateLabels) as ContractTemplateType[]).map((t) => (
                    <option key={t} value={t}>{templateLabels[t]}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-600">
                Применимое право
                <select
                  value={applicableLaw}
                  onChange={(e) => setApplicableLaw(e.target.value as ApplicableLaw)}
                  className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm"
                >
                  {(Object.keys(lawLabels) as ApplicableLaw[]).map((l) => (
                    <option key={l} value={l}>{lawLabels[l]}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-600 sm:col-span-2">
                Примечания
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Предмет, особые условия, ответственные контакты"
                  rows={3}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm"
                />
              </label>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowNew(false)} disabled={creating}>
                Отмена
              </Button>
              <Button size="sm" onClick={() => void createContract()} disabled={creating} className="gap-2">
                <Plus className="size-4" />
                {creating ? 'Создание…' : 'Создать'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => setShowNew(true)} className="gap-2">
              <Plus className="size-4" />
              Новый контракт
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

type RowProps = {
  contract: Contract
  onStatusChange: (next: ContractStatus) => Promise<void>
  onSignedUploaded: (updated: Contract) => void
  onError: (msg: string) => void
}

function ContractRow({ contract, onStatusChange, onSignedUploaded, onError }: RowProps) {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const allowedNext = nextStatuses[contract.status]

  const attachSigned = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) {
      onError('Выберите файл подписанного контракта.')
      return
    }
    setUploading(true)
    try {
      const uploaded = await uploadDealFile(file)
      const updated = await apiUpdateContract(contract.id, { signedDocFileId: uploaded.fileId })
      onSignedUploaded(updated)
      if (fileRef.current) fileRef.current.value = ''
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Ошибка загрузки подписанного документа')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Scale className="size-4 text-slate-500" />
        <span className="font-semibold text-slate-900">{templateLabels[contract.templateType]}</span>
        <Badge tone="neutral">{lawLabels[contract.applicableLaw]}</Badge>
        <Badge tone={statusTone(contract.status)}>{statusLabels[contract.status]}</Badge>
        <span className="ml-auto text-xs text-slate-500">Создан {formatDate(contract.createdAt)}</span>
      </div>

      {contract.notes && <p className="mt-2 text-sm text-slate-700">{contract.notes}</p>}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <div className="text-xs font-medium text-slate-500">Подписанный документ</div>
          {contract.signedDocFileId ? (
            <a
              href={`/api/files/${encodeURIComponent(contract.signedDocFileId)}`}
              className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-brand-blue hover:underline"
            >
              <Paperclip className="size-4" />
              Скачать подписанный
            </a>
          ) : (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.docx"
                className="max-w-[220px] text-xs text-slate-700 file:mr-2 file:rounded file:border file:border-slate-300 file:bg-white file:px-2 file:py-1 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-50"
              />
              <Button size="sm" onClick={() => void attachSigned()} disabled={uploading} className="gap-1">
                <Paperclip className="size-3.5" />
                {uploading ? 'Загрузка…' : 'Прикрепить'}
              </Button>
            </div>
          )}
        </div>

        <div>
          <div className="text-xs font-medium text-slate-500">Смена статуса</div>
          {allowedNext.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-2">
              {allowedNext.map((next) => (
                <Button
                  key={next}
                  size="sm"
                  variant={next === 'terminated' ? 'secondary' : 'primary'}
                  onClick={() => void onStatusChange(next)}
                >
                  → {statusLabels[next]}
                </Button>
              ))}
            </div>
          ) : (
            <div className="mt-1 text-xs text-slate-500">Статус финальный, переходов нет.</div>
          )}
        </div>
      </div>
    </div>
  )
}
