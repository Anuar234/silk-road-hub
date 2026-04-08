# Technical Code of Conduct — Silk Road Hub

Версия: 1.0
Дата: 2026-04-02

---

## 1. Стек технологий

| Слой | Технология | Версия |
|------|-----------|--------|
| Framework | Next.js (Pages Router) | 15.x |
| UI | React | 19.x |
| Routing (SPA) | react-router-dom (HashRouter) | 7.x |
| Стили | Tailwind CSS 4 + PostCSS | 4.x |
| Язык | TypeScript (strict) | 5.9 |
| Иконки | lucide-react | 0.577+ |
| Утилиты CSS | clsx | 2.x |
| Тесты (unit) | Vitest + jsdom | 3.x |
| Тесты (e2e) | Playwright | 1.54+ |
| Линтинг | ESLint 9 + typescript-eslint | 9.x |
| Пакетный менеджер | npm | 10+ |

---

## 2. Архитектура проекта

### 2.1. Общая схема

Проект использует **гибридную архитектуру**: Next.js Pages Router для серверных API-маршрутов и SSR-оболочки, внутри которой работает React SPA с клиентским роутингом через HashRouter.

```
Next.js (pages/)            — API routes, SSR shell, _app, _document
  └── ClientAppShell        — мост между Next.js и SPA
       └── React SPA (src/) — весь UI, роутинг, бизнес-логика
```

### 2.2. Структура директорий

```
├── docs/                  — документация проекта
├── pages/                 — Next.js pages router
│   ├── api/auth/          — эндпоинты авторизации
│   ├── api/files/         — эндпоинты файлового хранилища
│   ├── api/_lib/          — серверные утилиты (authServer, fileStore)
│   ├── _app.tsx           — Next.js entry point
│   ├── _document.tsx      — HTML shell
│   └── index.tsx          — делегирует в ClientAppShell
├── public/                — статические ассеты
├── scripts/               — утилиты запуска (demo, offline)
├── src/                   — основной исходный код
│   ├── adapters/          — HTTP-клиенты и абстракции хранилищ
│   ├── auth/              — AuthProvider, guards (RequireAuth, RequireAdmin, etc.)
│   ├── components/
│   │   ├── deal/          — компоненты сделок (DealModal)
│   │   ├── layout/        — макеты (PublicLayout, AppLayout, AdminLayout)
│   │   ├── ui/            — UI-kit (Button, Card, Input, Badge, Tabs, etc.)
│   │   └── utils/         — утилиты компонентов (cx)
│   ├── data/              — in-memory хранилище и бизнес-данные
│   ├── features/          — фичи с собственной логикой (catalog/)
│   ├── hooks/             — кастомные React-хуки
│   ├── next/              — Next.js compatibility shell (ClientAppShell)
│   └── pages/             — страницы приложения
│       ├── admin/         — страницы админ-панели
│       └── app/           — страницы личного кабинета
├── tests/
│   ├── e2e/               — Playwright-тесты
│   └── unit/              — Vitest-тесты
└── [конфиги]              — tsconfig, next.config, eslint, postcss, etc.
```

---

## 3. Конвенции именования

### 3.1. Файлы

| Тип | Формат | Пример |
|-----|--------|--------|
| React-компонент (страница) | PascalCase + суффикс `Page` | `AdminDealsPage.tsx` |
| React-компонент (UI) | PascalCase | `Button.tsx`, `Card.tsx` |
| React-компонент (layout) | PascalCase + суффикс `Layout` | `AppLayout.tsx` |
| Хук | camelCase с префиксом `use` | `useDebounce.ts` |
| Утилита / логика | camelCase | `catalogFilters.ts`, `dealData.ts` |
| Адаптер (API-клиент) | camelCase + суффикс `Api` | `authApi.ts`, `fileApi.ts` |
| API route (Next.js) | kebab-case / REST | `pages/api/auth/login.ts` |
| Тесты | `*.test.ts` (unit), `*.spec.ts` (e2e) | `catalogFilters.test.ts` |

### 3.2. Код

