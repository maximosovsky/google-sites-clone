# google-sites-clone — ROADMAP

> Web UI: вставляешь URL Google Sites → получаешь полную копию

## Решения

| Вопрос | Решение |
|--------|---------|
| Имя | `google-sites-clone` |
| Платформа | Только Google Sites |
| Аудитория | Обычные люди (Web UI) |
| Картинки | Скачивать с CDN в отдельные файлы |
| Навигация | ☐ Оригинальная / ☐ Кастомная sidebar |
| YouTube | ☐ Thumbnails со ссылкой / ☐ iframe embed |
| Режим | Разовый клон |
| Лицензия | Open-source (GitHub) |
| Размер | ☐ Оптимизированный (5-50 KB) / ☐ Автономный (всё inline) |
| Деплой | Vercel Web UI |
| Выход | ☐ Локально / ☐ ZIP / ☐ GitHub Pages (если залогинен) |

---

## Архитектура

```
┌─────────────────────────────────────────────┐
│  Vercel Web UI (Next.js)                    │
│  ┌──────────────────────┐                   │
│  │  URL: [____________] │  [Clone!]         │
│  │  ☐ Custom nav        │                   │
│  │  ☐ YT thumbnails     │                   │
│  │  ☐ Optimize size     │                   │
│  │  Output: ◉ZIP ○GitHub│                   │
│  └──────────────────────┘                   │
└──────────────┬──────────────────────────────┘
               │ API call
┌──────────────▼──────────────────────────────┐
│  Backend (Railway / Render)                 │
│                                             │
│  Pass 1: SingleFile → CSS + base64 images   │
│  Pass 2: Puppeteer (batch) → clean content  │
│  Merge → final site                         │
│                                             │
│  Output → ZIP / GitHub Pages push           │
└─────────────────────────────────────────────┘
```

> **Vercel** = UI only (статика + API routes для триггера)
> **Backend** (Railway/Render) = тяжёлая работа (Puppeteer, SingleFile, 10-20 мин)
> Vercel serverless не подходит — timeout 10 сек, нет headless Chrome

---

## Фазы разработки

### Phase 1: Core Pipeline
- [ ] Auto-crawl: Puppeteer → parse sidebar → all URLs → page-map.json
- [ ] SingleFile pass for all pages
- [ ] Puppeteer batch pass (5/batch, 60s pause)
- [ ] SPA navigation fallback for failed pages
- [ ] Merge: SingleFile styles + Puppeteer content
- [ ] **Download images from Google CDN → local files, replace URLs**
- [ ] YouTube → thumbnails + play button
- [ ] Generate sitemap.xml + robots.txt
- [ ] Footer badge on all pages

### Фаза 2: Two-Pass Pipeline
- [ ] SingleFile для CSS + images
- [ ] Puppeteer batch (по 5, 60с пауза) для контента
- [ ] Fallback на SingleFile при ошибке

### Фаза 3: Merge + Build
- [ ] CSS из Pass 1 + контент из Pass 2
- [ ] YouTube → thumbnails или iframes (по выбору)
- [ ] Извлечение картинок из base64 в файлы (по выбору)
- [ ] Sidebar навигация (оригинал или кастом)

### Фаза 4: Web UI
- [ ] Next.js форма на Vercel
- [ ] GitHub OAuth (для GitHub Pages output)
- [ ] Progress WebSocket/SSE
- [ ] ZIP download

### Фаза 5: Backend
- [ ] Railway/Render с Puppeteer + SingleFile
- [ ] API: start job → poll status → download result
- [ ] GitHub API: create repo + push site

### Фаза 6: Polish
- [ ] Отчёт: страницы / YouTube / ошибки
- [ ] README + Open Source
- [ ] Лимиты (max pages, rate limit)

---

## Стек
- **Frontend:** Next.js (Vercel)
- **Backend:** Node.js (Railway/Render)
- **Tools:** Puppeteer, SingleFile CLI
- **Auth:** GitHub OAuth
- **Storage:** Temp файлы на backend, ZIP для download
