import { ArrowRight, ShieldCheck, Sparkles, Truck } from 'lucide-react'
import { Container } from '@widgets/layout/Container'
import { ButtonLink } from '@shared/ui/ButtonLink'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'

export function LandingPage() {
  return (
    <div>
      <section className="border-b border-border bg-white">
        <Container className="py-14 sm:py-20">
          <div className="grid items-start gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h1 className="animate-text-reveal text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl opacity-0">
                Экспорт быстрее — с доверенными контрагентами
              </h1>
              <p className="animate-text-reveal animate-text-reveal-delay-1 mt-5 max-w-2xl text-base text-slate-600 opacity-0">
                Каталог, проверенные контрагенты, переговоры, сделки и сопровождение документов в одном B2B-процессе. Доступ — по подтверждению компании.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {['Каталог по секторам', 'DealCase без потери контекста', 'Документы и статусы в одном месте'].map((item) => (
                  <span key={item} className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
                    {item}
                  </span>
                ))}
              </div>

              <div className="animate-text-reveal animate-text-reveal-delay-2 mt-8 flex flex-wrap gap-3 opacity-0">
                <ButtonLink to="/request-access" variant="primary" className="gap-2">
                  Запросить доступ
                  <ArrowRight className="size-4" />
                </ButtonLink>
                <ButtonLink to="/catalog" variant="secondary">
                  Открыть каталог
                </ButtonLink>
              </div>
            </div>

            <Card className="animate-text-reveal animate-text-reveal-delay-3 overflow-hidden opacity-0">
              <div className="border-b border-border bg-brand-yellow-soft px-5 py-4">
                <div className="text-sm font-semibold text-slate-900">Как это работает</div>
                <div className="mt-1 text-sm text-slate-700">В одном процессе: поиск → переговоры → сделка → документы</div>
              </div>
              <CardContent className="grid gap-3">
                <div className="rounded-xl border border-border bg-white p-4 text-sm text-slate-700">
                  Доступ к каталогу — по подтверждению компании. Это снижает спам и повышает
                  качество запросов.
                </div>
                <div className="rounded-xl border border-border bg-white p-4 text-sm text-slate-700">
                  Переписка, DealCase и статусы помогают быстро фиксировать договорённости и передавать кейс в обработку администрации.
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      <section>
        <Container className="py-12 sm:py-16">
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-white p-4">
              <div className="text-2xl font-bold text-slate-900">1</div>
              <div className="mt-1 text-sm font-medium text-slate-900">Найти товар</div>
              <div className="mt-1 text-sm text-slate-600">Каталог с фильтрами по странам, сертификатам, HS-коду и условиям поставки.</div>
            </div>
            <div className="rounded-2xl border border-border bg-white p-4">
              <div className="text-2xl font-bold text-slate-900">2</div>
              <div className="mt-1 text-sm font-medium text-slate-900">Договориться</div>
              <div className="mt-1 text-sm text-slate-600">Переписка привязана к товару, а переход в сделку сохраняет весь контекст.</div>
            </div>
            <div className="rounded-2xl border border-border bg-white p-4">
              <div className="text-2xl font-bold text-slate-900">3</div>
              <div className="mt-1 text-sm font-medium text-slate-900">Довести до результата</div>
              <div className="mt-1 text-sm text-slate-600">Админ сопровождает документы, статусы и операционные блокеры до завершения.</div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader title="Метки доверия" subtitle="Статусы и документы компании: проверен, ISO, Halal и др." />
              <CardContent>
                <div className="flex items-start gap-3 text-sm text-slate-700">
                  <ShieldCheck className="mt-0.5 size-5 text-brand-blue" />
                  <p>Показываем подтверждения и атрибуты доверия там, где это важно для сделки.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Сделка в 3 шага" subtitle="Переговоры → DealCase → документы и сопровождение" />
              <CardContent>
                <div className="flex items-start gap-3 text-sm text-slate-700">
                  <Sparkles className="mt-0.5 size-5 text-brand-blue" />
                  <p>Единый формат сделки сохраняет контекст переговоров, документов и статусов без разрывов между чатами и кабинетом.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                title="Партнёры"
                subtitle="Логистика, страхование, таможня, сертификация — в одном процессе"
              />
              <CardContent>
                <div className="flex items-start gap-3 text-sm text-slate-700">
                  <Truck className="mt-0.5 size-5 text-brand-blue" />
                  <p>Подключаем сервисы вокруг сделки: SLA, документы, расчёт и сопровождение.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>
    </div>
  )
}

