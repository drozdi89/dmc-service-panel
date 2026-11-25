import type { OneCExchangeSettings, OneCExchangeSettingsPayload } from '../model/types';

/** Server-side state the 1C payload and validation depend on. */
export interface OneCExchangeSavedState {
  /** Settings snapshot loaded from the API. */
  loaded: OneCExchangeSettings;
  /** A password is already stored on the server. */
  passwordConfigured: boolean;
}

/**
 * Resolves the password for PUT: omitted when empty and one is already configured.
 *
 * @param passwordText - Trimmed password field value.
 * @param saved - Loaded settings and password flag.
 */
export function resolveOneCPasswordForPut(
  passwordText: string,
  { loaded, passwordConfigured }: OneCExchangeSavedState,
): string | undefined {
  if (passwordText) {
    return passwordText;
  }
  if (passwordConfigured && loaded.password) {
    return loaded.password;
  }
  return undefined;
}

/**
 * Builds the 1C exchange PUT body.
 *
 * @param values - 1C settings form values.
 * @param saved - Loaded settings and password flag.
 * @param options.preserveFlags - Keep stored `enabled` / `srv_id` (server list refresh).
 */
export function buildOneCExchangePayload(
  values: OneCExchangeSettings,
  saved: OneCExchangeSavedState,
  options?: { preserveFlags?: boolean },
): OneCExchangeSettingsPayload {
  const { loaded } = saved;
  const password = resolveOneCPasswordForPut((values.password ?? '').trim(), saved);
  const payload: OneCExchangeSettingsPayload = {
    enabled: options?.preserveFlags ? loaded.enabled : values.enabled,
    base_url: (values.base_url ?? '').trim() || null,
    username: (values.username ?? '').trim() || null,
    srv_id: options?.preserveFlags ? loaded.srv_id ?? null : values.srv_id ?? null,
  };
  if (password !== undefined) {
    payload.password = password;
  }
  return payload;
}

/**
 * Validates connection fields (URL, Basic Auth) required to reach 1C.
 *
 * @param values - 1C settings form values.
 * @param saved - Loaded settings and password flag.
 */
export function validateOneCConnection(
  values: OneCExchangeSettings,
  { loaded, passwordConfigured }: OneCExchangeSavedState,
): string | null {
  const hasPassword =
    Boolean((values.password ?? '').trim()) || (passwordConfigured && Boolean(loaded.password));
  if (!(values.base_url ?? '').trim()) {
    return 'Укажите базовый URL публикации 1С.';
  }
  if (!(values.username ?? '').trim()) {
    return 'Укажите имя пользователя для Basic Auth.';
  }
  if (!hasPassword) {
    return 'Укажите пароль для Basic Auth.';
  }
  return null;
}

/**
 * Validates 1C settings when the exchange is enabled.
 *
 * @param values - 1C settings form values.
 * @param saved - Loaded settings and password flag.
 */
export function validateOneCExchangeSettings(
  values: OneCExchangeSettings,
  saved: OneCExchangeSavedState,
): string | null {
  if (!values.enabled) {
    return null;
  }
  const connectionError = validateOneCConnection(values, saved);
  if (connectionError) {
    return connectionError;
  }
  if (values.srv_id == null) {
    return 'Выберите сервер DMC (srv_id) или обновите список серверов.';
  }
  return null;
}
