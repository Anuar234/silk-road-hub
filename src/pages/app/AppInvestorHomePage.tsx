import { Link } from 'react-router-dom'
import { ArrowRight, Building2, FileSearch, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'
import { Button } from '@shared/ui/Button'

export function AppInvestorHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Кабинет инвестора</h1>
        <p className="mt-1 text-sm text-slate-600">
          Размещайте инвестиционные проекты, изучайте каталог частных и государственных инициатив, направляйте инвест-запросы.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader title="Каталог проектов" />
          <CardContent className="flex flex-col gap-3 p-5 pt-0">
            <p className="text-sm text-slate-600">
              Инвестпроекты Kazakh Invest, ГЧП и частные инициативы с верифицированными инициаторами.
            </p>
            <Link to="/investments">
              <Button variant="secondary" size="sm" className="gap-2">
                Перейти
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Мои инвест-запросы" />
          <CardContent className="flex flex-col gap-3 p-5 pt-0">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <FileSearch className="size-4" />
              Отслеживание стадий договорённостей
            </div>
            <p className="text-sm text-slate-600">
              Список ваших запросов инициаторам проектов и статусы рассмотрения (новый / на рассмотрении / принят / отклонён).
            </p>
            <Link to="/app/investment-requests">
              <Button variant="secondary" size="sm" className="gap-2">
                Открыть список
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Разместить проект" />
          <CardContent className="flex flex-col gap-3 p-5 pt-0">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Building2 className="size-4" />
              Требуется верификация инициатора
            </div>
            <p className="text-sm text-slate-600">
              Разместите инвестиционный проект с документами и объёмом инвестиций. После верификации проект появится в публичном каталоге.
            </p>
            <Link to="/app/verification">
              <Button variant="secondary" size="sm">Пройти верификацию</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="border-brand-blue/10 bg-gradient-to-br from-white to-brand-blue/5">
        <CardContent className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">Аналитика инвестиционного рынка</div>
            <div className="mt-1 text-sm text-slate-600">
              Аналитика по отраслям, регионам и объёмам инвестиций — в разделе «Аналитика и новости».
            </div>
          </div>
          <Link to="/analytics">
            <Button size="sm" className="gap-2">
              <TrendingUp className="size-4" />
              Открыть аналитику
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
