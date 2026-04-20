import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Globe2,
  Megaphone,
  MapPin,
  Sparkles,
} from 'lucide-react'
import { Container } from '@widgets/layout/Container'
import { Card, CardContent } from '@shared/ui/Card'
import { cx } from '@shared/lib/cx'

const SLIDE_INTERVAL_MS = 10_000

type GeneralPartner = {
  id: string
  name: string
  tagline: string
  badge: string
  accent: string
  initials: string
}

const GENERAL_PARTNERS: GeneralPartner[] = [
  {
    id: 'qaztrade',
    name: 'QazTrade',
    tagline: 'Продвижение экспорта и поиск покупателей на зарубежных рынках.',
    badge: 'Генеральный партнёр',
    accent: 'from-brand-blue/15 via-white to-brand-blue/5',
    initials: 'QT',
  },
  {
    id: 'kazakh-export',
    name: 'KazakhExport',
    tagline: 'Страхование и финансирование экспортных контрактов.',
    badge: 'Финансы экспорта',
    accent: 'from-emerald-100 via-white to-emerald-50',
    initials: 'KE',
  },
  {
    id: 'kazakh-invest',
    name: 'KazakhInvest',
    tagline: 'Сопровождение инвестиционных проектов и бизнес-миссий.',
    badge: 'Инвестиции',
    accent: 'from-brand-yellow-soft via-white to-amber-50',
    initials: 'KI',
  },
  {
    id: 'halyk',
    name: 'Halyk Bank',
    tagline: 'Торговое финансирование и расчёты по международным сделкам.',
    badge: 'Trade Finance',
    accent: 'from-rose-100 via-white to-rose-50',
    initials: 'HB',
  },
  {
    id: 'kazpost',
    name: 'Kazpost',
    tagline: 'Логистика, таможенное оформление и B2B-отправления.',
    badge: 'Логистика',
    accent: 'from-sky-100 via-white to-sky-50',
    initials: 'KP',
  },
]

type PartnerNews = {
  id: string
  name: string
  category: string
  accent: string
  initials: string
  news: string[]
}

