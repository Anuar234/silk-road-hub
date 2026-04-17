/** Иерархия каталога: Сектор → Подкатегория → Страна → Товары / Продавцы */

export type SectorId = string
export type SubcategoryId = string
export type CountryCode = string

export type Subcategory = { id: SubcategoryId; name: string }
export type Sector = { id: SectorId; name: string; subcategories: Subcategory[] }

export const CATALOG_SECTORS: Sector[] = [
  {
    id: 'agro',
    name: 'Агросектор',
    subcategories: [
      { id: 'agro-vegetables', name: 'Овощи' },
      { id: 'agro-fruits', name: 'Фрукты' },
      { id: 'agro-berries', name: 'Ягоды' },
      { id: 'agro-grains', name: 'Зерновые и бобовые' },
      { id: 'agro-oilseed', name: 'Масличные культуры' },
      { id: 'agro-honey', name: 'Мёд и продукты пчеловодства' },
      { id: 'agro-nuts', name: 'Орехи и сухофрукты' },
      { id: 'agro-seeds', name: 'Семена и посадочный материал' },
      { id: 'agro-feed', name: 'Корма и добавки' },
    ],
  },
  {
    id: 'fmcg',
    name: 'Пищевая промышленность / FMCG',
    subcategories: [
      { id: 'fmcg-dairy', name: 'Молочная продукция' },
      { id: 'fmcg-meat', name: 'Мясная продукция' },
      { id: 'fmcg-oils', name: 'Масла и жиры' },
      { id: 'fmcg-flour', name: 'Мука и крупы' },
      { id: 'fmcg-confectionery', name: 'Кондитерские изделия' },
      { id: 'fmcg-beverages', name: 'Напитки' },
      { id: 'fmcg-mineral-water', name: 'Минеральная вода' },
      { id: 'fmcg-canned', name: 'Консервы' },
      { id: 'fmcg-frozen', name: 'Замороженные продукты' },
      { id: 'fmcg-organic', name: 'Органические продукты' },
      { id: 'fmcg-private-label', name: 'Private label' },
    ],
  },
  {
    id: 'metals',
    name: 'Металлургия и металлы',
    subcategories: [
      { id: 'metals-ferrous', name: 'Черные металлы' },
      { id: 'metals-nonferrous', name: 'Цветные металлы' },
      { id: 'metals-rare', name: 'Редкие и стратегические металлы' },
      { id: 'metals-alloys', name: 'Сплавы' },
      { id: 'metals-rolled', name: 'Металлопрокат' },
      { id: 'metals-products', name: 'Металлические изделия' },
    ],
  },
  {
    id: 'chemistry',
    name: 'Химия и пластмассы',
    subcategories: [
      { id: 'chem-polymers', name: 'Полимеры' },
      { id: 'chem-plastics', name: 'Пластики' },
      { id: 'chem-plastic-products', name: 'Пластиковые изделия' },
      { id: 'chem-packaging', name: 'Упаковочные материалы' },
      { id: 'chem-industrial', name: 'Промышленная химия' },
      { id: 'chem-fertilizers', name: 'Удобрения' },
      { id: 'chem-rubber', name: 'Резина и каучук' },
    ],
  },
  {
    id: 'construction',
    name: 'Строительные материалы',
    subcategories: [
      { id: 'constr-cement', name: 'Цемент' },
      { id: 'constr-brick', name: 'Кирпич' },
      { id: 'constr-blocks', name: 'Блоки' },
      { id: 'constr-tiles', name: 'Плитка' },
      { id: 'constr-glass', name: 'Стекло' },
      { id: 'constr-cable', name: 'Кабель' },
      { id: 'constr-metal-structures', name: 'Металлоконструкции' },
      { id: 'constr-plumbing', name: 'Сантехника' },
    ],
  },
  {
    id: 'energy',
    name: 'Энергетика и электротехника',
    subcategories: [
      { id: 'energy-cables', name: 'Кабели' },
      { id: 'energy-equipment', name: 'Электрооборудование' },
      { id: 'energy-lighting', name: 'Освещение' },
      { id: 'energy-led', name: 'LED-светильники' },
      { id: 'energy-bulbs', name: 'Лампочки' },
      { id: 'energy-batteries', name: 'Аккумуляторы' },
      { id: 'energy-solar', name: 'Солнечные панели' },
      { id: 'energy-inverters', name: 'Инверторы' },
    ],
  },
  {
    id: 'machinery',
    name: 'Машиностроение и промышленное оборудование',
    subcategories: [
      { id: 'machinery-agro', name: 'Сельхозтехника' },
      { id: 'machinery-pumps', name: 'Насосы' },
      { id: 'machinery-compressors', name: 'Компрессоры' },
      { id: 'machinery-engines', name: 'Двигатели' },
      { id: 'machinery-bearings', name: 'Подшипники' },
      { id: 'machinery-machines', name: 'Станки' },
      { id: 'machinery-parts', name: 'Комплектующие' },
    ],
  },
  {
    id: 'tech',
    name: 'Технологии и электроника',
    subcategories: [
      { id: 'tech-chips', name: 'Чипы и микросхемы' },
      { id: 'tech-semiconductors', name: 'Полупроводники' },
      { id: 'tech-modules', name: 'Электронные модули' },
      { id: 'tech-sensors', name: 'Сенсоры' },
      { id: 'tech-iot', name: 'IoT-устройства' },
      { id: 'tech-servers', name: 'Серверные компоненты' },
      { id: 'tech-components', name: 'Электронные комплектующие' },
    ],
  },
  {
    id: 'textile',
    name: 'Текстиль и легкая промышленность',
    subcategories: [
      { id: 'textile-fabrics', name: 'Ткани' },
      { id: 'textile-cotton', name: 'Хлопок' },
      { id: 'textile-yarn', name: 'Пряжа' },
      { id: 'textile-apparel', name: 'Одежда' },
      { id: 'textile-footwear', name: 'Обувь' },
      { id: 'textile-workwear', name: 'Рабочая форма' },
      { id: 'textile-home', name: 'Домашний текстиль' },
      { id: 'textile-leather', name: 'Кожа' },
    ],
  },
  {
    id: 'pharma',
    name: 'Фармацевтика и медицина',
    subcategories: [
      { id: 'pharma-consumables', name: 'Медицинские расходники' },
      { id: 'pharma-packaging', name: 'Медицинская упаковка' },
      { id: 'pharma-lab', name: 'Лабораторные материалы' },
      { id: 'pharma-devices', name: 'Медицинские изделия' },
    ],
  },
  {
    id: 'forest',
    name: 'Лес, бумага и упаковка',
    subcategories: [
      { id: 'forest-paper', name: 'Бумага' },
      { id: 'forest-cardboard', name: 'Картон' },
      { id: 'forest-corrugated', name: 'Гофроупаковка' },
      { id: 'forest-wood', name: 'Деревянные изделия' },
      { id: 'forest-pallets', name: 'Паллеты' },
      { id: 'forest-export-pack', name: 'Экспортная упаковка' },
    ],
  },
  {
    id: 'logistics',
    name: 'Логистика и услуги',
    subcategories: [
      { id: 'logistics-international', name: 'Международная логистика' },
      { id: 'logistics-warehousing', name: 'Складирование' },
      { id: 'logistics-customs', name: 'Таможенное оформление' },
      { id: 'logistics-certification', name: 'Сертификация' },
      { id: 'logistics-insurance', name: 'Страхование' },
      { id: 'logistics-trade-finance', name: 'Торговое финансирование' },
      { id: 'logistics-legal', name: 'Юридическая поддержка' },
      { id: 'logistics-translation', name: 'Переводы' },
    ],
  },
]