| Элемент | Стиль | Пример |
|---------|-------|--------|
| Компоненты | PascalCase, named export | `export function DealModal()` |
| Хуки | camelCase | `export function useCatalogController()` |
| Типы / Интерфейсы | PascalCase | `type DealCase`, `type Product` |
| Enum-подобные объекты | PascalCase ключи | `DealStatus`, `ProductStatus` |
| Константы | UPPER_SNAKE_CASE | `DEMO_BUYER_ID`, `SESSION_TTL` |
| Функции | camelCase, глагол + сущность | `getDealById()`, `createDeal()` |
| CSS-классы | Tailwind utility | `className="px-4 text-sm"` |

### 3.3. Роуты

| Зона | Префикс | Пример |
|------|---------|--------|
| Публичная | `/` | `/catalog`, `/analytics`, `/about` |
| Личный кабинет | `/app/` | `/app/deals`, `/app/messages` |
| Админ-панель | `/admin/` | `/admin/dashboard`, `/admin/users` |
| API | `/api/` | `/api/auth/login`, `/api/files` |

---

## 4. Правила разработки компонентов

### 4.1. Структура компонента

```tsx
// 1. Импорты (React, библиотеки, внутренние модули)
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'

// 2. Типы (если локальные)
type Props = {
  mode: 'create' | 'edit'
}

// 3. Компонент — named export, без default (кроме App.tsx и Next.js pages)
export function MyPage({ mode }: Props) {
  // состояние
  // эффекты
  // обработчики
  // рендер
}
```

### 4.2. Принципы

- **Named exports** везде, кроме `App.tsx` и файлов `pages/` (Next.js требует default).
- **Lazy loading** страниц через `React.lazy()` в `App.tsx`.
- **Без prop drilling** — используйте контексты (`AuthProvider`) или хуки.
- **Composable guards** — auth guards как Route-обёртки (`RequireAuth`, `RequireAdmin`, `RequireSeller`).
- **Без `any`** — используйте конкретные типы. `unknown` допустим на границах (API-ответы).

---

## 5. Управление данными

### 5.1. Текущая модель (Пилот)

На пилотном этапе данные хранятся **in-memory** в модулях `src/data/`:

| Модуль | Содержимое |
|--------|-----------|
| `mockData.ts` | Продавцы (Seller[]), товары (Product[]) |
| `dealData.ts` | Сделки (DealCase[]), документы, статусы |
| `messagingData.ts` | Потоки (Thread[]), сообщения (Message[]) |
| `catalogStructure.ts` | Секторы, подкатегории, страны |
| `appMockData.ts` | Статусы продуктов продавца |
| `adminData.ts` | Агрегации для админ-панели |
| `analyticsData.ts` | Данные раздела аналитики |

**Мутации** — прямое изменение массивов + уведомление через `storeEvents.ts` → `notifyPlatformDataChange()`.

### 5.2. Целевая модель (Масштабирование)

При переходе на реальный backend:
- Модули `src/data/` заменяются на API-вызовы через `src/adapters/`.
- API routes в `pages/api/` подключаются к БД.
- Формат данных (типы) остаётся тем же — контракт не меняется.

---

## 6. Авторизация и безопасность

### 6.1. Сессии

- Сессии хранятся серверно (in-memory Map в `authServer.ts`).
- Cookie: `srh_session` (HttpOnly, SameSite=Lax, Secure в production).
- TTL: 12 часов.

### 6.2. CSRF-защита

- Все мутирующие запросы (POST/PUT/DELETE) требуют заголовок `X-XSRF-TOKEN`.
- Токен выдаётся через `GET /api/auth/csrf` и хранится в cookie `XSRF-TOKEN`.

### 6.3. Валидация файлов

- Проверка по magic bytes (не по расширению).
- Допустимые типы: PDF, PNG, JPG, DOCX.
- Лимит: 10 МБ.

### 6.4. Роли

| Роль | Доступ |
|------|--------|
| `buyer` | Публичная часть + `/app/*` (без `/app/products/*`) |
| `seller` | Публичная часть + `/app/*` (включая `/app/products/*`) |
| `admin` | Публичная часть + `/app/*` + `/admin/*` |

---

## 7. Стилизация

### 7.1. Tailwind CSS 4

- Конфигурация через `postcss.config.mjs` + `@tailwindcss/postcss`.
- Глобальные стили в `src/index.css`.
- **Не используйте** CSS-модули или styled-components.

### 7.2. UI-Kit

Переиспользуемые компоненты в `src/components/ui/`:

