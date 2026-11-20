# Web Admin UI — FSD layers (Vite SPA)

Стек: React + TypeScript + Vite (`base: '/admin/'` в production). Алиас `@/*` → `src/*`.

## Иерархия импортов (только вниз)

```
app → pages → layouts → widgets → features → services → entities → shared
```

```
src/
├── main.tsx, App.tsx          # точка входа Vite
├── app/                       # провайдеры, routes, menuRegistry
├── pages/                     # композиции экранов (*Page)
├── layouts/                   # оболочки (admin-layout и т.п.)
├── widgets/                   # крупные UI-блоки
├── features/                  # сценарии (формы, CRUD)
├── services/                  # оркестрация сущностей
├── entities/                  # типы схем API, api, queries (RQ), entity UI, domain zustand
└── shared/                    # UI-kit, api, queries (factoryQuery / factoryMutation /
                               # useInvalidatingMutation), hooks, validation, lib,
                               # model/ — опциональные shared-типы (zustand только по необходимости)
```

Публичный API слайса — только через `index.ts` (ESLint `boundaries/entry-point`).
UI-kit: `@/shared/ui/<segment>`. Слой `modules/` **удалён** (FSD #17); импорты `@/modules/**` запрещены.

**Состояние:** серверный кэш — React Query в `entities/*/queries` (и в `services/*/model/queries.ts` для оркестрации без UI). UI-intent домена (dialog, `lastSaved`) — zustand в **`entities/<domain>/model`**. `shared/model` — общие типы / стор только если реально кросс-доменный. Form Host — `widgets/*`, один mount в `AppProviders`; разметка формы — `features/*-form`. Мутации без `id` в ответе — `useInvalidatingMutation` из `@/shared/queries`.

**Форма:** в неё передаётся объект, полученный из API (тип из `src/shared/api/schema.d.ts`). Дополнительных переменных в объект формы нет (`*_removed`, `*Label`, `clientKey`, commissioning UI — в state рядом с формой). `src/openapi.json` описывает API частично; `schema.d.ts` вручную не править.

См. `.cursor/rules/frontend-architecture.mdc`.
