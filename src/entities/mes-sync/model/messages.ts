/** Operator-facing messages for MES Sync admin (Qt mes_sync_settings parity). */
export const MES_SYNC_MESSAGES = {
  serverEnsured: 'Идентификатор сервера MES Sync создан',
  bindingCreated: 'Привязка создана. Скопируйте Service token — он показывается один раз.',
  bindingRotated: 'Токен обновлён. Скопируйте новый Service token — он показывается один раз.',
  bindingUpdated: 'Линии привязки обновлены',
  bindingRevoked: 'Привязка отозвана',
  tokenCopied: 'Токен скопирован в буфер обмена',
  copyFailed: 'Не удалось скопировать токен',
  revokeConfirmTitle: 'Отозвать привязку?',
  revokeConfirmContent:
    'Edge DataManager с этим Service token перестанет авторизоваться. Действие необратимо.',
  revokeOk: 'Отозвать',
} as const;
