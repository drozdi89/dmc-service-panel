/** Toast texts shown by integration entity hooks. */
export const INTEGRATION_MESSAGES = {
  settingsNotLoaded: 'Настройки не загружены',
  datamark: {
    saved: 'Настройки DataMark сохранены',
    deleted: 'Настройки DataMark удалены',
  },
  utrace: {
    saved: 'Настройки Utrace сохранены',
    deleted: 'Настройки Utrace удалены',
  },
  autoorder: {
    saved: 'Параметры автозаказа сохранены',
  },
  autosend: {
    saved: 'Настройки автоотправки сохранены',
  },
  lineTaskType: {
    saved: (count: number) => `Типы заданий сохранены (${count} линий)`,
  },
  crptTemplates: {
    saved: (count: number) => `Шаблоны КМ сохранены (${count} продуктов)`,
  },
  wmsEfko: {
    saved: 'Настройки интеграции с WMS сохранены',
    connectionOk: 'Подключение к MS SQL WMS успешно',
    connectionFailed:
      'Проверка подключения к MS SQL WMS не удалась. Проверьте параметры подключения.',
    connectionError: (reason: string) => `Не удалось проверить подключение к MS SQL WMS: ${reason}`,
  },
  oneCExchange: {
    saved: 'Настройки обмена с 1С сохранены',
    serversRefreshed: 'Список серверов DMC обновлён',
    serversError: (reason: string) => `Не удалось получить список серверов DMC из 1С: ${reason}`,
    serversEmpty:
      '1С не вернула доступных серверов DMC. Проверьте настройки подключения и публикацию Alife.',
    srvIdMissing: (srvId: number) =>
      `Текущий srv_id (${srvId}) не найден в ответе 1С. Выберите сервер из списка или проверьте настройки.`,
  },
  crptOrganizations: {
    loadFailed: 'Ошибка загрузки организации',
    created: 'Организация добавлена',
    updated: 'Организация обновлена',
    deleted: 'Организация удалена',
    saveFailed: 'Ошибка сохранения',
    deleteFailed: 'Ошибка удаления',
    templateNotUpdated: (reason: string) =>
      `Организация сохранена, но шаблон CRPT не обновлён: ${reason}`,
    templateNotUpdatedRetry:
      'Организация сохранена, но не удалось сохранить шаблон CRPT. Повторите сохранение.',
    templateNotCreated: (reason: string) =>
      `Организация добавлена, но шаблон CRPT не сохранён: ${reason}`,
    templateNotCreatedRetry:
      'Организация добавлена, но не удалось сохранить шаблон CRPT. Откройте запись и повторите сохранение.',
  },
} as const;
