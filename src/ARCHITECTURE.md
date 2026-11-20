# Web Admin UI — FSD layers (Vite SPA)

Стек: React + TypeScript + Vite (`base: '/admin/'` в production). Алиас `@/*` → `src/*`.

## Иерархия импортов (только вниз)

```
app → pages → layouts → widgets → features → services → entities → shared
```

## Дерево `web/src`

```
src/
├── main.tsx, App.tsx          # точка входа Vite
├── app/                       # провайдеры, routes, menuRegistry
├── pages/                     # композиции экранов (*Page)
├── layouts/                   # оболочки (admin-layout и т.п.)
├── widgets/                   # крупные UI-блоки
├── features/                  # сценарии (формы, CRUD)
├── services/                  # оркестрация сущностей
├── entities/                  # типы, api, queries (RQ), mapping, entity UI, domain zustand
└── shared/                    # UI-kit, api, hooks, validation, lib,
                               # model/ — опциональные shared-типы (zustand только по необходимости)
```

Публичный API слайса — только через `index.ts` (ESLint `boundaries/entry-point`).
UI-kit: `@/shared/ui/<segment>`. Слой `modules/` **удалён** (FSD #17); импорты `@/modules/**` запрещены.

**Состояние:** серверный кэш — React Query в `entities/*/queries`; UI-intent домена (формы, dialog, `lastSaved`) — zustand в **`entities/<domain>/model`** (отдельный store на домен). `shared/model` — общие типы / стор только если реально кросс-доменный. Form Host — в `features/*-form`, монтируется на page. См. `.cursor/rules/frontend-architecture.mdc`.

## Gate

Из `web/`: `npm run lint`, `npm test`, `npm run build`.

Подробнее: `docs/Server/web_ui/architecture-fsd.md` (§ #17).
