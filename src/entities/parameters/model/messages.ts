/** User-facing toast texts for the Parameters entity (success + fallback errors). */
export const PARAMETERS_MESSAGES = {
  marking: {
    saved: 'Настройки маркировки сохранены',
    saveFailed: 'Не удалось сохранить настройки маркировки',
  },
  telegram: {
    saved: 'Настройки Telegram сохранены',
    saveFailed: 'Не удалось сохранить настройки Telegram',
  },
  ftp: {
    saved: 'Настройки FTP сохранены',
    saveFailed: 'Не удалось сохранить настройки FTP',
  },
  watchdog: {
    saved: 'Настройки Watchdog сохранены',
    saveFailed: 'Не удалось сохранить настройки Watchdog',
  },
  statistics: {
    saved: 'Настройки статистики сохранены',
    saveFailed: 'Не удалось сохранить настройки статистики',
  },
  codeCleanup: {
    saved: 'Настройки очистки старых кодов сохранены',
    saveFailed: 'Не удалось сохранить настройки очистки старых кодов',
  },
  backup: {
    stubTitle: 'Резервное копирование',
    stubContent: 'Пока над этим думаем (думает бекенд)',
  },
  factoryNumbers: {
    created: 'Заводской номер добавлен',
    updated: 'Заводской номер обновлён',
    deleted: 'Заводской номер удалён',
    saveFailed: 'Ошибка сохранения',
    deleteFailed: 'Ошибка удаления',
  },
} as const;
