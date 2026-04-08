import { useState } from 'react'
import { FileUp, CheckCircle, Clock } from 'lucide-react'
import { useAuth } from '../auth/auth'
import { Container } from '../components/layout/Container'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { uploadDealFile } from '../adapters/fileApi'
import { apiAddUserDoc } from '../adapters/usersApi'

export function VerificationPage() {
  const auth = useAuth()
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; fileId: string }[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !auth.userId) return

    setUploading(true)
    setError(null)
    try {
      const result = await uploadDealFile(file)
      await apiAddUserDoc(auth.userId, result.fileId)
      setUploadedFiles((prev) => [...prev, { name: result.filename, fileId: result.fileId }])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <Container className="py-12">
      <div className="mx-auto grid max-w-xl gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Верификация</h1>
          <p className="mt-2 text-base text-slate-600">
            Загрузите документы компании для прохождения проверки
          </p>
        </div>

        <Card>
          <CardHeader title="Статус верификации" />
          <CardContent>
            <div className="flex items-center gap-3">
              {auth.verified ? (
                <>
                  <CheckCircle className="size-5 text-emerald-600" />
                  <Badge tone="success">Верифицирован</Badge>
                </>
              ) : (
                <>
                  <Clock className="size-5 text-amber-600" />
                  <Badge tone="warning">Ожидает проверки</Badge>
                </>
              )}
            </div>
            {!auth.verified && (
              <p className="mt-3 text-sm text-slate-600">
                Загрузите учредительные документы, свидетельство о регистрации или иные подтверждающие документы. После проверки администратор изменит ваш статус.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Документы компании" />
          <CardContent className="grid gap-4">
            <div className="text-sm text-slate-600">
              Допустимые форматы: PDF, PNG, JPG, DOCX. Максимум 10 МБ на файл.
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                {uploadedFiles.map((f) => (
                  <div key={f.fileId} className="flex items-center gap-2 rounded-lg border border-border bg-slate-50 px-3 py-2 text-sm">
                    <FileUp className="size-4 text-slate-500" />
                    <span className="text-slate-700">{f.name}</span>
                    <Badge tone="success" className="ml-auto">Загружен</Badge>
                  </div>
                ))}
              </div>
            )}

            <label className="relative">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.docx"
                onChange={(e) => void handleFileUpload(e)}
                disabled={uploading}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              <Button as="button" variant="secondary" className="gap-2 pointer-events-none" tabIndex={-1}>
                <FileUp className="size-4" />
                {uploading ? 'Загрузка...' : 'Выбрать файл'}
              </Button>
            </label>

            {error && <div role="alert" className="text-sm text-red-600">{error}</div>}
          </CardContent>
        </Card>

        {!auth.verified && uploadedFiles.length > 0 && (
          <div className="rounded-2xl border border-border bg-emerald-50 p-5 text-sm text-emerald-800">
            Документы загружены. Администратор рассмотрит вашу заявку и обновит статус верификации.
          </div>
        )}
      </div>
    </Container>
  )
}