const MODEST_PARTNERS: PartnerNews[] = [
  {
    id: 'damu-logistics',
    name: 'DAMU Logistics',
    category: 'Мультимодальные перевозки',
    accent: 'bg-sky-50 text-sky-700',
    initials: 'DL',
    news: [
      'Новый маршрут Алматы — Стамбул — Роттердам с фиксированным SLA.',
      'Скидка 8% на консолидированные отправки до конца квартала.',
      'Онлайн-трекинг контейнеров теперь доступен в кабинете SRH.',
      'Запущено страхование ответственности перевозчика до $2 млн.',
      'Склад класса A в Хоргосе: кросс-докинг за 24 часа.',
    ],
  },
  {
    id: 'centras-insurance',
    name: 'Centras Insurance',
    category: 'Страхование грузов',
    accent: 'bg-emerald-50 text-emerald-700',
    initials: 'CI',
    news: [
      'Онлайн-полис CMR за 15 минут прямо в DealCase.',
      'Покрытие политических рисков для экспорта в ЕС.',
      'Тариф на зерновые снижен на 12% по сравнению с 2025.',
      'Электронный убыток: выплата в течение 7 рабочих дней.',
      'Бесплатный аудит рисков для новых контрагентов SRH.',
    ],
  },
  {
    id: 'kaz-customs',
    name: 'KazCustoms Broker',
    category: 'Таможенное оформление',
    accent: 'bg-amber-50 text-amber-700',
    initials: 'KC',
    news: [
      'Предварительное декларирование на границе Казахстан — КНР.',
      'Обновлён справочник кодов ТН ВЭД на 2026 год.',
      'Пакет «под ключ» для экспорта текстиля и агропродукции.',
      'Юридическое сопровождение споров с таможней включено в тариф.',
      'Интеграция API с DealCase: документы улетают в систему автоматически.',
    ],
  },
  {
    id: 'iso-kz',
    name: 'ISO Kazakhstan',
    category: 'Сертификация и стандарты',
    accent: 'bg-indigo-50 text-indigo-700',
    initials: 'IK',
    news: [
      'ISO 9001:2015 — ускоренная сертификация за 4 недели.',
      'Вебинар: подготовка к аудиту ISO 22000 для пищевых производств.',
      'Скидка для резидентов СЭЗ на пакет сертификатов.',
      'Электронные сертификаты с QR-проверкой в каталоге SRH.',
      'Программа по переходу на ISO 14001 для экспортёров.',
    ],
  },
  {
    id: 'sgs-kz',
    name: 'SGS Kazakhstan',
    category: 'Инспекция и контроль качества',
    accent: 'bg-cyan-50 text-cyan-700',
    initials: 'SG',
    news: [
      'Предотгрузочная инспекция по стандарту покупателя.',
      'Лабораторные анализы продукции за 48 часов.',
      'Новый офис в Шымкенте: ближе к сельхозэкспортёрам.',
      'Электронный отчёт об инспекции в DealCase покупателя.',
      'Пакет контроля качества для контрактов от $100K.',
    ],
  },
  {
    id: 'fesco',
    name: 'FESCO Trans',
    category: 'Морские перевозки',
    accent: 'bg-blue-50 text-blue-700',
    initials: 'FT',
    news: [
      'Еженедельный сервис Актау — Поти для генеральных грузов.',
      'Рефрижераторные контейнеры для агроэкспорта: +20% парка.',
      'Акция: бесплатный первый рейс для новых клиентов SRH.',
      'Прямые букинги через DealCase без посредников.',
      'Страхование груза «всё включено» по ставке 0,12%.',
    ],
  },
  {
    id: 'eurasian-bank',
    name: 'Eurasian Trade Finance',
    category: 'Финансирование сделок',
    accent: 'bg-purple-50 text-purple-700',
    initials: 'EB',
    news: [
      'Аккредитивы с раскрытием по документам DealCase.',
      'Кредитная линия под экспортный контракт до 80% суммы.',
      'Пониженная ставка 12,5% для верифицированных продавцов.',
      'Хеджирование валютного риска по 5 валютам.',
      'Факторинг без регресса для подтверждённых покупателей.',
    ],
  },
  {
    id: 'astana-customs',
    name: 'Astana Customs Hub',
    category: 'Хаб таможенных услуг',
    accent: 'bg-teal-50 text-teal-700',
    initials: 'AH',
    news: [
      'Открыт единый центр оформления при аэропорте Астаны.',
      'Электронная очередь: прогноз времени оформления онлайн.',
      'Склад временного хранения 10 000 м² рядом с терминалом.',
      'Ускоренное оформление для экспортёров с рейтингом SRH ≥ 4.',
      'Совместная горячая линия с кураторами платформы.',
    ],
  },
  {
    id: 'kaztrans-service',
    name: 'KazTransService',
    category: 'Автомобильная логистика',
    accent: 'bg-orange-50 text-orange-700',
    initials: 'KT',
    news: [
      'Новый парк рефрижераторов: +120 машин к сезону.',
      'Сервис «дверь — дверь» по маршрутам СНГ и ЕС.',
      'Электронная ТТН подписывается прямо в DealCase.',
      'Telematics-трекинг с уведомлениями о задержках в пути.',
      'Программа лояльности: 5% кэшбэк на следующий рейс.',
    ],
  },
  {
    id: 'halalcert',
    name: 'HalalCert KZ',
    category: 'Halal-сертификация',
    accent: 'bg-lime-50 text-lime-700',
    initials: 'HC',
    news: [
      'Сертификация Halal по стандартам SMIIC и MUI.',
      'Ускоренный аудит за 10 дней для мясной продукции.',
      'Реестр сертифицированных производителей в каталоге SRH.',
      'Образовательный курс для технологов по стандартам Halal.',
      'Партнёрские скидки для экспортёров в страны ОИС.',
    ],
  },
]

type ForumAnnouncement = {
  id: string
  title: string
  dateLabel: string
  city: string
  level: 'Международный' | 'Республиканский'
  status: string
  summary: string
}

