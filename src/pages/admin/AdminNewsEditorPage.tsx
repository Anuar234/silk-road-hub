import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Image as ImageIcon, Save, Send, Trash2 } from 'lucide-react'
import { Button } from '@shared/ui/Button'
import { Badge } from '@shared/ui/Badge'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { Input } from '@shared/ui/Input'
import {
  apiCreateNews,
  apiDeleteNews,
  apiGetAdminNews,
  apiUpdateNews,
  NEWS_STATUS_LABELS,
  type NewsArticle,
  type NewsStatus,
} from '@shared/api/newsApi'
import { uploadDealFile } from '@shared/api/fileApi'

type Mode = 'create' | 'edit'
type Props = { mode: Mode }

function slugify(input: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i',
    й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
    у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '',
    э: 'e', ю: 'yu', я: 'ya',
  }
  return input
    .toLowerCase()
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

export function AdminNewsEditorPage({ mode }: Props) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const [article, setArticle] = useState<NewsArticle | null>(null)
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [body, setBody] = useState('')
  const [tags, setTags] = useState('')
  const [coverFileId, setCoverFileId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const load = useCallback(async () => {
    if (mode !== 'edit' || !id) return
    setLoading(true)
    setError(null)
    try {
      const a = await apiGetAdminNews(id)
      setArticle(a)
      setSlug(a.slug)
      setTitle(a.title)
      setSummary(a.summary)
      setBody(a.body)
      setTags(a.tags.join(', '))
      setCoverFileId(a.coverFileId ?? null)
      setSlugTouched(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [id, mode])

  useEffect(() => {
    void load()
  }, [load])

  const onTitleChange = (value: string) => {
    setTitle(value)
    if (mode === 'create' && !slugTouched) setSlug(slugify(value))
  }

  const parsedTags = tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  const save = async (nextStatus?: NewsStatus) => {
    setSaving(true)
    setError(null)
    setFlash(null)
    try {
      if (mode === 'create') {
        const created = await apiCreateNews({
          slug: slug || slugify(title),
          title,
          summary,
          body,
          coverFileId: coverFileId ?? undefined,
          tags: parsedTags,
          status: nextStatus ?? 'draft',
        })
        setFlash(nextStatus === 'published' ? 'Материал опубликован.' : 'Материал сохранён.')
        navigate(`/admin/news/${created.id}/edit`, { replace: true })
      } else if (article) {
        const updated = await apiUpdateNews(article.id, {
          slug,
          title,
          summary,
          body,
          coverFileId: coverFileId ?? null,
          tags: parsedTags,
          status: nextStatus ?? article.status,
        })
        setArticle(updated)
        setFlash(
          nextStatus === 'published'
            ? 'Материал опубликован.'
            : nextStatus === 'archived'
              ? 'Материал отправлен в архив.'
              : 'Изменения сохранены.',
        )
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const uploadCover = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const uploaded = await uploadDealFile(file)
      setCoverFileId(uploaded.fileId)
      if (fileRef.current) fileRef.current.value = ''
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить обложку')
    } finally {
      setUploading(false)
    }
  }

  const remove = async () => {
    if (!article) return
    if (!confirm(`Удалить материал «${article.title}»?`)) return
    try {
      await apiDeleteNews(article.id)
      navigate('/admin/news', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления')
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-slate-500">Загрузка…</div>
  }

  const currentStatus: NewsStatus = article?.status ?? 'draft'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to="/admin/news"
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="size-3.5" />К списку материалов
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            {mode === 'create' ? 'Новый материал' : 'Редактирование материала'}
          </h1>
          {article && (
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
              <Badge tone={currentStatus === 'published' ? 'success' : currentStatus === 'archived' ? 'warning' : 'neutral'}>
                {NEWS_STATUS_LABELS[currentStatus]}
              </Badge>
              <span>ID: <span className="font-mono">{article.id.slice(0, 8)}</span></span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {article && currentStatus === 'draft' && (
            <Button size="sm" variant="secondary" onClick={() => void save('published')} disabled={saving} className="gap-1">
              <Send className="size-3.5" />
              Опубликовать
            </Button>
          )}
          {article && currentStatus === 'published' && (
            <Button size="sm" variant="secondary" onClick={() => void save('archived')} disabled={saving} className="gap-1">
              В архив
            </Button>
          )}
          {article && currentStatus === 'archived' && (
            <Button size="sm" variant="secondary" onClick={() => void save('published')} disabled={saving} className="gap-1">
              <Send className="size-3.5" />
              Вернуть к публикации
            </Button>
          )}
          <Button size="sm" onClick={() => void save()} disabled={saving || !title.trim() || !slug.trim()} className="gap-1">
            <Save className="size-3.5" />
            {saving ? 'Сохранение…' : 'Сохранить'}
          </Button>
          {article && (
            <Button size="sm" variant="secondary" onClick={() => void remove()} className="gap-1 text-rose-600">
              <Trash2 className="size-3.5" />
              Удалить
            </Button>
          )}
        </div>
      </div>

      {flash && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <CheckCircle2 className="mr-1 inline size-4" />
          {flash}
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-3">
          <Card>
            <CardHeader title="Основное" />
            <CardContent className="space-y-3">
              <label className="flex flex-col gap-1 text-xs text-slate-600">
                Заголовок *
                <Input value={title} onChange={(e) => onTitleChange(e.target.value)} placeholder="Новости экспорта зерна…" />
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-600">
                Slug (URL) *
                <Input
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value)
                    setSlugTouched(true)
                  }}
                  placeholder="export-grain-china-2026"
                />
                <span className="text-xs text-slate-400">
                  Публичный URL: /analytics/<span className="font-mono">{slug || '…'}</span>
                </span>
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-600">
                Краткое описание
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={2}
                  placeholder="Аннотация для списка и карточки"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                />
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Текст материала" subtitle="Markdown / plain text. Рендеринг пилотный, HTML из ввода экранируется." />
            <CardContent>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={18}
                placeholder="Полный текст статьи…"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <Card>
            <CardHeader title="Обложка" />
            <CardContent className="space-y-2">
              {coverFileId ? (
                <div className="space-y-2">
                  <div className="overflow-hidden rounded-lg border border-border bg-slate-50">
                    <img
                      src={`/api/files/${encodeURIComponent(coverFileId)}`}
                      alt="Обложка"
                      className="h-40 w-full object-cover"
                    />
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => setCoverFileId(null)} className="gap-1">
                    <Trash2 className="size-3.5" />
                    Убрать
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ImageIcon className="size-3.5" />
                    Обложка не прикреплена
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    className="w-full text-xs text-slate-700 file:mr-2 file:rounded file:border file:border-slate-300 file:bg-white file:px-2 file:py-1 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-50"
                  />
                  <Button size="sm" onClick={() => void uploadCover()} disabled={uploading} className="gap-1">
                    {uploading ? 'Загрузка…' : 'Загрузить'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Тэги" />
            <CardContent>
              <label className="flex flex-col gap-1 text-xs text-slate-600">
                Через запятую
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="экспорт, Китай, зерно"
                />
              </label>
              {parsedTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {parsedTags.map((t) => (
                    <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
