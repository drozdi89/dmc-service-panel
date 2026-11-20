import {
  apiRequestData,
  fetchPaginatedList,
  type ApiRequestOptions,
} from '@/shared/api';
import type { components } from '@/shared/api';
import type { ListQueryParams, PaginatedResponse } from '@/shared/types/listQuery';
import type {
  AutoorderOptions,
  AutosendSettingsPayload,
  CrptOrganization,
  CrptOrganizationCreatePayload,
  CrptOrganizationUpdatePayload,
  DataMarkCredentials,
  LineListItem,
  LineOptions,
  OneCExchangeServersResponse,
  OneCExchangeSettings,
  OneCExchangeSettingsPayload,
  ServerActivationInfo,
  UtraceSettings,
  WmsEfkoSettings,
  WmsEfkoSettingsPayload,
} from '../model/types';

const CRPT_ORGS_PATH = '/api/v2/crpt_organizations/';
const DATAMARK_PATH = '/api/v2/datamark_organizations/';
const UTRACE_PATH = '/api/v2/utrace_setting/';
const AUTOORDER_PATH = '/api/v2/autoorder_options/';
const AUTOSEND_PATH = '/api/v2/autosend_settings/';
const LINES_PATH = '/api/v2/lines/';
const LINES_OPTIONS_PATH = '/api/v2/lines_options/';
const ONE_C_EXCHANGE_PATH = '/api/v2/one_c_exchange/';
const WMS_EFKO_PATH = '/api/v2/service_config/wms_efko/';
const ACTIVATION_PATH = '/api/v2/server_settings/activation';
const MARKING_BATCH_PATH = '/api/v2/marking_options/batch';

/**
 * Fetches paginated CRPT organizations for ServerDataTable.
 *
 * @param params - List query contract params.
 */
export async function fetchCrptOrganizations(
  params: ListQueryParams,
): Promise<PaginatedResponse<CrptOrganization>> {
  return fetchPaginatedList<CrptOrganization>(CRPT_ORGS_PATH, params);
}

/**
 * Loads a single CRPT organization by INN.
 *
 * @param inn - Organization INN.
 * @param signal - Optional abort signal to cancel an in-flight request.
 */
export async function fetchCrptOrganization(
  inn: string,
  signal?: AbortSignal,
): Promise<CrptOrganization> {
  return apiRequestData<CrptOrganization>(`${CRPT_ORGS_PATH}${encodeURIComponent(inn)}`, {
    signal,
  });
}

/**
 * Creates a CRPT organization.
 *
 * @param payload - Create payload.
 * @param idempotencyKey - Idempotency key for POST.
 */
export async function createCrptOrganization(
  payload: CrptOrganizationCreatePayload,
  idempotencyKey: string,
): Promise<CrptOrganization> {
  return apiRequestData<CrptOrganization>(CRPT_ORGS_PATH, {
    method: 'POST',
    body: payload,
    idempotencyKey,
  });
}

/**
 * Updates a CRPT organization by INN.
 *
 * @param inn - Organization INN.
 * @param payload - Partial update payload.
 * @param idempotencyKey - Idempotency key for PATCH.
 */
export async function updateCrptOrganization(
  inn: string,
  payload: CrptOrganizationUpdatePayload,
  idempotencyKey: string,
): Promise<CrptOrganization> {
  return apiRequestData<CrptOrganization>(`${CRPT_ORGS_PATH}${encodeURIComponent(inn)}`, {
    method: 'PATCH',
    body: payload,
    idempotencyKey,
  });
}

/**
 * Deletes CRPT organizations by INN list.
 *
 * @param inns - Organization INNs to delete.
 * @param idempotencyKey - Idempotency key for DELETE.
 */
export async function deleteCrptOrganizations(
  inns: string[],
  idempotencyKey: string,
): Promise<string> {
  return apiRequestData<string>(CRPT_ORGS_PATH, {
    method: 'DELETE',
    body: { inn: inns },
    idempotencyKey,
  });
}

/**
 * Saves organization CRPT template index via marking_options batch.
 *
 * @param inn - Organization INN.
 * @param templateIdx - Template index (0 long, 1 short).
 */
export async function saveOrgCrptTemplateIdx(
  inn: string,
  templateIdx: number,
): Promise<{ updated: number }> {
  return apiRequestData<{ updated: number }>(MARKING_BATCH_PATH, {
    method: 'POST',
    body: {
      settings: [{ name: `${inn}_crpt_template_idx`, value: templateIdx }],
    },
  });
}

/**
 * Loads server activation info (allowed CRPT organization count).
 */
export async function fetchServerActivation(): Promise<ServerActivationInfo> {
  return apiRequestData<ServerActivationInfo>(ACTIVATION_PATH);
}