const UPCOMING_ANNOUNCEMENTS: ForumAnnouncement[] = [
  {
    id: 'forum-astana-trade-2026',
    title: 'Astana Trade Forum 2026',
    dateLabel: '12-13 мая 2026',
    city: 'Астана',
    level: 'Международный',
    status: 'Регистрация открыта',
    summary: 'Экспортные контракты, B2B-встречи с закупщиками из СНГ, ЕС и Ближнего Востока.',
  },
  {
    id: 'agro-export-kz-2026',
    title: 'Agro Export Kazakhstan',
    dateLabel: '27 мая 2026',
    city: 'Костанай',
    level: 'Республиканский',
    status: 'Приём заявок до 15 мая',
    summary: 'Форум по агроэкспорту: логистика, сертификация и каналы выхода в новые рынки.',
  },
  {
    id: 'eurasia-logistics-forum-2026',
    title: 'Eurasia Logistics Forum',
    dateLabel: '6-7 июня 2026',
    city: 'Алматы',
    level: 'Международный',
    status: 'Слоты B2B ограничены',
    summary: 'Транспортные коридоры, портовые маршруты, страхование и цифровое сопровождение сделок.',
  },
  {
    id: 'industry-invest-week-2026',
    title: 'Industry & Invest Week',
    dateLabel: '18 июня 2026',
    city: 'Караганда',
    level: 'Республиканский',
    status: 'Формируется программа',
    summary: 'Презентации инвестиционных проектов, меры господдержки и встречи с институтами развития.',
  },
]

export function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -left-40 -top-40 size-[520px] rounded-full bg-brand-blue/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-32 top-40 size-[420px] rounded-full bg-brand-yellow/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute left-1/3 top-[55%] size-[380px] rounded-full bg-emerald-200/40 blur-3xl" />

      <section className="relative border-b border-border">
        <Container className="py-14 sm:py-20">
          <div className="mb-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600 backdrop-blur-sm">
              <Globe2 className="size-3.5 text-brand-blue" />
              Silk Road Hub · B2B-платформа экспорта
            </div>
            <div className="inline-flex items-center gap-4 text-[12px] text-slate-600">
              <TrustDot>1 248 компаний</TrustDot>
              <TrustDot>доступ по верификации</TrustDot>
            </div>
          </div>

          <div className="grid items-stretch gap-6 lg:grid-cols-2">
            <GeneralPartnersCarousel partners={GENERAL_PARTNERS} />
            <AnnouncementsPreviewCard />
          </div>
        </Container>
      </section>

      <section className="relative">
        <Container className="py-12 sm:py-16">
          <PartnersNewsCarousel partners={MODEST_PARTNERS} />
        </Container>
      </section>
    </div>
  )
}

function TrustDot({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-1.5 rounded-full bg-emerald-500" />
      <span>{children}</span>
    </span>
  )
}

