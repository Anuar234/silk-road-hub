import { Link } from 'react-router-dom'
import { BarChart3, FileSearch, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { Button } from '@shared/ui/Button'

export function AppInstitutionalHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Кабинет институционального пользователя</h1>
        <p className="mt-1 text-sm text-slate-600">
          Мониторинг сделок, инвестиционных проектов и экспортных потоков. Доступ предоставляется по согласованию
          с куратором проекта (АО «QazTrade»).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader title="Верификация участников" />
          <CardContent className="flex flex-col gap-3 p-5 pt-0">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <ShieldCheck className="size-4" />
              Подтверждение компаний и проектов
            </div>
            <p className="text-sm text-slate-600">
              Проверка KYC-документов экспортёров, покупателей и инициаторов инвестиционных проектов.
            </p>
            <Link to="/admin/verification">
              <Button variant="secondary" size="sm">Открыть</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Мониторинг сделок" />
          <CardContent className="flex flex-col gap-3 p-5 pt-0">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <FileSearch className="size-4" />
              Активные сделки и этапы
            </div>
            <p className="text-sm text-slate-600">
              Реестр сделок в разрезе статусов: переговоры, намерения, контракт, исполнение, завершение.
            </p>
            <Link to="/admin/deals">
              <Button variant="secondary" size="sm">Открыть реестр</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Аналитика и отчёты" />
          <CardContent className="flex flex-col gap-3 p-5 pt-0">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <BarChart3 className="size-4" />
              Экспортные и инвестиционные показатели
            </div>
            <p className="text-sm text-slate-600">
              Агрегированные данные по странам, регионам РК и отраслям. Отчёты для институциональных партнёров.
            </p>
            <Link to="/admin/statistics">
              <Button variant="secondary" size="sm">Статистика</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Расширенные инструменты институционального контроля (бизнес-миссии, KPI по партнёрам, доступ к данным
        партнёров-институтов) входят в план Этапа 2 масштабирования платформы.
      </div>
    </div>
  )
}
