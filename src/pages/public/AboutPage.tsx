import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  FileSignature,
  Globe2,
  Handshake,
  PackageSearch,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { Container } from '@widgets/layout/Container'
import { ButtonLink } from '@shared/ui/ButtonLink'
import { Card, CardContent, CardHeader } from '@shared/ui/Card'

type Step = {
  num: string
  title: string
  description: string
  icon: React.ReactNode
}

const STEPS: Step[] = [
  {
    num: '01',
    title: 'Регистрация и верификация',
    description:
      'Компании регистрируются и проходят верификацию: подтверждение email и загрузка регистрационных документов. Только верифицированные пользователи открывают переговоры и сделки.',
    icon: <ShieldCheck className="size-5" />,
  },
  {
    num: '02',
    title: 'Каталог и поиск',
    description:
      'Экспортёры размещают карточки товаров с указанием страны и региона происхождения. Покупатели фильтруют по сектору, подкатегории, стране и комбинируют параметры.',
    icon: <PackageSearch className="size-5" />,
  },
  {
    num: '03',
    title: 'Переговоры и сделка',
    description:
      'Защищённая переписка между продавцом и покупателем, фиксация договорённостей (LOI / MOU), пятиэтапный жизненный цикл сделки от переговоров до завершения.',
    icon: <Handshake className="size-5" />,
  },
  {
    num: '04',
    title: 'Контракт и сопровождение',
    description:
      'Шаблоны экспортных контрактов, выбор применимого права, логистические маршруты, фиксация этапов расчётов, гарантии KazakhExport.',
    icon: <FileSignature className="size-5" />,
  },
  {
    num: '05',
    title: 'Аналитика и отчётность',
    description:
      'Статистика по пользователям, объявлениям, сделкам и инвестпроектам. География рынков и экспортная активность регионов РК — для институциональных партнёров.',
    icon: <TrendingUp className="size-5" />,
  },
]

type FeaturePillar = {
  title: string
  description: string
  icon: React.ReactNode
}

const PILLARS: FeaturePillar[] = [
  {
    icon: <Globe2 className="size-5" />,
    title: 'Многострановой формат',
    description: 'Товары из Казахстана и других стран с обязательным указанием страны и региона происхождения. Приоритет — экспорт РК.',
  },
  {
    icon: <ClipboardCheck className="size-5" />,
    title: 'Документный workflow',
    description: 'Загрузка, проверка и история документов: контракты, сертификаты, инвойсы, логистика. Magic-byte валидация и полный аудит-лог.',
  },
  {
    icon: <Building2 className="size-5" />,
    title: 'Инвестиционный модуль',
    description: 'Каталог проектов Kazakh Invest, ГЧП и частных инициатив. Инвестиционные запросы и стадии договорённостей.',
  },
  {
    icon: <Sparkles className="size-5" />,
    title: 'Институциональная поддержка',
    description: 'Сопровождение QazTrade, страхование и финансирование KazakhExport, инвестиционное сопровождение Kazakh Invest.',
  },
]

const PARTNERS = [
  {
    name: 'QazTrade',
    role: 'Куратор и методологическое сопровождение',
    description:
      'АО «QazTrade» — Центр развития торговой политики. Координирует требования к платформе, аналитику и отчётность по экспорту несырьевых товаров РК.',
  },
  {
    name: 'KazakhExport',
    role: 'Гарантии и страхование',
    description:
      'АО «KazakhExport» — экспортная кредитная компания. Подключает страхование и финансирование экспортных контрактов через карточку сделки.',
  },
  {
    name: 'Kazakh Invest',
    role: 'Инвестиционное сопровождение',
    description:
      'АО «Kazakh Invest» — национальная компания по привлечению инвестиций. Сопровождает инвестиционные проекты и обеспечивает международное позиционирование.',
  },
]

export function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-br from-white via-brand-yellow-soft/30 to-brand-blue/5">
        <Container className="py-12 sm:py-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              <Globe2 className="size-3.5 text-brand-blue" />
              О платформе
            </div>
            <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Silk Road Hub — цифровой контур экспорта Казахстана
            </h1>
            <p className="mt-4 text-pretty text-base text-slate-600 sm:text-lg">
              SaaS-платформа сквозного сопровождения экспортных сделок и инвестиционных проектов: от
              регистрации и поиска контрагента до подписанного контракта, логистики и формирования
              экспортной статистики.
            </p>
          </div>
        </Container>
      </section>

      {/* What it does */}
      <section className="border-b border-border">
        <Container className="py-12 sm:py-16">
          <div className="max-w-3xl">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Возможности платформы
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Все сервисы — в одном цифровом контуре
            </h2>
            <p className="mt-2 text-base text-slate-600">
              Платформа объединяет четыре пласта: торговый каталог, инвестиционные проекты,
              документный workflow сделки и институциональное сопровождение партнёров.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {PILLARS.map((p) => (
              <div
                key={p.title}
                className="flex items-start gap-4 rounded-2xl border border-border bg-white p-5 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-24px_rgba(15,23,42,0.25)]"
              >
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-blue/10 text-brand-blue">
                  {p.icon}
                </div>
                <div>
                  <div className="text-base font-semibold text-slate-900">{p.title}</div>
                  <div className="mt-1 text-sm text-slate-600">{p.description}</div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section className="border-b border-border bg-white/40">
        <Container className="py-12 sm:py-16">
          <div className="max-w-3xl">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Как это работает
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Сквозной бизнес-процесс
            </h2>
            <p className="mt-2 text-base text-slate-600">
              Каждый этап имеет цифровой след: статусы, документы, история переговоров и решения
              институциональных партнёров.
            </p>
          </div>

          <ol className="mt-8 grid gap-4 lg:grid-cols-5">
            {STEPS.map((step) => (
              <li
                key={step.num}
                className="relative flex flex-col gap-3 rounded-2xl border border-border bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-yellow-soft text-brand-blue">
                    {step.icon}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {step.num}
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-900">{step.title}</div>
                <div className="text-xs leading-snug text-slate-600">{step.description}</div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Partners */}
      <section className="border-b border-border">
        <Container className="py-12 sm:py-16">
          <div className="max-w-3xl">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Институциональные партнёры
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Платформа реализуется при поддержке
            </h2>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {PARTNERS.map((partner) => (
              <Card key={partner.name} className="h-full">
                <CardHeader title={partner.name} subtitle={partner.role} />
                <CardContent className="text-sm text-slate-600">{partner.description}</CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Final CTA */}
      <section>
        <Container className="py-12 sm:py-16">
          <div className="rounded-3xl border border-border bg-gradient-to-br from-brand-blue/5 via-white to-brand-yellow-soft/40 p-8 sm:p-10">
            <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto]">
              <div className="max-w-2xl">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Получите доступ к платформе
                </h2>
                <p className="mt-2 text-base text-slate-600">
                  Зарегистрируйтесь как покупатель, экспортёр или инвестор. Доступ к переговорам и
                  сделкам открывается после верификации компании.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <ButtonLink to="/register" variant="primary" className="gap-2">
                  Создать аккаунт
                  <ArrowRight className="size-4" />
                </ButtonLink>
                <ButtonLink to="/request-access" variant="secondary">
                  Запросить доступ
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
