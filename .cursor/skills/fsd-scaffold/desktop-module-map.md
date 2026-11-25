# Qt (DataMatrixControl) → FSD (Service Panel)

Реестр для сверки паритета. Ветка DMC: **`1.0.4.7_rel_cursor`**. Обновлять при новых комментариях «Desktop parity» в `src/`.

| Qt path (DataMatrixControl) | Назначение | SP (slice) |
|-----------------------------|------------|------------|
| `modules/CodeGenerators/template_editor.py` | Редактор шаблона, счётчики CounterSpec, preview | `features/code-generator-template-form`, `entities/code-generator-template`, `widgets/code-generator-template` |
| `modules/CodeGenerators/template_list.py` | Список шаблонов | `pages/code-generator-templates` |
| `modules/CodeGenerators/counter_status_display.py` | Текущие series по счётчикам (read-only) | `features/code-generator-template-form/ui/CounterStatusTable` (в модалке шаблона) |
| `modules/CodeGenerators/variables` (API) | Справочник плейсхолдеров | `features/code-generator-template-form/ui/VariablesCatalogModal` |
| `apps/service_panel/mark_settings.py` | Параметры маркировки | `features/parameters-marking-options` |
| `apps/service_panel/mes_sync_settings.py` | MES Sync: server_node_id, bindings, Service token для DataManager | `pages/mes-sync`, `features/mes-sync-settings`, `entities/mes-sync` |
| `apps/service_panel/crpt_options.py` | Интеграция ЧЗ | `features/integration-*`, `entities/integration` |
| `apps/service_panel/service_panel.py` | Оболочка Service Panel Qt | `layouts/admin-layout`, `app/AdminShell` |
| Qt `tab_licences` (см. комментарии SP) | Лицензии MACT | `pages/licences` |
| Qt `tab_service` | Сбор статистики | `features/parameters-statistics` |
| Qt Telegram block | Уведомления бота | `features/parameters-telegram` |
| Qt `gbFtpExchange` / `FtpIntegrationUI` | FTP | `features/parameters-ftp` |
| Resource picker / line configuration | Подписи принтер/шаблон | `features/print-station-form`, `shared/ui/AsyncLookupSelect` |
| Product ware / aggregates dialogs | Продукт, агрегаты, `code_generator_template_id` | `features/product-form`, `entities/product` |
| Line aggregation UI | Уровни агрегации | `features/line-editor`, `services/line-service`, `entities/line` |
| Devices / printers UI | Справочник устройств | `entities/device`, `features/device-form`, `widgets/device` |
| Print stations | Станции печати | `entities/print-station`, `features/print-station-form` |

## Вне scope веб-админки

| Qt / продукт | Почему не в SP |
|--------------|----------------|
| `apps/data_manager/**` (edge tray UI) | Локальный API DataManager (`settings/`, sync agent). В SP — только **центральная** выдача токенов (`mes_sync`). |
| Ротация `notify_token` | Пишет в `srv_cfg.ini`; REST только GET `notify_credentials/`. |
| DB backup/restore | Нет REST (stub `features/parameters-backup`). |

## libs (логика без UI)

| DMC | SP |
|-----|-----|
| `libs/code_generators/counter_resolver.py`, `parse_counter_specs` | `entities/code-generator-template/lib/counterConfigPayload.ts` |
| `apps/api/client/services/code_generator_template_service.py` (merge PATCH) | Соблюдать write-схему в `entities/code-generator-template/api` |

## Поиск соответствия

```bash
# В dmc-service-panel
rg -i "parity with Qt|Desktop" src/
```

```bash
# В DataMatrixControl — аналог для Service Panel
rg -i "service.panel|api/v2" apps/service_panel modules/
```
