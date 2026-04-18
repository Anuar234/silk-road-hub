import { useCallback, useEffect, useState } from 'react'
import { apiListAuditLog, type AuditEntry } from '@shared/api/auditApi'

const PAGE_SIZE = 100

const methodOptions = ['', 'POST', 'PUT', 'PATCH', 'DELETE'] as const

function statusTone(status: number): string {
  if (status >= 500) return 'bg-red-100 text-red-800'
  if (status >= 400) return 'bg-amber-100 text-amber-800'
  if (status >= 200) return 'bg-emerald-100 text-emerald-800'
  return 'bg-slate-100 text-slate-700'
}

function methodTone(method: string): string {
  switch (method) {
    case 'POST': return 'bg-blue-100 text-blue-800'
    case 'PUT': return 'bg-indigo-100 text-indigo-800'
    case 'PATCH': return 'bg-violet-100 text-violet-800'
    case 'DELETE': return 'bg-rose-100 text-rose-800'
    default: return 'bg-slate-100 text-slate-700'
  }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  } catch {
    return iso
  }
}

export function AdminAuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [method, setMethod] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exhausted, setExhausted] = useState(false)

  const load = useCallback(async (replace: boolean, currentOffset: number) => {
    setLoading(true)
    setError(null)
    try {
      const batch = await apiListAuditLog({
        method: method || undefined,
        userId: userId.trim() || undefined,
        limit: PAGE_SIZE,
        offset: currentOffset,
      })
      setEntries((prev) => (replace ? batch : [...prev, ...batch]))
      setExhausted(batch.length < PAGE_SIZE)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [method, userId])

  useEffect(() => {
    setOffset(0)
    void load(true, 0)
  }, [load])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Журнал действий</h1>
        <p className="mt-1 text-sm text-slate-500">
          Все изменяющие операции пользователей (POST/PUT/PATCH/DELETE). Требование ТЗ 9.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-white p-4">
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          Метод
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm"
          >
            {methodOptions.map((m) => (
              <option key={m} value={m}>{m || 'Все'}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          User ID
          <input
            type="text"
            placeholder="UUID пользователя"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="h-9 w-64 rounded-lg border border-slate-300 bg-white px-2 text-sm"
          />
        </label>
        <div className="ml-auto text-xs text-slate-500">
          Показано записей: <span className="font-semibold text-slate-900">{entries.length}</span>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Время</th>
              <th className="px-3 py-2">Метод</th>
              <th className="px-3 py-2">Путь</th>
              <th className="px-3 py-2">Статус</th>
              <th className="px-3 py-2">Пользователь</th>
              <th className="px-3 py-2">IP</th>
              <th className="px-3 py-2 text-right">мс</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-sm text-slate-500">
                  Записей нет
                </td>
              </tr>
            )}
            {entries.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50/50">
                <td className="px-3 py-2 font-mono text-xs text-slate-700">{formatTime(e.createdAt)}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${methodTone(e.method)}`}>
                    {e.method}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-xs text-slate-800">{e.path}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${statusTone(e.statusCode)}`}>
                    {e.statusCode}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-xs text-slate-600">
                  {e.userId ? e.userId.slice(0, 8) + '…' : <span className="text-slate-400">—</span>}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-slate-600">
                  {e.ipAddress ?? <span className="text-slate-400">—</span>}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs text-slate-600">{e.durationMs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          disabled={loading || exhausted}
          onClick={() => {
            const next = offset + PAGE_SIZE
            setOffset(next)
            void load(false, next)
          }}
          className="h-9 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Загрузка…' : exhausted ? 'Больше записей нет' : 'Показать ещё'}
        </button>
      </div>
    </div>
  )
}