export const CATALOG_COUNTRIES: { code: CountryCode; name: string }[] = [
  { code: 'KZ', name: 'Казахстан' },
  { code: 'UZ', name: 'Узбекистан' },
  { code: 'KG', name: 'Кыргызстан' },
  { code: 'TJ', name: 'Таджикистан' },
  { code: 'TM', name: 'Туркменистан' },
  { code: 'GE', name: 'Грузия' },
  { code: 'AM', name: 'Армения' },
  { code: 'AZ', name: 'Азербайджан' },
  { code: 'TR', name: 'Турция' },
  { code: 'CN', name: 'Китай' },
  { code: 'AE', name: 'ОАЭ' },
  { code: 'SA', name: 'Саудовская Аравия' },
  { code: 'IN', name: 'Индия' },
  { code: 'DE', name: 'Германия' },
  { code: 'PL', name: 'Польша' },
  { code: 'IT', name: 'Италия' },
  { code: 'NL', name: 'Нидерланды' },
  { code: 'KR', name: 'Южная Корея' },
  { code: 'JP', name: 'Япония' },
  { code: 'US', name: 'США' },
  { code: 'CA', name: 'Канада' },
]

/* ── Регионы Казахстана (17 областей + 3 города республиканского значения) ── */

export type RegionCode = string

export type Region = { code: RegionCode; name: string }

export const KZ_REGIONS: Region[] = [
  { code: 'KZ-AKM', name: 'Акмолинская область' },
  { code: 'KZ-AKT', name: 'Актюбинская область' },
  { code: 'KZ-ALM', name: 'Алматинская область' },
  { code: 'KZ-ATY', name: 'Атырауская область' },
  { code: 'KZ-VOS', name: 'Восточно-Казахстанская область' },
  { code: 'KZ-ZHM', name: 'Жамбылская область' },
  { code: 'KZ-ZAP', name: 'Западно-Казахстанская область' },
  { code: 'KZ-KAR', name: 'Карагандинская область' },
  { code: 'KZ-KOS', name: 'Костанайская область' },
  { code: 'KZ-KYZ', name: 'Кызылординская область' },
  { code: 'KZ-MAN', name: 'Мангистауская область' },
  { code: 'KZ-PAV', name: 'Павлодарская область' },
  { code: 'KZ-SEV', name: 'Северо-Казахстанская область' },
  { code: 'KZ-TUR', name: 'Туркестанская область' },
  { code: 'KZ-ULY', name: 'Улытауская область' },
  { code: 'KZ-ABA', name: 'Абайская область' },
  { code: 'KZ-ZHE', name: 'Жетысуская область' },
  { code: 'KZ-AST', name: 'г. Астана' },
  { code: 'KZ-ALA', name: 'г. Алматы' },
  { code: 'KZ-SHY', name: 'г. Шымкент' },
]

export function getRegionByCode(code: RegionCode): Region | undefined {
  return KZ_REGIONS.find((r) => r.code === code)
}

/** Маппинг названия страны (как в данных) к коду для фильтрации */
export const COUNTRY_NAME_TO_CODE: Record<string, CountryCode> = Object.fromEntries(
  CATALOG_COUNTRIES.map((c) => [c.name, c.code])
)

export function getSectorById(id: SectorId): Sector | undefined {
  return CATALOG_SECTORS.find((s) => s.id === id)
}

export function getSubcategoryById(sectorId: SectorId, subcategoryId: SubcategoryId): Subcategory | undefined {
  const sector = getSectorById(sectorId)
  return sector?.subcategories.find((s) => s.id === subcategoryId)
}

export function getCountryByCode(code: CountryCode) {
  return CATALOG_COUNTRIES.find((c) => c.code === code)
}

export function getCountryCodeByName(name: string): CountryCode | undefined {
  return COUNTRY_NAME_TO_CODE[name]
}
