import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, Building2, Clock, ShieldCheck } from 'lucide-react'
import { Button } from '@shared/ui/Button'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { apiGetInvestments } from '@shared/api/investmentApi'
import { apiGetUsers } from '@shared/api/usersApi'
import { dealPhase, getAllDeals, type DealPhase } from '@features/deals/dealData'
import { useT } from '@features/i18n/i18n'
import { usePlatformDataVersion } from '@shared/hooks/usePlatformDataVersion'
import type { ApiUser } from '@shared/api/authApi'
import type { InvestmentProject } from '@features/investments/investmentData'

/**
 * Landing screen for institutional users (QazTrade and partners). Pulls real
 * counts from /api/users, /api/investments and the in-memory deal store and
 * surfaces direct entry points to the institutional cabinet sections.
 */
export function AppInstitutionalHomePage() {
  const version = usePlatformDataVersion()
  const [users, setUsers] = useState<ApiUser[]>([])
  const [projects, setProjects] = useState<InvestmentProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const allDeals = useMemo(() => getAllDeals(), [version])

  useEffect(() => {
    let cancelled = false
    Promise.all([apiGetUsers(), apiGetInvestments()])
      .then(([userList, projectList]) => {
        if (cancelled) return
        setUsers(userList)
        setProjects(projectList)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Не удалось загрузить агрегаты.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const pendingUsers = useMemo(() => users.filter((u) => u.verificationStatus === 'pending').length, [users])
  const verifiedUsers = useMemo(() => users.filter((u) => u.verificationStatus === 'verified').length, [users])

  const dealPhaseCounts = useMemo(() => {
    const out: Record<DealPhase, number> = {
      negotiation: 0,
      intent_fixed: 0,
      contract_signed: 0,
      in_execution: 0,
      completed: 0,
      cancelled: 0,
    }
    for (const d of allDeals) out[dealPhase(d.status)] += 1
    return out
  }, [allDeals])

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{useT()('home.institutional.title', 'Кабинет институционального пользователя')}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Мониторинг и верификация для QazTrade, KazakhExport, Kazakh Invest и партнёров. Доступ предоставляется
          администратором платформы.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Ожидают верификации" value={loading ? '—' : pendingUsers} highlight tone="amber" />
        <KpiCard label="Верифицировано" value={loading ? '—' : verifiedUsers} tone="emerald" />
        <KpiCard label="Активные сделки" value={allDeals.length - dealPhaseCounts.cancelled - dealPhaseCounts.completed} tone="blue" />
        <KpiCard label="Инвестпроектов" value={loading ? '—' : projects.length} tone="violet" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Очередь верификации" subtitle="Подтверждение KYC компаний-участников" />
          <CardContent className="grid gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <ShieldCheck className="size-4 text-amber-600" />
              {pendingUsers} компаний ожидают проверки документов
            </div>
            <Link to="/app/institutional/verification">
              <Button variant="primary" size="sm" className="gap-2">
                Открыть очередь
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Сделки в работе" subtitle="Пятиэтапный жизненный цикл (ТЗ §5.3)" />
          <CardContent className="grid gap-3">
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
              <PhaseRow label="Переговоры" value={dealPhaseCounts.negotiation} />
              <PhaseRow label="Намерения зафиксированы" value={dealPhaseCounts.intent_fixed} />
              <PhaseRow label="Контракт подписан" value={dealPhaseCounts.contract_signed} />
              <PhaseRow label="В процессе исполнения" value={dealPhaseCounts.in_execution} />
              <PhaseRow label="Завершены" value={dealPhaseCounts.completed} />
              <PhaseRow label="Отменены" value={dealPhaseCounts.cancelled} />
            </div>
            <Link to="/app/institutional/deals">
              <Button variant="secondary" size="sm" className="gap-2">
                Реестр сделок
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Инвестиционные проекты" subtitle="Kazakh Invest, ГЧП, частные" />
          <CardContent className="grid gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Building2 className="size-4 text-violet-600" />
              {loading ? '—' : projects.length} проектов в каталоге
            </div>
            <Link to="/app/institutional/investments">
              <Button variant="secondary" size="sm" className="gap-2">
                Открыть мониторинг
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Аналитика и отчёты" subtitle="Агрегаты для институциональных партнёров" />
          <CardContent className="grid gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <BarChart3 className="size-4 text-brand-blue" />
              География рынков, экспортная активность регионов РК
            </div>
            <Link to="/app/institutional/reports">
              <Button variant="secondary" size="sm" className="gap-2">
                Посмотреть отчёты
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <Clock className="mr-2 inline size-4 align-text-bottom" />
        Расширенные инструменты — экспорт KPI в xlsx, доступ к данным KazakhExport API, индивидуальные отчёты — в плане Этапа 2.
      </div>
    </div>
  )
}

function PhaseRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2">
      <span className="text-slate-600">{label}</span>
      <span className="font-mono font-semibold text-slate-900">{value}</span>
    </div>
  )
}

function KpiCard({
  label,
  value,
  tone = 'blue',
  highlight,
}: {
  label: string
  value: string | number
  tone?: 'blue' | 'amber' | 'emerald' | 'violet'
  highlight?: boolean
}) {
  const toneBg =
    tone === 'amber'
      ? 'bg-amber-50 border-amber-200 text-amber-900'
      : tone === 'emerald'
        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
        : tone === 'violet'
          ? 'bg-violet-50 border-violet-200 text-violet-900'
          : 'bg-brand-blue/5 border-brand-blue/20 text-slate-900'
  return (
    <div className={`rounded-2xl border ${toneBg} px-5 py-4 ${highlight ? 'ring-2 ring-amber-400/40' : ''}`}>
      <div className="text-3xl font-bold leading-tight">{value}</div>
      <div className="mt-1 text-sm">{label}</div>
    </div>
  )
}
