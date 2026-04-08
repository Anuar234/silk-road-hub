# Silk Road Hub (RU)

## Запуск (dev)

```bash
npm install
npm run dev
```

## Demo / Offline preview (one-click)

Проект настроен так, чтобы demo/offline работал через локальный сервер и не ломал Next.js архитектуру.
Для стабильного запуска используйте один из вариантов ниже.

### Вариант 1 (рекомендовано): кнопка `index.bat`
- Двойной клик по `index.bat` в корне проекта.
- Скрипт сам установит зависимости (если нужно), соберёт проект и откроет сайт.

### Вариант 2: команда

```bash
npm run demo
```

Синонимы:
- `npm run demo:launch` (запускает build + server + автооткрытие браузера)
- `npm run preview` (build + server, без отдельного launcher-слоя)
- `npm run offline`

### Важно
- Не используйте прямой `file://` запуск `index.html` для demo.
- Для hash-SPA внутри Next.js корректный режим — локальный сервер (`index.bat` или `npm run preview`).

## Сборка (ручной режим)

```bash
npm run build
```

### Что сделано для офлайна
- Навигация переведена на hash-роутинг (URL вида `#/catalog`), поэтому SPA-контракт и старые deep-link продолжают работать.
- Demo preview запускается через `next start` (локальный сервер) после `next build`, что позволяет использовать API routes (auth/files) и server-side проверки.
- В кабинете бренд “Silk Road Hub” кликабелен и всегда ведёт на главную (index).
