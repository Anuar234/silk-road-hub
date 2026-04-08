-- Seed demo users (passwords hashed with bcrypt, cost 10)
-- Test123 => $2a$10$... , Admin => $2a$10$...
-- Using pre-computed hashes for 'Test123' and 'Admin'

INSERT INTO users (id, email, password_hash, display_name, role, verified, email_verified, company_name, bin, position, phone, verification_status) VALUES
  ('00000000-0000-0000-0000-000000000001', 'buyer@test.com',    '$2a$10$pU/MNMAf8GPCzf0N5F.1Set/Mg6rChjWZkW9Mn8ZPc1kEGdp87qPa', 'Test Buyer',          'buyer',  false, false, '', '', '', '', 'pending'),
  ('00000000-0000-0000-0000-000000000002', 'verified@test.com', '$2a$10$pU/MNMAf8GPCzf0N5F.1Set/Mg6rChjWZkW9Mn8ZPc1kEGdp87qPa', 'Покупатель (верифицирован)', 'buyer', true, true, '', '', '', '', 'verified'),
  ('00000000-0000-0000-0000-000000000003', 'seller@demo.com',   '$2a$10$pU/MNMAf8GPCzf0N5F.1Set/Mg6rChjWZkW9Mn8ZPc1kEGdp87qPa', 'Test Seller',         'seller', true, true, 'Test Company', '000000000001', 'Менеджер по продажам', '', 'verified'),
  ('00000000-0000-0000-0000-000000000004', 'admin@demo.com',    '$2a$10$MuRYxlqvVe2cb/ncqu9.YuQe.omURTY1KLaaEdGpO6.j3Fs5NRKhO', 'Администратор',       'admin',  true, true, '', '', '', '', 'verified')
ON CONFLICT (email) DO NOTHING;

-- Seed investment projects
INSERT INTO investment_projects (id, title, description, sector, region_code, volume_usd, stage, source, initiator, contact_email, tags) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Строительство завода по переработке масличных культур',
   'Проект предусматривает строительство завода по глубокой переработке подсолнечника и рапса мощностью 200 000 тонн/год.',
   'agro', 'KZ-SEV', 45000000, 'feasibility', 'kazakh_invest', 'АО «КазАгроИнвест»', 'invest@kazagroinvest.kz',
   ARRAY['масличные', 'переработка', 'экспорт']),

  ('10000000-0000-0000-0000-000000000002', 'Логистический хаб «Хоргос — Сухой порт»',
   'Создание мультимодального логистического центра на границе Казахстана и Китая.',
   'logistics', 'KZ-ALM', 120000000, 'design', 'ppp', 'СЭЗ «Хоргос — Восточные ворота»', 'projects@khorgos.kz',
   ARRAY['логистика', 'транзит', 'Китай']),

  ('10000000-0000-0000-0000-000000000003', 'Солнечная электростанция 100 МВт',
   'Строительство солнечной электростанции мощностью 100 МВт в Туркестанской области.',
   'energy', 'KZ-TUR', 85000000, 'construction', 'kazakh_invest', 'SunPower Central Asia', 'ca@sunpower.com',
   ARRAY['солнечная энергия', 'ВИЭ', 'электростанция']),

  ('10000000-0000-0000-0000-000000000004', 'Текстильный кластер в Шымкенте',
   'Создание вертикально интегрированного текстильного кластера от сырья до готовой продукции.',
   'textile', 'KZ-SHY', 60000000, 'concept', 'private', 'ТОО «SilkTextile Group»', 'invest@silktextile.kz',
   ARRAY['текстиль', 'кластер', 'хлопок']),

  ('10000000-0000-0000-0000-000000000005', 'Фармацевтический завод дженериков',
   'Производство лекарственных средств-дженериков для внутреннего рынка и экспорта.',
   'pharma', 'KZ-ALA', 35000000, 'feasibility', 'private', 'PharmaKZ Holdings', 'biz@pharmakz.kz',
   ARRAY['фармацевтика', 'дженерики', 'производство']),

  ('10000000-0000-0000-0000-000000000006', 'Завод по производству строительных смесей',
   'Производство сухих строительных смесей мощностью 500 000 тонн/год.',
   'construction', 'KZ-KAR', 18000000, 'construction', 'private', 'ТОО «BuildMix KZ»', 'info@buildmix.kz',
   ARRAY['строительство', 'смеси', 'производство']),

  ('10000000-0000-0000-0000-000000000007', 'Кластер глубокой переработки меди',
   'Проект глубокой переработки меди с выпуском медной катанки и проволоки.',
   'metals', 'KZ-ULY', 200000000, 'design', 'kazakh_invest', 'Copper Valley Ltd', 'invest@coppervalley.kz',
   ARRAY['медь', 'металлургия', 'переработка'])
ON CONFLICT DO NOTHING;

