import {
  ApiError,
  apiRequestData,
  fetchPaginatedList,
  type ApiRequestOptions,
} from '@/shared/api';
import type { ListQueryParams, PaginatedResponse } from '@/shared/types/listQuery';
import { parseCodeCleanupSettings } from '../lib/codeCleanup';
import { CODE_CLEANUP_KEYS } from '../model/constants';
import type {
  CodeCleanupSettings,
  FactoryNumberRow,
  FtpConfiguration,
  MarkingOptionEntry,
  MarkingOptionValue,
  ParametersSettingsBundle,
  SlaveConfiguration,
  TeleBotSettingRow,
  WatchdogConfiguration,
} from '../model/types';

const SETTINGS_BUNDLE_PATH = '/api/v2/marking_options/settings_bundle';
const MARKING_BATCH_PATH = '/api/v2/marking_options/batch';
const MARKING_VALUE_PATH = '/api/v2/marking_options/value';
const SLAVE_PATH = '/api/v2/server_settings/slave';
const TELE_BOT_PATH = '/api/v2/tele_bot_setting/';
const FTP_PATH = '/api/v2/service_config/ftp/';
const WATCHDOG_PATH = '/api/v2/service_config/watchdog/';
const FACTORY_NUMBERS_PATH = '/api/v2/factory_numbers/';

type TeleBotListData =
  | Record<string, never>
  | PaginatedResponse<TeleBotSettingRow>
  | TeleBotSettingRow;

/**
 * Loads the Parameters page settings bundle in a single request.
 */
export async function fetchSettingsBundle(): Promise<ParametersSettingsBundle> {
  return apiRequestData<ParametersSettingsBundle>(SETTINGS_BUNDLE_PATH);
}

/**
 * Upserts marking options via batch endpoint (Tier A — no idempotency key).
 */
export async function saveMarkingOptionsBatch(
  settings: MarkingOptionEntry[],
): Promise<{ updated: number }> {
  return apiRequestData<{ updated: number }>(MARKING_BATCH_PATH, {
    method: 'POST',
    body: { settings },
  });
}

/**
 * Loads a single marking option value by key.
 *
 * @param optionsName - Marking option key (e.g. `dmc_comp_size`).
 * @param signal - Optional abort signal.
 */
export async function fetchMarkingOptionValue(
  optionsName: string,
  signal?: AbortSignal,
): Promise<MarkingOptionValue> {
  return apiRequestData<MarkingOptionValue>(
    `${MARKING_VALUE_PATH}/${encodeURIComponent(optionsName)}`,
    { signal },
  );
}

/**
 * Loads the four `code_cleanup_*` marking options in parallel and parses them
 * (defaults and clamp like Qt). A missing key (404) is treated as an empty value.
 *
 * @param signal - Optional abort signal.
 */
export async function fetchCodeCleanupSettings(
  signal?: AbortSignal,
): Promise<CodeCleanupSettings> {
  const keys = Object.values(CODE_CLEANUP_KEYS);
  const values = await Promise.all(
    keys.map(async (key) => {
      try {
        const result = await fetchMarkingOptionValue(key, signal);
        return result.options_value;
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return '';
        }
        throw error;
      }
    }),
  );
  return parseCodeCleanupSettings(Object.fromEntries(keys.map((key, i) => [key, values[i]])));
}

/**
 * Returns slave mode configuration used to hide sections in slave mode.
 */
export async function fetchSlaveConfiguration(): Promise<SlaveConfiguration> {
  return apiRequestData<SlaveConfiguration>(SLAVE_PATH);
}

/**
 * Extracts the active Telegram bot setting from list or empty API response.
 *
 * @param data - Raw `data` field from GET tele_bot_setting.
 */
