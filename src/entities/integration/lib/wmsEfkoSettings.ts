import { WMS_EFKO_LINE_FILTER_OPTIONS } from '../model/constants';
import type { WmsEfkoSettingsPayload } from '../model/types';

function trimText(value: string | null | undefined): string {
  return (value ?? '').trim();
}

/**
 * Builds the WMS (Efko) PUT body; an empty password is omitted to keep the stored one.
 *
 * @param values - WMS settings form values.
 */
export function buildWmsEfkoPayload(values: WmsEfkoSettingsPayload): WmsEfkoSettingsPayload {
  const { mssql_password: password, ...rest } = values;
  const payload: WmsEfkoSettingsPayload = {
    ...rest,
    mssql_host: trimText(values.mssql_host) || null,
    mssql_database: trimText(values.mssql_database) || null,
    mssql_username: trimText(values.mssql_username) || null,
    api_host: trimText(values.api_host) || null,
    api_port: values.api_port && values.api_port > 0 ? values.api_port : null,
    line_ids: values.line_ids ?? [],
  };
  const passwordText = trimText(password);
  if (passwordText) {
    payload.mssql_password = passwordText;
  }
  return payload;
}

/**
 * Validates MS SQL fields required for the connection test.
 *
 * @param values - WMS settings form values.
 */
export function validateWmsMssqlConnection(
  values: Pick<WmsEfkoSettingsPayload, 'mssql_host' | 'mssql_database'>,
): string | null {
  if (!trimText(values.mssql_host)) {
    return 'Укажите хост MS SQL WMS.';
  }
  if (!trimText(values.mssql_database)) {
    return 'Укажите имя базы данных MS SQL WMS.';
  }
  return null;
}

/**
 * Validates WMS settings when the integration is enabled.
 *
 * @param values - WMS settings form values.
 */
export function validateWmsEfkoSettings(values: WmsEfkoSettingsPayload): string | null {
  if (!values.enabled) {
    return null;
  }
  const connectionError = validateWmsMssqlConnection(values);
  if (connectionError) {
    return connectionError;
  }
  const mode = values.line_filter_mode;
  if ((mode === 'include' || mode === 'exclude') && (values.line_ids ?? []).length === 0) {
    const label = WMS_EFKO_LINE_FILTER_OPTIONS.find((option) => option.value === mode)?.label ?? mode;
    return `Выберите хотя бы одну линию для режима фильтра «${label}».`;
  }
  return null;
}
