import { useCallback, useEffect, useRef, useState } from 'react'
import { FileText, Paperclip } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { Button } from '@shared/ui/Button'
import { Input } from '@shared/ui/Input'
import { Badge } from '@shared/ui/Badge'
import {
  apiCreateDealDocument,
  apiListDealDocuments,
  DEAL_DOC_TYPE_LABELS,
  type DealDocument,
  type DealDocumentType,
} from '@shared/api/dealApi'
import { uploadDealFile } from '@shared/api/fileApi'

type Props = {
  dealId: string
}

const typeOptions: DealDocumentType[] = ['loi', 'mou', 'contract', 'invoice', 'certificate', 'shipping', 'other']

function formatDate(iso?: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return iso
  }
}

function typeTone(type: DealDocumentType): 'success' | 'info' | 'warning' | 'neutral' {
  if (type === 'loi' || type === 'mou') return 'success'
  if (type === 'contract') return 'info'
  if (type === 'invoice' || type === 'certificate' || type === 'shipping') return 'warning'
  return 'neutral'
}

export function DealDocumentsRemote({ dealId }: Props) {
  const [items, setItems] = useState<DealDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [docName, setDocName] = useState('')
  const [docType, setDocType] = useState<DealDocumentType>('loi')
  const [note, setNote] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await apiListDealDocuments(dealId)
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

  const attach = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) {
      setError('Выберите файл для загрузки.')
      return
    }
    const name = docName.trim() || file.name
    setUploading(true)
    setError(null)
    try {
      const uploaded = await uploadDealFile(file)
      const doc = await apiCreateDealDocument(dealId, {
        name,
        type: docType,
        fileId: uploaded.fileId,
        note: note.trim() || undefined,
      })
      setItems((prev) => [doc, ...prev])
      setDocName('')
      setNote('')
      if (fileRef.current) fileRef.current.value = ''
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось прикрепить файл')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader
        title="Документы сделки (LOI / MOU / контракт)"
        subtitle="Фиксация договорённостей по ТЗ 5.3, 5.4"
      />
      <CardContent className="space-y-4">
        <div className="divide-y divide-slate-100 rounded-xl border border-border">
          {loading && <div className="p-4 text-sm text-slate-500">Загрузка…</div>}
          {!loading && items.length === 0 && (
            <div className="p-4 text-sm text-slate-500">
              Документы не прикреплены. Добавьте LOI (письмо о намерениях) или MOU (меморандум) для фиксации договорённости.
            </div>
          )}
          {items.map((doc) => (
            <div key={doc.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
              <FileText className="size-4 text-slate-400" />
              <span className="font-medium text-slate-900">{doc.name}</span>
              <Badge tone={typeTone(doc.type)}>{DEAL_DOC_TYPE_LABELS[doc.type]}</Badge>
              <span className="text-xs text-slate-500">{formatDate(doc.uploadedAt)}</span>
              {doc.note && <span className="text-xs italic text-slate-500">{doc.note}</span>}
              {doc.fileId && (
                <a
                  href={`/api/files/${encodeURIComponent(doc.fileId)}`}
                  className="ml-auto text-xs font-medium text-brand-blue hover:underline"
                >
                  Скачать файл
                </a>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-800">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <Paperclip className="size-4 text-slate-500" />
            Прикрепить документ
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs text-slate-600">
              Тип
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as DealDocumentType)}
                className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm"
              >
                {typeOptions.map((t) => (
                  <option key={t} value={t}>{DEAL_DOC_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs text-slate-600">
              Название (опционально)
              <Input
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="Например: Letter of Intent (ru/en)"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs text-slate-600 sm:col-span-2">
              Примечание (опционально)
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Краткое описание: редакция, стороны, действие"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs text-slate-600 sm:col-span-2">
              Файл (PDF / PNG / JPG / DOCX, до 10 МБ)
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.docx"
                className="text-sm text-slate-700 file:mr-3 file:rounded-md file:border file:border-slate-300 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-50"
              />
            </label>
          </div>

          <div className="mt-3 flex items-center justify-end">
            <Button onClick={() => void attach()} disabled={uploading} className="gap-2">
              <Paperclip className="size-4" />
              {uploading ? 'Загрузка…' : 'Прикрепить'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
