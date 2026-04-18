# Развёртывание Silk Road Hub на Railway

## Предпосылки

- Railway-аккаунт
- Railway CLI: `npm i -g @railway/cli`
- Git-репозиторий проекта запушен (Railway будет деплоить из git)

## Структура Railway-проекта

В одном проекте должно быть 4 сервиса:

| Сервис | Тип | Источник |
|---|---|---|
| `postgres` | Plugin | Railway marketplace → PostgreSQL |
| `redis` | Plugin | Railway marketplace → Redis |
| `backend` | Service | Этот repo, корень `backend/`, Dockerfile `backend/Dockerfile` |
| `frontend` | Service | Этот repo, корень `.`, Dockerfile `Dockerfile.frontend` |

## Шаг 1. Создать проект и плагины

```bash
railway login
railway init          # создать проект (или railway link к существующему)
```

В Railway UI:
1. **+ New → Database → PostgreSQL** — появится сервис `Postgres` с переменной `DATABASE_URL`
2. **+ New → Database → Redis** — появится сервис `Redis` с переменной `REDIS_URL`

## Шаг 2. Деплой backend

В Railway UI:
1. **+ New → GitHub Repo** → выбрать репозиторий
2. В настройках сервиса:
   - **Root directory:** `backend`
   - **Build:** Dockerfile (Railway определит автоматически)
3. **Variables** (скопировать из `postgres` и `redis` сервисов через Reference):
   ```
   SRH_DB_URL          = ${{Postgres.DATABASE_URL}}
   SRH_REDIS_URL       = ${{Redis.REDIS_URL}}
   SRH_SESSION_SECRET  = <сгенерировать: openssl rand -base64 48>
   SRH_CORS_ORIGIN     = https://<frontend-service>.up.railway.app
   SRH_SECURE_COOKIES  = true
   SRH_RUN_MIGRATIONS  = true
   SRH_UPLOAD_DIR      = /app/storage/uploads
   PORT                = 8080
   ```
4. **Deploy**. Первый запуск применит миграции и создаст admin'а (`admin@silkroadhub.kz` / `Admin123!SRH`).

⚠️ **Важно:** файловые загрузки (`/app/storage/uploads`) на Railway без volume теряются при редеплое. На production нужно либо подключить volume, либо перевести хранение файлов на S3/Railway-объектное хранилище (Этап 2).

## Шаг 3. Деплой frontend

1. **+ New → GitHub Repo** → тот же репозиторий
2. В настройках сервиса:
   - **Root directory:** `/` (корень)
   - **Build:** Dockerfile `Dockerfile.frontend`
3. **Variables:**
   ```
   NODE_ENV             = production
   API_BACKEND_URL      = ${{backend.RAILWAY_PRIVATE_DOMAIN}}:8080
                          # либо публичный: https://<backend-service>.up.railway.app
   CSP_STRICT_ENABLED   = true
   ```
4. **Domain** — сгенерировать публичный домен для frontend. Скопировать его в `SRH_CORS_ORIGIN` бэкенда.
5. **Redeploy backend** после обновления CORS.

## Шаг 4. Проверка

```bash
# backend
curl https://<backend>.up.railway.app/api/auth/csrf
# должен вернуть {"csrfToken": "..."}

# frontend
открыть https://<frontend>.up.railway.app
попробовать войти под admin@silkroadhub.kz / Admin123!SRH
```

## Обновление и откат

- **Обновление:** просто push в main → Railway пересоберёт и задеплоит.
- **Откат:** в Railway UI каждого сервиса есть вкладка **Deployments** — можно откатиться на предыдущий build в один клик.

## Сразу после первого деплоя — обязательно

1. Сменить пароль admin'а (см. `DELIVERY.md` → раздел «Учётная запись администратора»)
2. Убедиться, что в backend-сервисе стоит `SRH_SECURE_COOKIES=true`
3. Убедиться, что в frontend-сервисе `CSP_STRICT_ENABLED=true`
4. Убедиться, что `SRH_CORS_ORIGIN` указывает **ровно** на домен frontend'а (без trailing slash)
5. Настроить бэкапы Postgres через Railway **Backups** (для Pro-плана — автоматические; для базового — `pg_dump` cron на внешней машине)
