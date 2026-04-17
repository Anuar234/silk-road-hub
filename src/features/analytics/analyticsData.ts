export type AnalyticsPostType = 'news' | 'analysis' | 'case' | 'tools'

const TYPE_LABELS: Record<AnalyticsPostType, string> = {
  news: 'Новость',
  analysis: 'Разбор',
  case: 'Кейс',
  tools: 'Инструменты',
}

export function getTypeLabel(type: AnalyticsPostType): string {
  return TYPE_LABELS[type]
}

export type AnalyticsPost = {
  id: string
  slug: string
  title: string
  type: AnalyticsPostType
  category: string
  tags: string[]
  published_at: string
  reading_time_min: number
  author_name: string
  excerpt: string
  body: string
  cover_image_url: string
  source_url?: string
  is_featured: boolean
  popular_rank?: number
  key_takeaways?: string[]
}

export const ANALYTICS_TAGS = [
  'Продажи',
  'Маркетинг',
  'E-commerce',
  'Рынки',
  'Цены',
  'Логистика',
  'CRM',
  'Кейсы',
  'Стратегия',
] as const

const COVERS = {
  export: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&q=80',
  chart: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
  meeting: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
  logistics: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
  market: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
  docs: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80',
}

export const analyticsPosts: AnalyticsPost[] = [
  {
    id: '1',
    slug: 'eksport-v-knr-2025-trendy-i-barery',
    title: 'Экспорт в КНР 2025: тренды и барьеры',
    type: 'analysis',
    category: 'Рынки',
    tags: ['Рынки', 'Стратегия', 'Логистика'],
    published_at: '2025-03-01T10:00:00Z',
    reading_time_min: 8,
    author_name: 'Анна К.',
    excerpt:
      'Как меняются требования к поставкам, сертификация и логистические коридоры. Краткий разбор для экспортёров РК.',
    body: 'Полный текст материала о трендах экспорта в Китай...',
    cover_image_url: COVERS.export,
    is_featured: true,
    popular_rank: 1,
    key_takeaways: [
      'Рост доли несырьевого экспорта при сохранении требований к документам.',
      'Упрощение таможенных процедур по ряду позиций с 2025 года.',
      'Рекомендации по выбору логистических партнёров и сертификации.',
    ],
  },
  {
    id: '2',
    slug: 'crm-dlya-b2b-eksporta',
    title: 'CRM для B2B-экспорта: на что смотреть',
    type: 'tools',
    category: 'Инструменты',
    tags: ['CRM', 'Продажи', 'E-commerce'],
    published_at: '2025-02-28T14:00:00Z',
    reading_time_min: 5,
    author_name: 'Дмитрий С.',
    excerpt: 'Обзор решений для учёта контрагентов, переговоров, сделок и документов в одном месте.',
    body: 'Текст обзора CRM...',
    cover_image_url: COVERS.chart,
    is_featured: false,
    popular_rank: 2,
    key_takeaways: [
      'Интеграция с учётом и логистикой снижает ошибки.',
      'Важна поддержка мультивалюты и Incoterms.',
    ],
  },
  {
    id: '3',
    slug: 'kejs-postavka-muka-uzbekistan',
    title: 'Кейс: поставка муки в Узбекистан под private label',
    type: 'case',
    category: 'Кейсы',
    tags: ['Кейсы', 'Логистика', 'Рынки'],
    published_at: '2025-02-25T09:00:00Z',
    reading_time_min: 6,
    author_name: 'Мария Т.',
    excerpt: 'Как экспортёр из РК выстроил цепочку от производства до полки в соседней стране.',
    body: 'Описание кейса...',
    cover_image_url: COVERS.logistics,
    is_featured: true,
    popular_rank: 3,
    key_takeaways: [
      'Сертификация и маркировка под локальные нормы — ключевой этап.',
      'Работа с дистрибьютором сократила срок выхода на полку.',
    ],
  },
  {
    id: '4',
    slug: 'ceny-na-zerno-vesna-2025',
    title: 'Цены на зерно: весна 2025',
    type: 'news',
    category: 'Цены',
    tags: ['Цены', 'Рынки'],
    published_at: '2025-02-24T11:00:00Z',
    reading_time_min: 4,
    author_name: 'Редакция',
    excerpt: 'Краткий обзор котировок и факторов, влияющих на экспортную выручку.',
    body: 'Новость о ценах...',
    cover_image_url: COVERS.market,
    is_featured: false,
    popular_rank: 4,
    key_takeaways: [
      'Рост спроса в ряде направлений при стабильном предложении.',
    ],
  },
  {
    id: '5',
    slug: 'marketing-eksportnyh-kompaniy',
    title: 'Маркетинг экспортных компаний: каналы и метрики',
    type: 'analysis',
    category: 'Маркетинг',
    tags: ['Маркетинг', 'Продажи', 'Стратегия'],
    published_at: '2025-02-20T16:00:00Z',
    reading_time_min: 10,
    author_name: 'Елена В.',
    excerpt: 'Какие каналы работают для привлечения B2B-байеров и как считать ROI.',
    body: 'Разбор маркетинга...',
    cover_image_url: COVERS.meeting,
    is_featured: false,
    popular_rank: 5,
    key_takeaways: [
      'Комбинация отраслевых каталогов и прямых контактов даёт лучший результат.',
      'Метрики: количество квалифицированных запросов и конверсия в сделку.',
    ],
  },
  {
    id: '6',
    slug: 'dokumentooborot-vneshnetorgovoy-sdelki',
    title: 'Документооборот внешнеторговой сделки',
    type: 'tools',
    category: 'Инструменты',
    tags: ['CRM', 'Логистика', 'Кейсы'],
    published_at: '2025-02-18T08:00:00Z',
    reading_time_min: 7,
    author_name: 'Алексей К.',
    excerpt: 'Чек-лист документов от оферты до отгрузки и как не потерять сроки.',
    body: 'Текст про документы...',
    cover_image_url: COVERS.docs,
    is_featured: false,
    key_takeaways: [
      'Единый чек-лист по этапам снижает риски задержек.',
      'Важно заложить время на сертификаты и инспекции.',
    ],
  },
  {
    id: '7',
    slug: 'e-commerce-b2b-trendy',
    title: 'E-commerce в B2B: тренды и платформы',
    type: 'analysis',
    category: 'E-commerce',
    tags: ['E-commerce', 'Маркетинг', 'Стратегия'],
    published_at: '2025-02-15T12:00:00Z',
    reading_time_min: 9,
    author_name: 'Дмитрий С.',
    excerpt: 'Как B2B-продавцы используют онлайн-каталоги, переговоры и цифровой deal workflow.',
    body: 'Разбор e-commerce...',
    cover_image_url: COVERS.chart,
    is_featured: false,
    key_takeaways: [
      'Каталог + deal workflow сокращают цикл сделки.',
      'Интеграция с учётом и логистикой — следующий шаг.',
    ],
  },
  {
    id: '8',
    slug: 'logistika-srednyaya-aziya',
    title: 'Логистика в Среднюю Азию: маршруты и сроки',
    type: 'analysis',
    category: 'Логистика',
    tags: ['Логистика', 'Рынки'],
    published_at: '2025-02-12T07:00:00Z',
    reading_time_min: 6,
    author_name: 'Мария Т.',
    excerpt: 'Сравнение маршрутов, таможенных пунктов и реалистичных сроков доставки.',
    body: 'Текст про логистику...',
    cover_image_url: COVERS.logistics,
    is_featured: false,
    key_takeaways: [
      'Выбор пункта перевалки влияет на срок и стоимость.',
      'Документальное сопровождение лучше закладывать заранее.',
    ],
  },
]

export function getFeaturedPost(): AnalyticsPost | undefined {
  return analyticsPosts.find((p) => p.is_featured)
}

export function getPopularPosts(limit = 5): AnalyticsPost[] {
  return analyticsPosts
    .filter((p) => p.popular_rank != null)
    .sort((a, b) => (a.popular_rank ?? 0) - (b.popular_rank ?? 0))
    .slice(0, limit)
}

export function getPostsByTag(tag: string | null): AnalyticsPost[] {
  if (!tag) return analyticsPosts
  return analyticsPosts.filter((p) => p.tags.includes(tag))
}

export function getPostBySlug(slug: string): AnalyticsPost | undefined {
  return analyticsPosts.find((p) => p.slug === slug)
}

export function getRelatedPosts(post: AnalyticsPost, limit = 3): AnalyticsPost[] {
  const sameTag = post.tags[0]
  return analyticsPosts
    .filter((p) => p.id !== post.id && (p.tags.includes(sameTag) || p.type === post.type))
    .slice(0, limit)
}
