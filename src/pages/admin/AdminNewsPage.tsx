import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, FilePlus, Inbox, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@shared/ui/Button'
import { Badge } from '@shared/ui/Badge'
import { Card, CardContent } from '@shared/ui/Card'
import {
  apiDeleteNews,
  apiListAdminNews,
  NEWS_STATUS_LABELS,
  type NewsArticle,
  type NewsStatus,
} from '@shared/api/newsApi'

function statusTone(s: NewsStatus): 'neutral' | 'success' | 'warning' {
  if (s === 'published') return 'success'
  if (s === 'archived') return 'warning'
  return 'neutral'
}

function formatDate(iso?: string): string {
  if (!iso) return '—'
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

const statusFilters: { value: NewsStatus | ''; label: string }[] = [
  { value: '', label: 'Все' },
  { value: 'draft', label: 'Черновики' },
  { value: 'published', label: 'Опубликованные' },
  { value: 'archived', label: 'Архив' },
]

export function AdminNewsPage() {
  const [items, setItems] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<NewsStatus | ''>('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiListAdminNews({ status: status || undefined })
      setItems(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    void load()
  }, [load])

  const remove = async (article: NewsArticle) => {
    if (!confirm(`Удалить материал «${article.title}»? Действие необратимо.`)) return
    try {
      await apiDeleteNews(article.id)
      setItems((prev) => prev.filter((x) => x.id !== article.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Новости и аналитика</h1>
          <p className="mt-1 text-sm text-slate-600">
            Редакторский модуль: материалы партнёров, маркет-обзоры, объявления платформы (ТЗ 5.8).
          </p>
        </div>
        <Link to="/admin/news/new">
          <Button size="sm" className="gap-2">
            <FilePlus className="size-4" />
            Новый материал
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-white p-3">
        <span className="text-xs text-slate-500">Фильтр по статусу:</span>
        {statusFilters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatus(f.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              status === f.value
                ? 'bg-brand-blue text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      {loading && <div className="text-sm text-slate-500">Загрузка…</div>}

      {!loading && items.length === 0 && !error && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Inbox className="size-8 text-slate-400" />
            <div className="text-sm font-medium text-slate-700">Материалов пока нет</div>
            <div className="max-w-sm text-sm text-slate-500">
              Создайте первый материал — он появится в публичной ленте «Аналитика и новости» после публикации.
            </div>
            <Link to="/admin/news/new" className="text-sm font-medium text-brand-blue hover:underline">
              Создать материал
            </Link>
          </CardContent>
        </Card>
      )}

      {items.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Заголовок</th>
                <th className="px-3 py-2">Slug</th>
                <th className="px-3 py-2">Статус</th>
                <th className="px-3 py-2">Тэги</th>
                <th className="px-3 py-2">Публикация</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/50">
                  <td className="px-3 py-2 font-medium text-slate-900">{a.title}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-600">{a.slug}</td>
                  <td className="px-3 py-2">
                    <Badge tone={statusTone(a.status)}>{NEWS_STATUS_LABELS[a.status]}</Badge>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600">
                    {a.tags.length > 0 ? a.tags.slice(0, 3).join(', ') : '—'}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">{formatDate(a.publishedAt)}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      {a.status === 'published' && (
                        <Link
                          to={`/analytics/${encodeURIComponent(a.slug)}`}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                          title="Открыть публично"
                        >
                          <Eye className="size-4" />
                        </Link>
                      )}
                      <Link
                        to={`/admin/news/${a.id}/edit`}
                        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        title="Редактировать"
                      >
                        <Pencil className="size-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => void remove(a)}
                        className="rounded-md p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                        title="Удалить"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
