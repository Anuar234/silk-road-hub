# Silk Road Hub — Delivery Notes (Pilot / Этап 1)

## Что входит в поставку

Web-платформа сопровождения экспортных и инвестиционных проектов РК, соответствующая разделу 10 ТЗ «Этап 1 — Пилотный».

**Реализовано:**
- Публичная часть: главная, каталог товаров (с иерархическими фильтрами и поиском), каталог инвест-проектов, аналитика/новости, контакты
- Регистрация и базовая верификация пользователей (роли buyer/seller/admin)
- CRUD товарных объявлений (экспортёр), модерация через админ-панель
- Каркас сделок, контрактов, логистики и финансово-гарантийных операций (API + схема БД)
- Админ-панель (15 экранов): пользователи, сделки, документы, верификация, каталог, статистика
- Адаптивный дизайн (desktop / планшет / мобильный)
- Безопасность: bcrypt-хэширование паролей, HttpOnly + CSRF cookies, CSP, rate-limit на логине
- Docker-compose для локального запуска, Dockerfile для Railway-деплоя, CI-пайплайн (lint/typecheck/unit/build/e2e)

**Ограничения пилотного этапа (по ТЗ разд. 10):**
- Email/SMS-подтверждение — ручная верификация через админ-панель
- Онлайн-платежи и ЭЦП — отсутствуют, как указано в ТЗ 5.6
- Мультиязычность (EN/KZ/RU/CN) — зафиксирована в Этапе 2
- Real-time чат сделок — polling вместо WebSocket
- Отдельные кабинеты инвестора и институционального пользователя — запланированы на Этап 2
- UI контрактного/логистического/финансового модулей — вне scope пилота (готовы API и схема БД)

## Учётная запись администратора

После первого запуска backend'а и применения миграций (автоматически при `SRH_RUN_MIGRATIONS=true`) создаётся начальный администратор:

```
Email:    admin@silkroadhub.kz
Password: Admin123!SRH
```

**⚠️ ОБЯЗАТЕЛЬНО смените пароль в production.** Для этого:
1. Войти в систему под указанными креденшлами
2. Открыть профиль и обновить данные через `PUT /api/auth/profile` (UI в разработке)
   — либо вручную через `psql`: `UPDATE users SET password_hash = '<новый-bcrypt>' WHERE email = 'admin@silkroadhub.kz';`
   Новый хэш сгенерировать командой: `go run ./backend/cmd/seedhash <новый-пароль>` (временно восстановите директорию из git, если удалили, или любым bcrypt-cost-10 инструментом)

## Как запустить локально

Требуется: Docker + Docker Compose.

```bash
# 1. Сгенерировать секреты в .env (корень проекта)
cp .env.example .env
# отредактируйте .env:
#   SRH_SESSION_SECRET=<результат `openssl rand -base64 48`>
#   POSTGRES_PASSWORD=<сильный пароль>

# 2. Поднять всё разом
docker-compose up --build

# 3. Открыть http://localhost:3000
```

Backend слушает 8080, frontend — 3000. Postgres и Redis закрыты от внешней сети (bind на loopback).

## Development workflow

Нужен Node 20, Go 1.23, Docker.

```bash
# Поднять только БД и Redis
docker-compose up postgres redis -d

# В одном терминале — Go backend
cd backend
export SRH_DB_URL=postgres://srh:<pwd>@127.0.0.1:5435/silkroadhub?sslmode=disable
export SRH_REDIS_URL=redis://127.0.0.1:6379/0
export SRH_SESSION_SECRET=<long-secret>
export SRH_CORS_ORIGIN=http://localhost:3000
export SRH_RUN_MIGRATIONS=true
go run ./cmd/server

# В другом терминале — Next.js frontend
export API_BACKEND_URL=http://127.0.0.1:8080
npm install
npm run dev
```

## Архитектура

- **Frontend:** Next.js 15.5 (Pages Router shell) + React 19 SPA на react-router-dom (HashRouter), FSD-слои, Tailwind 4
- **Backend:** Go 1.23 (Gin) + pgx/v5 + PostgreSQL 16 + Redis 7 (сессии)
- **API-контракт:** `/api/*` на фронте → Next.js rewrites → Go-сервис. Единственный источник истины — Go + PostgreSQL
- **Миграции:** golang-migrate, применяются автоматически при старте Go-сервиса при `SRH_RUN_MIGRATIONS=true`
- **Файлы:** upload на диск backend'а, проверка magic-bytes (PDF/PNG/JPG/DOCX), размер ≤ 10 МБ

## Деплой на Railway

См. `RAILWAY_DEPLOY.md`.

## Передача исходного кода

Репозиторий включает:
- Исходный код frontend (`src/`, `pages/`) и backend (`backend/`)
- Docker-файлы и docker-compose
- ТЗ (`ТЗ.pdf`, `ТЗ.docx`)
- CI-пайплайн (`.github/workflows/`)
- Тесты: 8 юнит-тестов (vitest) + 5 e2e-сценариев (playwright)
- Миграции БД (`backend/migrations/`) — 10 шт., с up/down парами

## Что рекомендуется на Этап 2

Оценка: 4–6 недель одним full-stack разработчиком.

1. Мультиязычность EN/KZ/RU/CN (next-intl + каркас переводов)
2. Отдельные ЛК инвестора и институционального пользователя
3. UI контрактного модуля (шаблоны, применимое право, upload подписанных)
4. UI логистического модуля (маршруты, этапы, документы)
5. UI финансово-гарантийного модуля (этапы расчётов, KazakhExport)
6. LOI/MOU фиксация в сделках
7. Audit log (журнал действий пользователей, ТЗ 9)
8. Email/SMS провайдер для автоверификации (SendGrid/Postmark + Vonage/smsc)
9. Редактор новостей в админке + таблица `news`
10. Справочники `categories / countries / regions` в БД + админ-CRUD
11. Реальные KPI-графики (Recharts) по данным Postgres
12. Бэкап-стратегия (pg_dump cron → S3)
13. Observability: Sentry, request-id в логах, Prometheus metrics
14. SEO через миграцию SPA на Next App Router
15. Покрытие Go-тестами (handlers/services/repo)
