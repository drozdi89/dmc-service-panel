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

**Состояние:** серверный кэш — только «идея запроса» в `entities/*/queries` (ключи, options, `factoryQuery` / мутации, инвалидация); тосты, confirm и сценарии вроде `use*FormSave` — в `entities/*/hooks` (hooks вызывают queries). Оркестрация без UI — `services/*/model/queries.ts`. UI-intent домена (dialog, `lastSaved`) — zustand в **`entities/<domain>/model`**. Form Host — `widgets/*`, один mount в `AppProviders`; разметка формы — `features/*-form`. Мутации без `id` — `useInvalidatingMutation` из `@/shared/queries`.

**Форма:** в неё передаётся объект, полученный из API (тип из `src/shared/api/schema.d.ts`). Дополнительных переменных в объект формы нет (`*_removed`, `*Label`, `clientKey`, commissioning UI — в state рядом с формой). `src/openapi.json` описывает API частично; `schema.d.ts` вручную не править.

См. `.cursor/rules/frontend-architecture.mdc`.
