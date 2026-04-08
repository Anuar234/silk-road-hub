CREATE TABLE shipments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id         UUID NOT NULL REFERENCES deals(id),
    origin          VARCHAR(255) NOT NULL DEFAULT '',
    destination     VARCHAR(255) NOT NULL DEFAULT '',
    route_name      VARCHAR(255) NOT NULL DEFAULT '',
    stages          JSONB NOT NULL DEFAULT '[]',
    document_ids    UUID[] NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shipments_deal ON shipments(deal_id);

CREATE TABLE route_templates (
    id              VARCHAR(50) PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    origin          VARCHAR(255) NOT NULL,
    destination     VARCHAR(255) NOT NULL,
    stages          TEXT[] NOT NULL DEFAULT '{}'
);

INSERT INTO route_templates (id, name, origin, destination, stages) VALUES
    ('route-kz-cn', 'Казахстан → Китай', 'Казахстан', 'Китай',
     ARRAY['Отгрузка со склада','Таможенное оформление (КЗ)','Транзит Хоргос','Таможенное оформление (КНР)','Доставка получателю']),
    ('route-kz-tr', 'Казахстан → Турция', 'Казахстан', 'Турция',
     ARRAY['Отгрузка со склада','Таможенное оформление (КЗ)','Транзит Каспий / Грузия','Таможенное оформление (ТР)','Доставка получателю']),
    ('route-kz-ae', 'Казахстан → ОАЭ', 'Казахстан', 'ОАЭ',
     ARRAY['Отгрузка со склада','Таможенное оформление (КЗ)','Морской транзит (Актау → Бандар-Аббас → Дубай)','Таможенное оформление (ОАЭ)','Доставка получателю']),
    ('route-kz-uz', 'Казахстан → Узбекистан', 'Казахстан', 'Узбекистан',
     ARRAY['Отгрузка со склада','Таможенное оформление (КЗ)','Транзит автодорога / ж/д','Таможенное оформление (УЗ)','Доставка получателю']),
    ('route-kz-de', 'Казахстан → Германия', 'Казахстан', 'Германия',
     ARRAY['Отгрузка со склада','Таможенное оформление (КЗ)','Ж/д транзит (Россия / Беларусь / Польша)','Таможенное оформление (ЕС)','Доставка получателю']),
    ('route-kz-in', 'Казахстан → Индия', 'Казахстан', 'Индия',
     ARRAY['Отгрузка со склада','Таможенное оформление (КЗ)','Морской транзит (Актау → Мумбаи)','Таможенное оформление (ИН)','Доставка получателю']),
    ('route-kz-kr', 'Казахстан → Южная Корея', 'Казахстан', 'Южная Корея',
     ARRAY['Отгрузка со склада','Таможенное оформление (КЗ)','Ж/д → морской транзит (Китай → Корея)','Таможенное оформление (КР)','Доставка получателю']);
