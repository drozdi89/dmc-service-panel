# Аудит DataMatrixControl `1.0.4.7_rel_cursor` ↔ Service Panel

Снимок для сверки паритета. Локальный клон: `C:\OSPanel\home\DataMatrixControl`, tip `88cd319`.

## Последние коммиты ветки (20)

| SHA | Сообщение |
|-----|-----------|
| `88cd319` | Manager (#1402): подсказка импорта на подчинённом — «с основного сервера» |
| `7d51027` | Синхронизировать изменения планов с удалённой веткой |
| `2f0825c` | Автоотправка. Проверить сборку во время отправки документов ЧЗ |
| `ea3a47b` | MES Sync 7/7. Подготовить инструкцию по выкладке и откату |
| `8939825` | MES Sync 6/7. Проверить доставку и нагрузку на большом журнале |
| `1d70edc` | MES Sync 5/7. Ограничить очередь и восстанавливать уведомления |
| `098f3d9` | MES Sync 4/7. Разрешать маркеры пакетно и дочитывать ревизию |
| `2e2d943` | MES Sync 3/7. Записывать только изменения состава набора |
| `5c1628f` | MES Sync 2/7. Индексировать глобальные ревизии журнала |
| `2406b0a` | MES Sync 1/7. Зафиксировать воспроизведение нагрузки |
| `4980336` | Автоотправка P2 2/2. Вынести диспетчер из главного цикла |
| `9670cda` | Автоотправка P2 1/2. Учитывать только документы нужного SSCC |
| `afb3e42` | Автоотправка P1 4/4. Защищать состав ожидающих SSCC при очистке |
| `7f48ae2` | Автоотправка P1 3/4. Опросить документы с известным составом |
| `6e19526` | Автоотправка P1 2/4. Привязывать списание при регистрации документа |
| `ccb3dc1` | Автоотправка P1 1/4. Находить SSCC у старых заданий ЧЗ |
| `345f0c4` | Автоотправка 3/3. Отправлять поздние SSCC по фактическому составу |
| `20b369b` | Автоотправка 2/3. Восстанавливать ожидающие верхние SSCC |
| `3154343` | Автоотправка 1/3. Передавать выбранное задание при сборке агрегата |
| `1f51d58` | Linux моноблок: крупные сенсорные плитки заданий, Arial в runtime UI |

Актуальный фокус ветки по логу: **MES Sync**, **Автоотправка**, **Manager** — web-SP при сверке API смотреть те же домены в OpenAPI, не только формы CRUD.

## OpenAPI: `docs/API/openapi.json` (DMC) vs `src/openapi.json` (SP)

| Метрика | Значение |
|---------|----------|
| Размер DMC | ~2.44 MB (`sha256` prefix `f90ec671`) |
| Размер SP | ~3.50 MB (`sha256` prefix `e24d7c18`) |
| Paths common | 225 |
| Paths only in SP | 8 (`aggregate_rejects`, `series-leases`, `tasks/one_c/*`, …) |
| Paths only in DMC | 0 |
| Schemas common | 669 |
| Schemas only in SP | 25 (частично расширения SP/недокатанный merge в DMC) |
| Schemas only in DMC | 1 (`V2OkAckSaved`) |

**Вывод:** SP OpenAPI **шире** по paths/schemas; при синхронизации с DMC — **не затирать** SP-специфичные эндпоинты без явного решения. Подтягивать из DMC изменения по общим `paths`/схемам (diff merge), затем `npm run generate:api-types`.

## Code generators (Qt, ветка 1.0.4.7)

- Редактор: `modules/CodeGenerators/template_editor.py` — UI счётчиков как **CounterSpec** (name, width, min/max, key_fields), не legacy `type/format`.
- Статус рядов: `modules/CodeGenerators/counter_status_display.py`.
- Список: `modules/CodeGenerators/template_list.py`.
- SP: legacy-таблица + мост [`counterConfigPayload.ts`](../../../src/entities/code-generator-template/lib/counterConfigPayload.ts) до миграции UI.