import { apiGetCsrfToken } from '@shared/api/authApi'

export type UploadedFilePayload = {
  fileId: string
  filename: string
  size: number
  mime: string
  downloadUrl: string
}

export async function uploadDealFile(file: File): Promise<UploadedFilePayload> {
  const csrfToken = await apiGetCsrfToken()
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch('/api/files', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'X-CSRF-Token': csrfToken,
    },
    body: formData,
  })
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { error?: string }
    if (payload.error === 'FILE_TOO_LARGE') {
      throw new Error('Файл слишком большой. Максимум 10 МБ.')
    }
    if (payload.error === 'UNSUPPORTED_FILE_TYPE') {
      throw new Error('Неподдерживаемый тип файла. Разрешены PDF, PNG, JPG и DOCX.')
    }
    throw new Error('Не удалось загрузить файл на сервер.')
  }
  const body = (await res.json()) as { ok: true; data: UploadedFilePayload }
  return body.data
}