export function parseTeleBotSetting(data: TeleBotListData): TeleBotSettingRow | null {
  if (!data || typeof data !== 'object') {
    return null;
  }
  if ('bot_setting_id' in data && typeof data.bot_setting_id === 'number') {
    return data as TeleBotSettingRow;
  }
  if ('response' in data && Array.isArray(data.response) && data.response.length > 0) {
    return data.response[0] ?? null;
  }
  return null;
}

/**
 * Loads Telegram bot settings (single active row or null).
 */
export async function fetchTeleBotSetting(): Promise<TeleBotSettingRow | null> {
  const data = await apiRequestData<TeleBotListData>(TELE_BOT_PATH);
  return parseTeleBotSetting(data);
}

/**
 * Creates or updates Telegram bot settings with idempotency.
 */
export async function saveTeleBotSetting(
  payload: { api_token: string; is_activ: boolean },
  existingId: number | null,
  idempotencyKey: string,
): Promise<TeleBotSettingRow> {
  const options: ApiRequestOptions = {
    method: existingId === null ? 'POST' : 'PATCH',
    body: payload,
    idempotencyKey,
  };

  if (existingId !== null) {
    return apiRequestData<TeleBotSettingRow>(
      `${TELE_BOT_PATH}${existingId}`,
      options,
    );
  }

  return apiRequestData<TeleBotSettingRow>(TELE_BOT_PATH, options);
}

/**
 * Loads FTP integration configuration from local ini file.
 */
export async function fetchFtpConfiguration(): Promise<FtpConfiguration> {
  return apiRequestData<FtpConfiguration>(FTP_PATH);
}

/**
 * Persists full FTP configuration.
 */
export async function saveFtpConfiguration(
  payload: FtpConfiguration,
  idempotencyKey: string,
): Promise<FtpConfiguration> {
  return apiRequestData<FtpConfiguration>(FTP_PATH, {
    method: 'PUT',
    body: payload,
    idempotencyKey,
  });
}

/**
 * Loads watchdog configuration from srv_cfg.ini.
 */
export async function fetchWatchdogConfiguration(): Promise<WatchdogConfiguration> {
  return apiRequestData<WatchdogConfiguration>(WATCHDOG_PATH);
}

/**
 * Persists watchdog configuration.
 */
export async function saveWatchdogConfiguration(
  payload: WatchdogConfiguration,
  idempotencyKey: string,
): Promise<WatchdogConfiguration> {
  return apiRequestData<WatchdogConfiguration>(WATCHDOG_PATH, {
    method: 'PUT',
    body: payload,
    idempotencyKey,
  });
}

/**
 * Fetches paginated factory numbers list.
 */
export function fetchFactoryNumbers(
  params: ListQueryParams,
): Promise<PaginatedResponse<FactoryNumberRow>> {
  return fetchPaginatedList<FactoryNumberRow>(FACTORY_NUMBERS_PATH, params);
}

/**
 * Creates a factory number record.
 */
export async function createFactoryNumber(
  payload: { factory_number: string; is_default: boolean },
  idempotencyKey: string,
): Promise<FactoryNumberRow> {
  return apiRequestData<FactoryNumberRow>(FACTORY_NUMBERS_PATH, {
    method: 'POST',
    body: payload,
    idempotencyKey,
  });
}

/**
 * Updates a factory number record.
 */
export async function updateFactoryNumber(
  id: number,
  payload: { factory_number?: string; is_default?: boolean },
  idempotencyKey: string,
): Promise<FactoryNumberRow> {
  return apiRequestData<FactoryNumberRow>(`${FACTORY_NUMBERS_PATH}${id}`, {
    method: 'PATCH',
    body: payload,
    idempotencyKey,
  });
}

/**
 * Deletes factory number records by id list.
 */
export async function deleteFactoryNumbers(
  ids: number[],
  idempotencyKey: string,
): Promise<string> {
  return apiRequestData<string>(FACTORY_NUMBERS_PATH, {
    method: 'DELETE',
    body: { id_factory_numbers: ids },
    idempotencyKey,
  });
}