/**
 * Loads latest DataMark credentials or empty object.
 */
export async function fetchDataMarkCredentials(): Promise<Partial<DataMarkCredentials>> {
  return apiRequestData<Partial<DataMarkCredentials>>(DATAMARK_PATH);
}

/**
 * Creates DataMark credentials.
 *
 * @param payload - Credentials payload.
 * @param idempotencyKey - Idempotency key for POST.
 */
export async function createDataMarkCredentials(
  payload: DataMarkCredentials,
  idempotencyKey: string,
): Promise<unknown> {
  return apiRequestData(DATAMARK_PATH, {
    method: 'POST',
    body: payload,
    idempotencyKey,
  });
}

/**
 * Updates DataMark credentials by UNP (upsert on missing row).
 *
 * @param unp - Organization UNP.
 * @param payload - Credentials payload.
 * @param idempotencyKey - Idempotency key for PUT.
 */
export async function saveDataMarkCredentials(
  unp: string,
  payload: DataMarkCredentials,
  idempotencyKey: string,
): Promise<unknown> {
  return apiRequestData(`${DATAMARK_PATH}${encodeURIComponent(unp)}`, {
    method: 'PUT',
    body: payload,
    idempotencyKey,
  });
}

/**
 * Deletes DataMark credentials by UNP list.
 *
 * @param unps - UNP values to delete.
 * @param idempotencyKey - Idempotency key for DELETE.
 */
export async function deleteDataMarkCredentials(
  unps: string[],
  idempotencyKey: string,
): Promise<string> {
  return apiRequestData<string>(DATAMARK_PATH, {
    method: 'DELETE',
    body: { unp: unps },
    idempotencyKey,
  });
}

/**
 * Loads latest Utrace settings or empty object.
 */
export async function fetchUtraceSettings(): Promise<Partial<UtraceSettings>> {
  return apiRequestData<Partial<UtraceSettings>>(UTRACE_PATH);
}

/**
 * Creates Utrace settings.
 *
 * @param payload - Settings payload.
 * @param idempotencyKey - Idempotency key for POST.
 */
export async function createUtraceSettings(
  payload: UtraceSettings,
  idempotencyKey: string,
): Promise<unknown> {
  return apiRequestData(UTRACE_PATH, {
    method: 'POST',
    body: payload,
    idempotencyKey,
  });
}

/**
 * Updates Utrace settings by INN (upsert on missing row).
 *
 * @param inn - Organization INN.
 * @param payload - Settings payload.
 * @param idempotencyKey - Idempotency key for PUT.
 */
export async function saveUtraceSettings(
  inn: string,
  payload: UtraceSettings,
  idempotencyKey: string,
): Promise<unknown> {
  return apiRequestData(`${UTRACE_PATH}${encodeURIComponent(inn)}`, {
    method: 'PUT',
    body: payload,
    idempotencyKey,
  });
}

/**
 * Deletes all Utrace settings rows.
 *
 * @param idempotencyKey - Idempotency key for DELETE.
 */
export async function deleteUtraceSettings(idempotencyKey: string): Promise<{ deleted: number }> {
  return apiRequestData<{ deleted: number }>(UTRACE_PATH, {
    method: 'DELETE',
    idempotencyKey,
  });
}

/**
 * Loads autoorder configuration.
 */
export async function fetchAutoorderOptions(): Promise<AutoorderOptions> {
  return apiRequestData<AutoorderOptions>(AUTOORDER_PATH);
}

/**
 * Persists autoorder configuration.
 *
 * @param payload - Autoorder options.
 * @param idempotencyKey - Idempotency key for PUT.
 */
export async function saveAutoorderOptions(
  payload: AutoorderOptions,
  idempotencyKey: string,
): Promise<{ updated_products: number }> {
  return apiRequestData<{ updated_products: number }>(AUTOORDER_PATH, {
    method: 'PUT',
    body: payload,
    idempotencyKey,
  });
}

/**
 * Loads composite autosend configuration.
 */
export async function fetchAutosendSettings(): Promise<AutosendSettingsPayload> {
  return apiRequestData<AutosendSettingsPayload>(AUTOSEND_PATH);
}

/**
 * Persists composite autosend configuration.
 *
 * @param payload - Autosend settings.
 * @param idempotencyKey - Idempotency key for PUT.
 */
export async function saveAutosendSettings(
  payload: AutosendSettingsPayload,
  idempotencyKey: string,
): Promise<{
  updated_products: number;
  updated_schedule: number;
  updated_include_printed: number;
}> {
  return apiRequestData(AUTOSEND_PATH, {
    method: 'PUT',
    body: payload,
    idempotencyKey,
  });
}