-- Seed products (using demo seller)
INSERT INTO products (id, slug, name, category, hs_code, moq, incoterms, price, lead_time_days, packaging, description, seller_id, country_code, region_code, sector_id, subcategory_id, tags, samples_available, private_label, status) VALUES
  (gen_random_uuid(), 'organicheskij-myod-500g', 'Органический мёд 500г', 'FMCG', '040900', '10 000 units', 'FOB', '1.60–2.40 USD/unit', 14, 'Стекло 500г, картон', 'Натуральный мёд из экологически чистых регионов Казахстана.', '00000000-0000-0000-0000-000000000003', 'KZ', 'KZ-ALA', 'agro', 'agro-honey', ARRAY['мёд', 'органик', 'halal'], true, true, 'published'),
  (gen_random_uuid(), 'podsolnechnoe-maslo', 'Подсолнечное масло', 'Agro', '151219', '1 контейнер', 'CIF', '920–1350 USD/ton', 21, 'PET 1л/5л, flexitank', 'Рафинированное подсолнечное масло. Экспортное качество.', '00000000-0000-0000-0000-000000000003', 'KZ', 'KZ-ALA', 'agro', 'agro-oilseed', ARRAY['масло', 'подсолнечное'], false, false, 'published'),
  (gen_random_uuid(), 'muka-pshenichnaya-premium', 'Мука пшеничная премиум', 'Agro', '110100', '1 контейнер', 'CIF', '380–520 USD/ton', 10, 'Мешки 25/50 кг', 'Мука высшего сорта из казахстанской пшеницы.', '00000000-0000-0000-0000-000000000003', 'KZ', 'KZ-KOS', 'fmcg', 'fmcg-flour', ARRAY['мука', 'зерновые'], false, false, 'published'),
  (gen_random_uuid(), 'khlopkovye-futbolki', 'Хлопковые футболки', 'Textile', '610910', '20 000 units', 'EXW', '2.10–4.20 USD/unit', 30, 'Упаковка по 10 шт', 'Хлопковые футболки для private label и retail.', '00000000-0000-0000-0000-000000000003', 'KZ', 'KZ-SHY', 'textile', 'textile-apparel', ARRAY['текстиль', 'одежда', 'хлопок'], true, true, 'published'),
  (gen_random_uuid(), 'finiki-premium', 'Финики premium', 'FMCG', '080410', '1 контейнер', 'CIF', '1.80–2.40 USD/kg', 12, 'Картон 5 кг', 'Финики высшего сорта Medjool и Deglet Nour.', '00000000-0000-0000-0000-000000000003', 'KZ', NULL, 'agro', 'agro-nuts', ARRAY['финики', 'сухофрукты'], true, true, 'published'),
  (gen_random_uuid(), 'nut-dlya-pererabotki', 'Нут для переработки', 'Agro', '071320', '1 контейнер', 'FOB', '520–680 USD/ton', 18, 'Мешки 50 кг', 'Нут крупный калибр 8+ мм для переработки.', '00000000-0000-0000-0000-000000000003', 'KZ', 'KZ-KOS', 'agro', 'agro-grains', ARRAY['нут', 'бобовые'], false, false, 'published'),
  (gen_random_uuid(), 'kuraga-sun-dried', 'Курага sun-dried', 'FMCG', '081310', '1 контейнер', 'CIF', '2.40–3.10 USD/kg', 15, 'Картон 10 кг', 'Натуральная курага без обработки SO2.', '00000000-0000-0000-0000-000000000003', 'KZ', NULL, 'agro', 'agro-nuts', ARRAY['курага', 'сухофрукты'], false, false, 'published'),
  (gen_random_uuid(), 'led-svetilniki', 'LED-светильники промышленные', 'Энергетика', '940540', '100 units', 'DAP', '12–45 USD/unit', 14, 'Индивидуальная', 'Промышленные LED-светильники IP65/IP67.', '00000000-0000-0000-0000-000000000003', 'DE', NULL, 'energy', 'energy-led', ARRAY['LED', 'освещение'], false, false, 'published'),
  (gen_random_uuid(), 'poluprovodniki', 'Полупроводники и микросхемы', 'Электроника', '8542', 'от 1000 шт', 'EXW', 'по запросу', 21, 'Антистатик', 'Полупроводники, чипы, микросхемы промышленного класса.', '00000000-0000-0000-0000-000000000003', 'KR', NULL, 'tech', 'tech-semiconductors', ARRAY['полупроводники', 'электроника'], false, false, 'published'),
  (gen_random_uuid(), 'syr-tvyordyj', 'Сыр твёрдый (экспорт)', 'FMCG', '040690', '500 kg', 'CIF', '4.50–7.00 USD/kg', 28, 'Вакуум, картон', 'Твёрдые сыры европейского качества.', '00000000-0000-0000-0000-000000000003', 'PL', NULL, 'fmcg', 'fmcg-dairy', ARRAY['сыр', 'молочные'], true, false, 'published')
ON CONFLICT DO NOTHING;
