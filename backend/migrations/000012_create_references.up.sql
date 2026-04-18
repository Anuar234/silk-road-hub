-- Reference directories required by ТЗ 5.9, 5.10, 5.12
-- 8 categories with icons, international countries list, Kazakhstan regions.

CREATE TABLE countries (
    code       CHAR(2) PRIMARY KEY,
    name_ru    VARCHAR(128) NOT NULL,
    name_en    VARCHAR(128) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 100,
    is_active  BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE regions (
    code         VARCHAR(16) PRIMARY KEY,
    country_code CHAR(2) NOT NULL REFERENCES countries(code) ON DELETE CASCADE,
    name_ru      VARCHAR(128) NOT NULL,
    name_en      VARCHAR(128) NOT NULL,
    sort_order   INTEGER NOT NULL DEFAULT 100,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX idx_regions_country ON regions(country_code);

CREATE TABLE categories (
    id         VARCHAR(32) PRIMARY KEY,
    name_ru    VARCHAR(128) NOT NULL,
    name_en    VARCHAR(128) NOT NULL,
    icon       VARCHAR(64) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 100,
    is_active  BOOLEAN NOT NULL DEFAULT TRUE
);

-- Seed: international countries list (RK prioritized)
INSERT INTO countries (code, name_ru, name_en, sort_order) VALUES
    ('KZ', 'Казахстан',            'Kazakhstan',         1),
    ('RU', 'Россия',                'Russia',            10),
    ('CN', 'Китай',                 'China',             20),
    ('UZ', 'Узбекистан',            'Uzbekistan',        30),
    ('KG', 'Кыргызстан',            'Kyrgyzstan',        40),
    ('TJ', 'Таджикистан',           'Tajikistan',        50),
    ('TM', 'Туркменистан',          'Turkmenistan',      60),
    ('AZ', 'Азербайджан',           'Azerbaijan',        70),
    ('AM', 'Армения',               'Armenia',           80),
    ('GE', 'Грузия',                'Georgia',           90),
    ('TR', 'Турция',                'Türkiye',          100),
    ('IR', 'Иран',                  'Iran',             110),
    ('IN', 'Индия',                 'India',            120),
    ('PK', 'Пакистан',              'Pakistan',         130),
    ('AE', 'ОАЭ',                   'UAE',              140),
    ('SA', 'Саудовская Аравия',     'Saudi Arabia',     150),
    ('DE', 'Германия',              'Germany',          160),
    ('NL', 'Нидерланды',            'Netherlands',      170),
    ('IT', 'Италия',                'Italy',            180),
    ('GB', 'Великобритания',        'United Kingdom',   190),
    ('US', 'США',                   'USA',              200);

-- Seed: 17 regions + 3 cities of republican significance (ТЗ 5.12)
INSERT INTO regions (code, country_code, name_ru, name_en, sort_order) VALUES
    ('KZ-AKM', 'KZ', 'Акмолинская область',              'Akmola Region',           10),
    ('KZ-AKT', 'KZ', 'Актюбинская область',              'Aktobe Region',           20),
    ('KZ-ALM', 'KZ', 'Алматинская область',              'Almaty Region',           30),
    ('KZ-ATY', 'KZ', 'Атырауская область',               'Atyrau Region',           40),
    ('KZ-VKO', 'KZ', 'Восточно-Казахстанская область',   'East Kazakhstan Region',  50),
    ('KZ-ZHM', 'KZ', 'Жамбылская область',               'Zhambyl Region',          60),
    ('KZ-ZHT', 'KZ', 'Жетысуская область',               'Zhetisu Region',          70),
    ('KZ-KAR', 'KZ', 'Карагандинская область',           'Karaganda Region',        80),
    ('KZ-KST', 'KZ', 'Костанайская область',             'Kostanay Region',         90),
    ('KZ-KZY', 'KZ', 'Кызылординская область',           'Kyzylorda Region',       100),
    ('KZ-MAN', 'KZ', 'Мангистауская область',            'Mangystau Region',       110),
    ('KZ-PAV', 'KZ', 'Павлодарская область',             'Pavlodar Region',        120),
    ('KZ-SKO', 'KZ', 'Северо-Казахстанская область',     'North Kazakhstan Region',130),
    ('KZ-TRK', 'KZ', 'Туркестанская область',            'Turkistan Region',       140),
    ('KZ-ULY', 'KZ', 'Улытауская область',               'Ulytau Region',          150),
    ('KZ-ABA', 'KZ', 'Область Абай',                     'Abai Region',            160),
    ('KZ-ZKO', 'KZ', 'Западно-Казахстанская область',    'West Kazakhstan Region', 170),
    ('KZ-AST', 'KZ', 'Астана',                           'Astana',                 200),
    ('KZ-ALA', 'KZ', 'Алматы',                           'Almaty',                 210),
    ('KZ-SHY', 'KZ', 'Шымкент',                          'Shymkent',               220);

-- Seed: 8 categories from ТЗ 5.9
INSERT INTO categories (id, name_ru, name_en, icon, sort_order) VALUES
    ('food',         'Продовольственные товары',       'Food products',         'food.svg',         10),
    ('agro',         'Сельское хозяйство',             'Agriculture',           'agro.svg',         20),
    ('textiles',     'Текстиль и одежда',              'Textiles & apparel',    'textiles.svg',     30),
    ('construction', 'Строительные материалы',         'Construction materials','construction.svg', 40),
    ('household',    'Товары для дома и быта',         'Household goods',       'household.svg',    50),
    ('metals',       'Металлопродукция',               'Metal products',        'metals.svg',       60),
    ('creative',     'Продукция креативной индустрии', 'Creative industry',     'creative.svg',     70),
    ('other',        'Прочие товары',                  'Other goods',           'other.svg',        80);