| Компонент | Назначение |
|-----------|-----------|
| `Button` | Кнопка с вариантами (primary, ghost, danger) |
| `ButtonLink` | Кнопка-ссылка (react-router) |
| `Card` | Карточка-контейнер |
| `Badge` | Статусный бейдж |
| `Input` | Текстовое поле |
| `Textarea` | Многострочное поле |
| `Tabs` | Вкладки |
| `Carousel` | Карусель изображений |
| `Logo` | Логотип платформы |

Стили кнопок вынесены в `buttonStyles.ts`. Используйте `clsx` / `cx` для условных классов.

### 7.3. Адаптивность

- Mobile-first подход.
- Breakpoints: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px).
- Мобильная навигация через `MobileNavDrawer`.

---

## 8. API-контракты

### 8.1. Формат ответов

```typescript
// Успех
{ ok: true, data: T }

// Ошибка
{ error: string }

// HTTP-статусы: 200 (ok), 400 (bad request), 401 (unauthorized), 403 (forbidden), 405 (method not allowed)
```

### 8.2. Существующие эндпоинты

| Метод | Путь | Назначение |
|-------|------|-----------|
| POST | `/api/auth/login` | Вход в систему |
| POST | `/api/auth/logout` | Выход |
| GET | `/api/auth/me` | Текущий пользователь |
| GET | `/api/auth/csrf` | Получение CSRF-токена |
| POST | `/api/files` | Загрузка файла |
| GET | `/api/files/[id]` | Скачивание файла |

---

## 9. Тестирование

### 9.1. Unit-тесты (Vitest)

- Расположение: `tests/unit/`.
- Запуск: `npm run test:unit`.
- Покрытие: бизнес-логика (фильтры каталога, workflow сделок, селекторы).

### 9.2. E2E-тесты (Playwright)

- Расположение: `tests/e2e/`.
- Запуск: `npm run test:e2e`.
- Покрытие: auth-роутинг, smoke-тесты страниц.

### 9.3. Правила

- Каждый новый модуль в `src/data/` или `src/features/` должен иметь unit-тест.
- Новые пользовательские сценарии — e2e spec.
- Не мокайте внутренние модули — тестируйте через публичный API модуля.

---

## 10. Git и CI

### 10.1. Ветвление

- `main` — стабильная версия.
- `feature/<name>` — фичи.
- `fix/<name>` — исправления.
- `hotfix/<name>` — срочные патчи.

### 10.2. Коммиты

Формат: `<тип>: <описание>`

Типы:
- `feat` — новый функционал
- `fix` — исправление бага
- `refactor` — рефакторинг без изменения поведения
- `style` — форматирование, стили
- `docs` — документация
- `test` — тесты
- `chore` — инфраструктура, зависимости

Примеры:
```
feat: add investment project catalog page
fix: correct deal status transition from negotiating to approved
refactor: extract file validation into shared utility
```

### 10.3. CI Pipeline

GitHub Actions (`.github/workflows/ci.yml`):
- Typecheck (`tsc --noEmit`)
- Lint (`eslint .`)
- Unit tests (`vitest run`)
- Build (`next build`)

---

## 11. Мультиязычность (Целевая)

По ТЗ платформа поддерживает 4 языка: **RU**, **EN**, **KZ**, **CN**.

Текущая реализация — только RU. При добавлении i18n:
- Использовать `next-intl` или аналог.
- Ключи перевода в `src/locales/{ru,en,kz,cn}.json`.
- Определение языка: Accept-Language → cookie → fallback RU.

---

## 12. Performance

- Lazy loading всех страниц через `React.lazy()`.
- Изображения через `public/` с fallback-заглушками (`imageFallback.ts`).
- Lighthouse budget определён в `lighthouse-budget.json`.
- Debounce поиска через `useDebounce` хук.

---

## 13. Запрещено

- Прямой доступ к DOM (`document.querySelector`) — используйте React refs.
- `// @ts-ignore` и `as any` — исправляйте типы.
- Хранение секретов в коде — используйте `.env.local`.
- `console.log` в production-коде — удаляйте перед коммитом.
- Изменение `_document.tsx` без согласования — это shell для всего приложения.
- Добавление зависимостей без обоснования — минимизируйте bundle size.
