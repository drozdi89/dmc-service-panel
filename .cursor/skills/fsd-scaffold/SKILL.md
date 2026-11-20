---
name: fsd-scaffold
description: Scaffolds and extends FSD slices in DMC Service Panel (entity, feature, page, widget, FormModalHost). Runs lint/tests after structural UI changes. Use when the user adds a new layer, screen, entity, modal, Host, CRUD form, or asks to create a component following project architecture.
---

# FSD scaffold — DMC Service Panel

Полная архитектура: `.cursor/rules/frontend-architecture.mdc` (always apply).  
Формы/модалки: `.cursor/rules/antd-form-modals.mdc`.

## Перед кодом

1. Найти **эталонный слайс** того же типа (например `print-station`, `print-template`, `device`).
2. Сверить API с `src/openapi.json` / `schema.d.ts`; новые эндпоинты — сначала OpenAPI, затем `npm run generate:api-types`.
3. Зафиксировать слои и импорты **только вниз**; публичный API — `index.ts` слайса.

## Шаблоны каталогов

```bash
# Entity (домен + RQ + при необходимости Host-store)
mkdir -p src/entities/<name>/{api,model,queries,hooks,ui,lib}

# Feature (UI сценарий без persist)
mkdir -p src/features/<name>-form/ui

# Page
mkdir -p src/pages/<name>/ui

# App-wide modal Host
mkdir -p src/widgets/<name>/ui
```

Минимальные файлы:

- `entities/<name>/index.ts` — реэкспорт api, queries, hooks, model, ui.
- `entities/<name>/queries/*-mutations.ts` — `factoryMutation` + `createIdempotencyKey` в api.
- `entities/<name>/hooks/use<Name>Actions.ts` — тосты, confirm (не в queries).
- `entities/<name>/model/*FormUiStore.ts` — Zustand `none | create | edit`.
- `features/<name>-form/ui/*FormModal.tsx` — только UI + validate/submit callback.
- `widgets/<name>/ui/*FormModalHost.tsx` — подписка на store, save через hooks.
- `pages/<name>/routes.ts` + пункт в `src/app/menuRegistry.ts`.

Host модалки — **один** mount в `AppProviders` (`src/App.tsx`).

## Чеклист CRUD с модалкой

```
Task progress:
- [ ] api: fetchList, fetchDetail, create/update/delete + idempotency
- [ ] queries: keys, factoryQuery, factoryMutation
- [ ] hooks: save/delete/page actions (App.useApp)
- [ ] model: *FormUiStore, типы из schema
- [ ] feature: *FormModal (destroyOnHidden={false} если Host)
- [ ] widget: *FormModalHost → AppProviders
- [ ] page: список + openCreate/openEdit
- [ ] index.ts exports
```

## Команды после изменений (выполнить агенту)

Не ждать просьбы пользователя — после **нового слайса** или **нового FormModal/Host**:

1. Линт по затронутому дереву (или весь `src` при крупном слайсе):

```bash
npm run lint:fsd
```

2. Если менялись `entities/<name>` и есть тесты — прогнать связанные:

```bash
npx vitest run src/entities/<name>
```

3. При правках только UI без типов — достаточно `ReadLints` на изменённые файлы.

`npm run build` — по запросу или перед коммитом (долгий, в проекте могут быть несвязанные tsc-ошибки).

## Подсказки по решениям

| Задача | Куда |
|--------|------|
| Список + пагинация | `entities/*/queries` + `useServerListQuery` |
| Оркестрация нескольких entity | `services/*/model` |
| Вложенный picker «Создать» | тот же Host в `AppProviders`, не второй mount на странице |
| Полиморфный device CRUD | `useInvalidatingMutation` (см. `entities/device`) |

Детальные примеры Host/Form — [reference.md](reference.md).