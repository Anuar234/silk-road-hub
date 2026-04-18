# Silk Road Hub

B2B-платформа сопровождения экспортных и инвестиционных проектов Республики Казахстан.

## Быстрый старт (локально через Docker)

```bash
cp .env.example .env
# обязательно задать SRH_SESSION_SECRET и POSTGRES_PASSWORD

docker-compose up --build
# → http://localhost:3000
```

Учётная запись администратора после первого запуска:
`admin@silkroadhub.kz` / `Admin123!SRH` (обязательно сменить в production).

## Dev workflow (без докеризации фронта)

Требуется Node 20, Go 1.23, Docker.

```bash
# БД и Redis в контейнерах
docker-compose up postgres redis -d

# Backend в отдельном терминале
cd backend
SRH_DB_URL=postgres://srh:<pwd>@127.0.0.1:5435/silkroadhub?sslmode=disable \
SRH_REDIS_URL=redis://127.0.0.1:6379/0 \
SRH_SESSION_SECRET=<long-secret> \
SRH_CORS_ORIGIN=http://localhost:3000 \
SRH_RUN_MIGRATIONS=true \
go run ./cmd/server

# Frontend в третьем терминале
npm install
API_BACKEND_URL=http://127.0.0.1:8080 npm run dev
```

## Архитектура

- **Frontend:** Next.js 15 (Pages Router shell) + React 19 SPA на HashRouter, FSD-слои, Tailwind 4
- **Backend:** Go 1.23 (Gin) + pgx/v5 + PostgreSQL 16 + Redis 7
- **API:** `/api/*` на фронте → Next.js rewrites → Go-сервис. Источник истины — Go + Postgres.

## Структура репозитория

```
backend/            Go-сервис (cmd/ internal/ migrations/)
pages/              Next.js page shell (index, _app, _document, 404)
src/                Frontend FSD (app, pages, widgets, features, shared)
tests/              vitest unit + playwright e2e
.github/workflows/  CI
docker-compose.yml  Локальное окружение
Dockerfile.frontend Prod-сборка Next.js
railway.json        Railway deploy для frontend
backend/railway.toml Railway deploy для backend
```

## Скрипты

- `npm run dev` — dev-сервер Next.js
- `npm run build` — prod-сборка
- `npm run start` — prod-сервер (после build)
- `npm run lint` / `npm run typecheck` — линт и type-check
- `npm run test:unit` — vitest
- `npm run test:e2e` — playwright

## Деплой

См. [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md).

## Поставка

См. [DELIVERY.md](./DELIVERY.md) — scope пилота (Этап 1 ТЗ), известные ограничения, roadmap Этапа 2.
