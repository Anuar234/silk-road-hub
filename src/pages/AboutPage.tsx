import { Container } from '../components/layout/Container'
import { ButtonLink } from '../components/ui/ButtonLink'
import { Card, CardContent, CardHeader } from '../components/ui/Card'

export function AboutPage() {
  return (
    <Container className="py-12">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">О нас</h1>
      <p className="mt-2 max-w-3xl text-base text-slate-600">
        Что мы делаем и как помогаем экспортёрам и байерам
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Что мы делаем" />
          <CardContent>
            <ul className="grid gap-2 text-sm text-slate-700">
              <li>— стандартизируем карточки товаров и продавцов</li>
              <li>— trust badges и документы</li>
              <li>— сделки, статусы и документный workflow</li>
              <li>— коммуникации и история действий</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-brand-yellow/30 bg-brand-yellow-soft">
          <CardHeader title="Наши партнёры" subtitle="Сервисы вокруг сделки — в одном процессе" />
          <CardContent>
            <ul className="grid gap-2 text-sm text-slate-800">
              <li>— логистика и экспедирование</li>
              <li>— страхование грузов / торговых рисков</li>
              <li>— таможенные брокеры</li>
              <li>— сертификация (ISO/HACCP/Halal)</li>
              <li>— юридическая поддержка / переводы</li>
            </ul>
            <p className="mt-4 text-sm text-slate-700">
              Партнёры подключаются к сделкам и помогают ускорить логистику, сертификацию и документное сопровождение.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-white p-6">
        <div className="text-base font-semibold text-slate-900">Хотите доступ?</div>
        <p className="mt-1 text-sm text-slate-600">
          Запросите доступ — мы подтвердим компанию и откроем функциональность платформы.
        </p>
        <div className="mt-4">
          <ButtonLink to="/request-access" variant="primary">
            Запросить доступ
          </ButtonLink>
        </div>
      </div>
    </Container>
  )
}

