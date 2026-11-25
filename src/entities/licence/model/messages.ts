/** Toast texts shown by licence entity hooks. */
export const LICENCE_MESSAGES = {
  mactRefreshed: 'Данные лицензирования обновлены',
  mactRefreshFailed: 'Ошибка обновления лицензий MACT',
  clientsRefreshed: 'Список клиентов обновлён',
  clientsRefreshFailed: 'Ошибка обновления списка клиентов',
  registered: 'Лицензия привязана',
  registerFailed: 'Ошибка привязки лицензии',
  unregistered: 'Лицензия отвязана',
  unregisterFailed: 'Ошибка отвязки лицензии',
  clientDeleted: 'Клиент удалён',
  clientDeleteFailed: 'Ошибка удаления клиента',
  selectLicence: 'Выберите лицензию',
  licencesLoading: 'Лицензии загружаются, подождите.',
  licencesLoadFailed: 'Не удалось загрузить лицензии MACT',
  noAvailableLicences: 'Нет доступных лицензий. Нажмите «Обновить лицензии» для загрузки с MACT.',
} as const;