/**
 * Fetches all production lines for task type configuration.
 */
export async function fetchAllLines(): Promise<LineListItem[]> {
  const pageSize = 200;
  const first = await fetchPaginatedList<LineListItem>(LINES_PATH, {
    size: pageSize,
    number: 0,
    sort_by: 'linename',
    sort_dir: 'asc',
  });
  const items = [...first.response];
  if (first.total_records > pageSize) {
    const pages = Math.ceil(first.total_records / pageSize);
    const rest = await Promise.all(
      Array.from({ length: pages - 1 }, (_, index) =>
        fetchPaginatedList<LineListItem>(LINES_PATH, {
          size: pageSize,
          number: index + 1,
          sort_by: 'linename',
          sort_dir: 'asc',
        }),
      ),
    );
    for (const page of rest) {
      items.push(...page.response);
    }
  }
  return items;
}

/**
 * Loads line runtime options by line id.
 *
 * @param lineid - Production line id.
 */
export async function fetchLineOptions(lineid: number): Promise<LineOptions> {
  return apiRequestData<LineOptions>(`${LINES_OPTIONS_PATH}${lineid}`);
}

/**
 * Creates line runtime options.
 *
 * @param payload - Create lines options payload.
 * @param idempotencyKey - Idempotency key for POST.
 */
export async function createLineOptions(
  payload: components['schemas']['CreateLinesOptionsSchema'],
  idempotencyKey: string,
): Promise<LineOptions> {
  return apiRequestData<LineOptions>(LINES_OPTIONS_PATH, {
    method: 'POST',
    body: payload,
    idempotencyKey,
  });
}

/**
 * Updates line runtime options (partial PATCH).
 *
 * @param lineid - Production line id.
 * @param payload - Partial options.
 * @param idempotencyKey - Idempotency key for the request.
 * @param options - Optional method override.
 */
export async function updateLineOptions(
  lineid: number,
  payload: Partial<LineOptions>,
  idempotencyKey: string,
  options?: Pick<ApiRequestOptions, 'method'>,
): Promise<LineOptions> {
  return apiRequestData<LineOptions>(`${LINES_OPTIONS_PATH}${lineid}`, {
    method: options?.method ?? 'PATCH',
    body: payload,
    idempotencyKey,
  });
}

/**
 * Loads singleton 1C Alife exchange settings.
 */
export async function fetchOneCExchangeSettings(): Promise<OneCExchangeSettings> {
  return apiRequestData<OneCExchangeSettings>(ONE_C_EXCHANGE_PATH);
}

/**
 * Upserts singleton 1C Alife exchange settings.
 *
 * @param payload - Settings snapshot.
 * @param idempotencyKey - Idempotency key for PUT.
 */
export async function saveOneCExchangeSettings(
  payload: OneCExchangeSettingsPayload,
  idempotencyKey: string,
): Promise<OneCExchangeSettings> {
  return apiRequestData<OneCExchangeSettings>(ONE_C_EXCHANGE_PATH, {
    method: 'PUT',
    body: payload,
    idempotencyKey,
  });
}

/**
 * Proxies GET /hs/alife/v1/server from 1C using stored connection settings.
 */
export async function fetchOneCExchangeServers(): Promise<OneCExchangeServersResponse> {
  return apiRequestData<OneCExchangeServersResponse>(`${ONE_C_EXCHANGE_PATH}servers`);
}

/**
 * Loads singleton WMS (Efko) exchange settings.
 */
export async function fetchWmsEfkoSettings(): Promise<WmsEfkoSettings> {
  return apiRequestData<WmsEfkoSettings>(WMS_EFKO_PATH);
}

/**
 * Upserts singleton WMS (Efko) exchange settings.
 *
 * @param payload - Settings snapshot.
 * @param idempotencyKey - Idempotency key for PUT.
 */
export async function saveWmsEfkoSettings(
  payload: WmsEfkoSettingsPayload,
  idempotencyKey: string,
): Promise<WmsEfkoSettings> {
  return apiRequestData<WmsEfkoSettings>(WMS_EFKO_PATH, {
    method: 'PUT',
    body: payload,
    idempotencyKey,
  });
}

/**
 * Tests MS SQL connectivity using stored WMS (Efko) settings.
 *
 * @param idempotencyKey - Idempotency key for POST.
 */
export async function testWmsEfkoConnection(
  idempotencyKey: string,
): Promise<{ ok: boolean }> {
  return apiRequestData<{ ok: boolean }>(`${WMS_EFKO_PATH}test_connection`, {
    method: 'POST',
    idempotencyKey,
  });
}