function AnnouncementsPreviewCard() {
  const [featured, ...otherAnnouncements] = UPCOMING_ANNOUNCEMENTS

  return (
    <Card className="animate-text-reveal animate-text-reveal-delay-3 relative flex h-full flex-col overflow-hidden opacity-0 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.25)]">
      <div className="relative flex items-center justify-between border-b border-border bg-gradient-to-r from-brand-yellow-soft via-white to-brand-yellow-soft/80 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-brand-blue/10 text-brand-blue">
            <Megaphone className="size-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">Объявления</div>
            <div className="mt-0.5 text-[12px] text-slate-600">Новости о предстоящих форумах международного и республиканского уровня</div>
          </div>
        </div>
        <Link
          to="/contacts"
          className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-border transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-white"
        >
          Предложить форум
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      <CardContent className="flex flex-1 flex-col gap-4">
        {featured && (
          <article className="group/feat overflow-hidden rounded-2xl border border-border bg-white transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-20px_rgba(15,23,42,0.35)]">
            <div className="bg-gradient-to-br from-brand-blue/10 via-white to-brand-yellow-soft/60 p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-border">
                  <CalendarDays className="size-3.5 text-brand-blue" />
                  {featured.dateLabel}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-border">
                  <MapPin className="size-3.5 text-brand-blue" />
                  {featured.city}
                </span>
                <span className="inline-flex rounded-full bg-brand-blue/10 px-2.5 py-1 text-[11px] font-semibold text-brand-blue">
                  {featured.level}
                </span>
              </div>
              <h3 className="text-lg font-semibold leading-snug text-slate-900 sm:text-xl">{featured.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{featured.summary}</p>
              <div className="mt-4 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                {featured.status}
              </div>
            </div>
          </article>
        )}

        {otherAnnouncements.length > 0 && (
          <div className="flex flex-1 flex-col">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Ближайшие анонсы</div>
              <Link to="/contacts" className="text-[11px] font-medium text-slate-500 hover:text-slate-700">
                отправить новость →
              </Link>
            </div>
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white">
              {otherAnnouncements.map((announcement, i) => (
                <li key={announcement.id}>
                  <article className="group/row flex items-start gap-3 px-4 py-3 transition-colors duration-200 hover:bg-slate-50">
                    <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-bold text-slate-600 group-hover/row:bg-brand-blue/10 group-hover/row:text-brand-blue">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 text-sm font-medium leading-snug text-slate-900 group-hover/row:text-brand-blue">
                        {announcement.title}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-600">{announcement.level}</span>
                        <span>·</span>
                        <span>{announcement.city}</span>
                        <span>·</span>
                        <span>{announcement.dateLabel}</span>
                      </div>
                    </div>
                    <ArrowUpRight className="mt-1 size-4 shrink-0 text-slate-300 transition-colors duration-200 group-hover/row:text-brand-blue" />
                  </article>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function useAutoSlide(count: number, intervalMs: number, paused: boolean) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (count <= 1 || paused) return
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % count)
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [count, intervalMs, paused])
  return [index, setIndex] as const
}

function AutoProgress({ cycleKey, durationMs, paused }: { cycleKey: string; durationMs: number; paused: boolean }) {
  return <AutoProgressInner key={cycleKey} durationMs={durationMs} paused={paused} />
}

function AutoProgressInner({ durationMs, paused }: { durationMs: number; paused: boolean }) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (paused) return
    let rafB = 0
    const rafA = window.requestAnimationFrame(() => {
      rafB = window.requestAnimationFrame(() => setValue(100))
    })
    return () => {
      window.cancelAnimationFrame(rafA)
      if (rafB) window.cancelAnimationFrame(rafB)
    }
  }, [paused])
  return (
    <div className="h-0.5 w-full overflow-hidden bg-slate-100">
      <div
        className="h-full bg-gradient-to-r from-brand-blue via-brand-blue-2 to-brand-yellow"
        style={{
          width: `${value}%`,
          transitionProperty: 'width',
          transitionDuration: paused ? '0ms' : `${durationMs}ms`,
          transitionTimingFunction: 'linear',
        }}
      />
    </div>
  )
}

function GeneralPartnersCarousel({ partners }: { partners: GeneralPartner[] }) {
  const [paused, setPaused] = useState(false)
  const [index, setIndex] = useAutoSlide(partners.length, SLIDE_INTERVAL_MS, paused)

  return (
    <div
      className="group/carousel animate-text-reveal relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-white opacity-0 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.25)] motion-card"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-brand-yellow-soft via-white to-brand-yellow-soft/70 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-brand-yellow/20 text-brand-yellow">
            <Sparkles className="size-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-700">Генеральные партнёры</div>
            <div className="mt-0.5 text-sm text-slate-700">Институциональная поддержка экспорта</div>
          </div>
        </div>
        <div className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-border">
          {String(index + 1).padStart(2, '0')} / {String(partners.length).padStart(2, '0')}
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div
          className="flex h-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {partners.map((p, i) => (
            <div key={p.id} className="relative w-full shrink-0">
              <div className={cx('relative h-full overflow-hidden bg-gradient-to-br px-6 py-10 sm:px-12 sm:py-14', p.accent)}>
                <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-white/50 blur-2xl" />
                <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-10 size-64 rounded-full bg-white/40 blur-3xl" />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-[0.35]"
                  style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(15,23,42,0.15) 1px, transparent 0)',
                    backgroundSize: '22px 22px',
                    maskImage: 'linear-gradient(to bottom right, rgba(0,0,0,0.6), transparent 70%)',
                  }}
                />

                <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                  <div className="relative">
                    <div className="absolute inset-0 -m-2 rounded-[26px] bg-gradient-to-br from-white to-white/40 blur-md" />
                    <div className="relative grid size-24 place-items-center rounded-3xl bg-white text-2xl font-bold text-slate-900 shadow-[0_8px_24px_-8px_rgba(15,23,42,0.25)] ring-1 ring-border">
                      {p.initials}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-700 ring-1 ring-border backdrop-blur-sm">
                      <span className="size-1.5 rounded-full bg-brand-yellow" />
                      {p.badge}
                    </div>
                    <div className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-[2.25rem] sm:leading-[1.1]">
                      {p.name}
                    </div>
                    <div className="mt-2 max-w-md text-sm text-slate-700 sm:text-base">{p.tagline}</div>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-[12px] font-semibold text-white transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        Узнать о партнёрстве
                        <ArrowUpRight className="size-3.5" />
                      </button>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-medium text-slate-600 ring-1 ring-border">
                        <CheckCircle2 className="size-3 text-emerald-600" />
                        Верифицирован · Партнёр #{i + 1}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <AutoProgress cycleKey={`gen-${index}-${paused}`} durationMs={SLIDE_INTERVAL_MS} paused={paused} />
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
            {paused ? 'пауза — наведение' : 'авто-слайд 10 сек'}
          </div>
          <div className="flex items-center gap-1.5">
            {partners.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setIndex(i)}
                className={cx(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === index ? 'w-10 bg-brand-blue' : 'w-1.5 bg-slate-300 hover:bg-slate-400',
                )}
                aria-label={`Показать партнёра ${p.name}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PartnersNewsCarousel({ partners }: { partners: PartnerNews[] }) {
  const [paused, setPaused] = useState(false)
  const [index, setIndex] = useAutoSlide(partners.length, SLIDE_INTERVAL_MS, paused)

  return (
    <div className="relative">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
            <span className="size-1.5 rounded-full bg-brand-blue" />
            Сервисные партнёры
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Логистика, страхование, таможня и сертификация — рядом со сделкой
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Новости и предложения 10 проверенных партнёров. Автопереход каждые 10 секунд — наведите, чтобы поставить на паузу.
          </p>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Партнёр</div>
          <div className="text-2xl font-bold tabular-nums text-slate-900">
            {String(index + 1).padStart(2, '0')}
            <span className="text-slate-400"> / {String(partners.length).padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      <div
        className="group/news relative overflow-hidden rounded-3xl border border-border bg-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.25)]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {partners.map((partner) => (
            <div key={partner.id} className="w-full shrink-0 px-5 py-6 sm:px-7 sm:py-7">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={cx('grid size-12 place-items-center rounded-2xl text-base font-bold ring-1 ring-border', partner.accent)}>
                    {partner.initials}
                  </div>
                  <div>
                    <div className="text-base font-semibold text-slate-900">{partner.name}</div>
                    <div className="mt-0.5 inline-flex items-center gap-1.5 text-[12px] text-slate-500">
                      <span className="size-1.5 rounded-full bg-brand-blue" />
                      {partner.category}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-slate-50"
                >
                  Все новости партнёра
                  <ArrowUpRight className="size-3.5" />
                </button>
              </div>

              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {partner.news.map((item, i) => (
                  <li
                    key={i}
                    className="group/card relative flex flex-col overflow-hidden rounded-2xl border border-border bg-white p-4 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_16px_32px_-20px_rgba(15,23,42,0.35)]"
                  >
                    <div className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-brand-blue via-brand-blue-2 to-brand-yellow transition-transform duration-300 group-hover/card:scale-x-100" />
                    <div className="flex items-center justify-between">
                      <div className={cx('inline-flex size-7 items-center justify-center rounded-lg text-[11px] font-bold', partner.accent)}>
                        {i + 1}
                      </div>
                      <ArrowUpRight className="size-3.5 text-slate-300 transition-colors duration-200 group-hover/card:text-slate-700" />
                    </div>
                    <div className="mt-3 text-[13px] leading-snug text-slate-700">{item}</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <AutoProgress cycleKey={`news-${index}-${paused}`} durationMs={SLIDE_INTERVAL_MS} paused={paused} />
        <div className="flex items-center justify-between gap-3 border-t border-border bg-slate-50/60 px-5 py-3">
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
            {paused ? 'пауза — наведение' : 'авто-слайд 10 сек'}
          </div>
          <div className="flex items-center gap-1.5">
            {partners.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setIndex(i)}
                className={cx(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === index ? 'w-6 bg-brand-blue' : 'w-1.5 bg-slate-300 hover:bg-slate-400',
                )}
                aria-label={`Показать партнёра ${p.name}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
