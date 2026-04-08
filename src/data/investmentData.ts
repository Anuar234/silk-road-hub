import { notifyPlatformDataChange } from './storeEvents'

export type InvestmentStage = 'concept' | 'feasibility' | 'design' | 'construction' | 'operational'
export type InvestmentSource = 'kazakh_invest' | 'private' | 'ppp'

export type InvestmentProject = {
  id: string
  title: string
  description: string
  sector: string
  regionCode: string
  volumeUsd: number
  stage: InvestmentStage
  source: InvestmentSource
  initiator: string
  contactEmail: string
  documentIds: string[]
  tags: string[]
  createdAt: string
  updatedAt: string
}

export const INVESTMENT_STAGES: { id: InvestmentStage; name: string }[] = [
  { id: 'concept', name: 'Концепция' },
  { id: 'feasibility', name: 'Технико-экономическое обоснование' },
  { id: 'design', name: 'Проектирование' },
  { id: 'construction', name: 'Строительство' },
  { id: 'operational', name: 'Эксплуатация' },
]

export const INVESTMENT_SOURCES: { id: InvestmentSource; name: string }[] = [
  { id: 'kazakh_invest', name: 'Kazakh Invest' },
  { id: 'private', name: 'Частный проект' },
  { id: 'ppp', name: 'ГЧП' },
]

export const investmentProjects: InvestmentProject[] = [
  {
    id: 'inv-001',
    title: 'Строительство завода по переработке масличных культур',
    description: 'Создание современного маслоэкстракционного завода мощностью 200 000 тонн в год. Продукция: растительное масло, шрот, лецитин. Основные рынки сбыта — Китай, Узбекистан, Афганистан.',
    sector: 'agro',
    regionCode: 'KZ-SEV',
    volumeUsd: 45_000_000,
    stage: 'feasibility',
    source: 'kazakh_invest',
    initiator: 'АО «КазАгроИнвест»',
    contactEmail: 'invest@kazagroinvest.kz',
    documentIds: [],
    tags: ['масличные', 'переработка', 'экспорт'],
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-03-20T14:30:00Z',
  },
  {
    id: 'inv-002',
    title: 'Логистический хаб «Хоргос — Сухой порт»',
    description: 'Расширение мощностей сухого порта на границе с Китаем. Новые складские комплексы, таможенный терминал, контейнерная площадка на 5 000 TEU.',
    sector: 'logistics',
    regionCode: 'KZ-ALM',
    volumeUsd: 120_000_000,
    stage: 'design',
    source: 'ppp',
    initiator: 'СЭЗ «Хоргос — Восточные ворота»',
    contactEmail: 'projects@khorgos.kz',
    documentIds: [],
    tags: ['логистика', 'хоргос', 'китай', 'транзит'],
    createdAt: '2025-11-01T08:00:00Z',
    updatedAt: '2026-02-28T11:00:00Z',
  },
  {
    id: 'inv-003',
    title: 'Солнечная электростанция 100 МВт в Туркестанской области',
    description: 'Проект строительства фотоэлектрической станции мощностью 100 МВт. Годовая выработка — 160 ГВт·ч. Инвестиционное соглашение с Kazakh Invest подписано.',
    sector: 'energy',
    regionCode: 'KZ-TUR',
    volumeUsd: 85_000_000,
    stage: 'construction',
    source: 'kazakh_invest',
    initiator: 'SunPower Central Asia',
    contactEmail: 'ca@sunpower.com',
    documentIds: [],
    tags: ['ВИЭ', 'солнечная энергия', 'зеленая энергетика'],
    createdAt: '2025-09-10T12:00:00Z',
    updatedAt: '2026-03-15T09:00:00Z',
  },
  {
    id: 'inv-004',
    title: 'Текстильный кластер в Шымкенте',
    description: 'Создание текстильного кластера полного цикла: прядильное, ткацкое, швейное производство. Мощность — 15 000 тонн пряжи и 20 млн метров ткани в год.',
    sector: 'textile',
    regionCode: 'KZ-SHY',
    volumeUsd: 60_000_000,
    stage: 'concept',
    source: 'private',
    initiator: 'ТОО «SilkTextile Group»',
    contactEmail: 'invest@silktextile.kz',
    documentIds: [],
    tags: ['текстиль', 'хлопок', 'швейное производство'],
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-03-25T16:00:00Z',
  },
  {
    id: 'inv-005',
    title: 'Фармацевтический завод по производству дженериков',
    description: 'Строительство завода GMP-стандарта для производства таблетированных и капсулированных лекарственных средств. Мощность — 2 млрд таблеток в год.',
    sector: 'pharma',
    regionCode: 'KZ-ALA',
    volumeUsd: 35_000_000,
    stage: 'feasibility',
    source: 'private',
    initiator: 'PharmaKZ Holdings',
    contactEmail: 'biz@pharmakz.kz',
    documentIds: [],
    tags: ['фармацевтика', 'GMP', 'дженерики'],
    createdAt: '2026-01-20T09:00:00Z',
    updatedAt: '2026-03-18T13:00:00Z',
  },
  {
    id: 'inv-006',
    title: 'Завод по производству строительных смесей',
    description: 'Запуск завода сухих строительных смесей мощностью 300 000 тонн в год. Экспорт в Узбекистан, Кыргызстан, Таджикистан.',
    sector: 'construction',
    regionCode: 'KZ-KAR',
    volumeUsd: 18_000_000,
    stage: 'construction',
    source: 'private',
    initiator: 'ТОО «BuildMix KZ»',
    contactEmail: 'info@buildmix.kz',
    documentIds: [],
    tags: ['стройматериалы', 'сухие смеси', 'экспорт ЦА'],
    createdAt: '2025-12-05T11:00:00Z',
    updatedAt: '2026-03-10T10:00:00Z',
  },
  {
    id: 'inv-007',
    title: 'Кластер глубокой переработки меди',
    description: 'Создание производства медной катанки, провода и кабельной продукции. Сырьевая база — Жезказганский медеплавильный завод. Объём переработки — 50 000 тонн катодной меди.',
    sector: 'metals',
    regionCode: 'KZ-ULY',
    volumeUsd: 200_000_000,
    stage: 'design',
    source: 'kazakh_invest',
    initiator: 'Copper Valley Ltd',
    contactEmail: 'invest@coppervalley.kz',
    documentIds: [],
    tags: ['медь', 'металлургия', 'глубокая переработка'],
    createdAt: '2025-10-15T08:00:00Z',
    updatedAt: '2026-03-22T15:00:00Z',
  },
]

/* ── Мутации ── */

export function getInvestmentById(id: string): InvestmentProject | undefined {
  return investmentProjects.find((p) => p.id === id)
}

export function addInvestmentProject(project: Omit<InvestmentProject, 'id' | 'createdAt' | 'updatedAt'>): InvestmentProject {
  const now = new Date().toISOString()
  const entry: InvestmentProject = {
    ...project,
    id: `inv-${String(investmentProjects.length + 1).padStart(3, '0')}`,
    createdAt: now,
    updatedAt: now,
  }
  investmentProjects.push(entry)
  notifyPlatformDataChange()
  return entry
}

export function updateInvestmentProject(id: string, updates: Partial<Omit<InvestmentProject, 'id' | 'createdAt'>>): InvestmentProject | null {
  const idx = investmentProjects.findIndex((p) => p.id === id)
  if (idx === -1) return null
  investmentProjects[idx] = {
    ...investmentProjects[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  notifyPlatformDataChange()
  return investmentProjects[idx]
}
