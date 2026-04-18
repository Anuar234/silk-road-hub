import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Building2,
  FileCheck2,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
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

export function LandingPage() {
  return (
    <div>
      <section className="border-b border-border bg-white">
        <Container className="py-14 sm:py-20">
          <div className="grid items-start gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <GeneralPartnersCarousel partners={GENERAL_PARTNERS} />
            <AnalyticsPreviewCard />
          </div>
        </Container>
      </section>

      <section>
        <Container className="py-12 sm:py-16">
          <PartnersNewsCarousel partners={MODEST_PARTNERS} />
        </Container>
      </section>
    </div>
  )
}

function AnalyticsPreviewCard() {
  const sparkline = [18, 22, 19, 28, 31, 26, 34, 30, 38, 42, 39, 48]
  const sparkMax = Math.max(...sparkline)

  const activity = useMemo(
    () => [
      { id: 'a1', icon: <MessageSquare className="size-3.5 text-brand-blue" />, text: 'Новый запрос от OOO «Текстильпром» · пшеница 5 кл.' },
      { id: 'a2', icon: <FileCheck2 className="size-3.5 text-emerald-600" />, text: 'DealCase #DC-2418 · загружен инвойс и CMR' },
      { id: 'a3', icon: <ShieldCheck className="size-3.5 text-amber-600" />, text: 'Продавец «KazFood» прошёл проверку · ISO 22000' },
    ],
    [],
  )

  return (
    <Card className="animate-text-reveal animate-text-reveal-delay-3 overflow-hidden opacity-0">
      <div className="flex items-center justify-between border-b border-border bg-brand-yellow-soft px-5 py-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">Как это работает</div>
          <div className="mt-1 text-sm text-slate-700">Поиск → переговоры → сделка → документы</div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          live
        </span>
      </div>

      <CardContent className="grid gap-3">
        <div className="grid grid-cols-2 gap-2">
          <MiniKpi
            icon={<Activity className="size-4 text-brand-blue" />}
            label="Активные сделки"
            value="124"
            trend="+8%"
            tone="text-emerald-600"
          />
          <MiniKpi
            icon={<MessageSquare className="size-4 text-amber-600" />}
            label="Новые запросы"
            value="37"
            trend="+12%"
            tone="text-emerald-600"
          />
          <MiniKpi
            icon={<Building2 className="size-4 text-purple-600" />}
            label="Контрагентов"
            value="1 248"
            trend="проверено"
            tone="text-slate-500"
          />
          <MiniKpi
            icon={<FileCheck2 className="size-4 text-emerald-600" />}
            label="Документы в срок"
            value="98%"
            trend="SLA"
            tone="text-slate-500"
          />
        </div>

        <div className="rounded-xl border border-border bg-white p-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-slate-700">Сделки по неделям</div>
            <div className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
              <TrendingUp className="size-3.5" />
              рост 2,6×
            </div>
          </div>
          <div className="mt-2 flex h-16 items-end gap-1">
            {sparkline.map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-gradient-to-t from-brand-blue/70 to-brand-blue-2"
                style={{ height: `${(v / sparkMax) * 100}%` }}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-700">
            <Zap className="size-3.5 text-amber-500" />
            Последние события
          </div>
          <ul className="space-y-1.5">
            {activity.map((item) => (
              <li key={item.id} className="flex items-start gap-2 text-[12px] text-slate-600">
                <span className="mt-0.5">{item.icon}</span>
                <span className="leading-snug">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

function MiniKpi({
  icon,
  label,
  value,
  trend,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  trend: string
  tone: string
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-3">
      <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-xl font-bold text-slate-900">{value}</div>
      <div className={cx('mt-0.5 text-[11px] font-medium', tone)}>{trend}</div>
    </div>
  )
}

function useAutoSlide(count: number, intervalMs: number) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (count <= 1) return
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % count)
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [count, intervalMs])
  return [index, setIndex] as const
}

function GeneralPartnersCarousel({ partners }: { partners: GeneralPartner[] }) {
  const [index, setIndex] = useAutoSlide(partners.length, SLIDE_INTERVAL_MS)

  return (
    <div className="animate-text-reveal rounded-2xl border border-border bg-white opacity-0 motion-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-brand-yellow-soft px-6 py-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-700">Генеральные партнёры</div>
          <div className="mt-0.5 text-sm text-slate-700">Институциональная поддержка экспорта</div>
        </div>
        <div className="text-[11px] font-medium text-slate-600">
          {index + 1} / {partners.length}
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {partners.map((p) => (
            <div key={p.id} className="w-full shrink-0">
              <div className={cx('flex flex-col items-center gap-5 bg-gradient-to-br px-6 py-10 text-center sm:flex-row sm:gap-6 sm:px-10 sm:py-12 sm:text-left', p.accent)}>
                <div className="grid size-20 shrink-0 place-items-center rounded-2xl bg-white text-xl font-bold text-slate-900 shadow-sm ring-1 ring-border">
                  {p.initials}
                </div>
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-medium text-slate-700 ring-1 ring-border">
                    <Sparkles className="size-3 text-brand-yellow" />
                    {p.badge}
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">{p.name}</div>
                  <div className="mt-2 text-sm text-slate-600 sm:text-base">{p.tagline}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 border-t border-border px-4 py-3">
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
  )
}

function PartnersNewsCarousel({ partners }: { partners: PartnerNews[] }) {
  const [index, setIndex] = useAutoSlide(partners.length, SLIDE_INTERVAL_MS)

  return (
    <div className="mt-10">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Сервисные партнёры</div>
          <div className="mt-1 text-sm text-slate-600">Новости и предложения логистики, страхования, таможни и сертификации.</div>
        </div>
        <div className="text-[11px] text-slate-500">
          {index + 1} / {partners.length}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border bg-white">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {partners.map((partner) => (
            <div key={partner.id} className="w-full shrink-0 px-5 py-6 sm:px-6">
              <div className="mb-4 flex items-center gap-3">
                <div className={cx('grid size-10 place-items-center rounded-xl text-sm font-bold', partner.accent)}>
                  {partner.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{partner.name}</div>
                  <div className="text-xs text-slate-500">{partner.category}</div>
                </div>
              </div>

              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {partner.news.map((item, i) => (
                  <li
                    key={i}
                    className="rounded-xl border border-border bg-white p-3 text-sm text-slate-700 transition-shadow duration-300 hover:shadow-sm"
                  >
                    <div className="mb-1 inline-flex size-5 items-center justify-center rounded-md bg-slate-100 text-[10px] font-semibold text-slate-500">
                      {i + 1}
                    </div>
                    <div className="text-[13px] leading-snug text-slate-700">{item}</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-1.5 border-t border-border bg-white px-4 py-3">
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
  )
}
