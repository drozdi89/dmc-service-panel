import { ApiError, apiRequestData, fetchPaginatedList } from '@/shared/api';
import type { ListQueryParams } from '@/shared/types/listQuery';
import { LINE_PRINTED_DM_OPTION } from '../model/constants';
import type { LineConfiguration, LineListItem } from '../model/types';

const LINES_PATH = '/api/v2/lines/';
const LINES_OPTIONS_PATH = '/api/v2/lines_options/';
const AGGREGATION_LEVELS_PATH = '/api/v2/aggregation_levels/';
const AGGREGATION_CAMERAS_PATH = '/api/v2/aggregation_cameras/';
const AGGREGATION_PRINTERS_PATH = '/api/v2/aggregation_printers/';
const WEIGHT_STATIONS_PATH = '/api/v2/weight_stations/';
const LINE_FAV_PROD_PATH = '/api/v2/line_fav_prod/';
const MARKING_OPTIONS_VALUE_PATH = `/api/v2/marking_options/value/${LINE_PRINTED_DM_OPTION}`;

/**
 * Fetches paginated production lines list.
 *
 * @param params - List query contract params.
 */
export function fetchLinesList(params: ListQueryParams) {
  return fetchPaginatedList<LineListItem>(LINES_PATH, params);
}

/**
 * Lookup-select fetcher for production lines.
 *
 * Alias of {@link fetchLinesList} until a dedicated `/lines/lookup` endpoint exists.
 *
 * @param params - size, number, q (List Query Contract subset).
 */
export function fetchLinesLookup(params: ListQueryParams) {
  return fetchLinesList(params);
}

/** Creates a production line (list row or editor write payload). */
export async function createLine(
  payload: unknown,
  idempotencyKey: string,
): Promise<LineListItem> {
  return apiRequestData<LineListItem>(LINES_PATH, {
    method: 'POST',
    body: payload,
    idempotencyKey,
  });
}

/** Updates a production line (list row or editor write payload). */
export async function updateLine(
  lineId: number,
  payload: unknown,
  idempotencyKey: string,
): Promise<LineListItem> {
  return apiRequestData<LineListItem>(`${LINES_PATH}${lineId}`, {
    method: 'PATCH',
    body: payload,
    idempotencyKey,
  });
}

/** Deletes production lines by id list. */
export async function deleteLines(ids: number[], idempotencyKey: string): Promise<string> {
  return apiRequestData<string>(LINES_PATH, {
    method: 'DELETE',
    body: { id_lines: ids },
    idempotencyKey,
  });
}

/**
 * Loads full line configuration for the editor.
 *
 * @param lineId - Line primary key.
 * @param signal - Optional abort signal.
 */
export async function fetchLineConfiguration(
  lineId: number,
  signal?: AbortSignal,
): Promise<LineConfiguration> {
  return apiRequestData<LineConfiguration>(`${LINES_PATH}get_line/${lineId}`, {
    params: { skip_wares: false },
    signal,
  });
}

/**
 * Loads per-line allow-printed-DM flag from marking_options JSON map.
 *
 * @param lineId - Line primary key.
 */
export async function fetchLineAllowPrintedDm(lineId: number): Promise<boolean> {
  try {
    const data = await apiRequestData<{ options_value?: string | null }>(MARKING_OPTIONS_VALUE_PATH);
    if (!data.options_value) {
      return false;
    }
    const parsed = JSON.parse(data.options_value) as Record<string, boolean>;
    return Boolean(parsed[String(lineId)]);
  } catch {
    return false;
  }
}

/**
 * Parses line_printed_dm_use JSON map from marking option value.
 *
 * @param raw - Raw options_value string.
 */
export function parseLinePrintedDmMap(raw: string | null | undefined): Record<string, boolean> {
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {};
  }
}

/**
 * Loads raw line_printed_dm_use marking option value.
 */
export async function fetchLinePrintedDmRaw(): Promise<string | null> {
  try {
    const data = await apiRequestData<{ options_value?: string | null }>(MARKING_OPTIONS_VALUE_PATH);
    return data.options_value ?? null;
  } catch {
    return null;
  }
}

/**
 * Extracts line id from POST /lines/ response.
 */
export function extractLineId(response: unknown): number | undefined {
  if (!response || typeof response !== 'object') {
    return undefined;
  }
  const record = response as Record<string, unknown>;
  const candidates = [record.lineid, record.id, record.id_lines];
  for (const value of candidates) {
    if (typeof value === 'number') {
      return value;
    }
  }
  return undefined;
}

/**
 * Extracts aggregation level id from POST response.
 */
export function extractAggregationLevelId(response: unknown): number | undefined {
  if (!response || typeof response !== 'object') {
    return undefined;
  }
  const record = response as Record<string, unknown>;
  const candidates = [record.id, record.id_aggregate_levels];
  for (const value of candidates) {
    if (typeof value === 'number') {
      return value;
    }
  }
  return undefined;
}

/** PATCH lines_options; on 404 POST a new row (Qt save_line_options parity). */
export async function upsertLinesOptions(
  lineId: number,
  payload: unknown,
  idempotencyKey: string,
): Promise<void> {
  try {
    await apiRequestData(`${LINES_OPTIONS_PATH}${lineId}`, {
      method: 'PATCH',
      body: payload,
      idempotencyKey,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      await apiRequestData(LINES_OPTIONS_PATH, {
        method: 'POST',
        body: payload,
        idempotencyKey,
      });
      return;
    }
    throw error;
  }
}

/** DELETE aggregation levels by id list. */
export async function deleteAggregationLevels(
  ids: number[],
  idempotencyKey: string,
): Promise<void> {
  await apiRequestData(AGGREGATION_LEVELS_PATH, {
    method: 'DELETE',
    body: { id_aggregate_levels: ids },
    idempotencyKey,
  });
}

/** Creates an aggregation level; returns created row. */
export async function createAggregationLevel(
  payload: unknown,
  idempotencyKey: string,
): Promise<unknown> {
  return apiRequestData(AGGREGATION_LEVELS_PATH, {
    method: 'POST',
    body: payload,
    idempotencyKey,
  });
}

/** Updates an aggregation level. */
export async function updateAggregationLevel(
  levelId: number,
  payload: unknown,
  idempotencyKey: string,
): Promise<void> {
  await apiRequestData(`${AGGREGATION_LEVELS_PATH}${levelId}`, {
    method: 'PATCH',
    body: payload,
    idempotencyKey,
  });
}

/** Replaces unit cameras for an aggregation level. */
export async function replaceAggregationCameras(
  levelId: number,
  cameraIds: number[],
  idempotencyKey: string,
): Promise<void> {
  await apiRequestData(AGGREGATION_CAMERAS_PATH, {
    method: 'DELETE',
    body: { aggr_lvl_id: levelId },
    idempotencyKey,
  });
  if (cameraIds.length === 0) {
    return;
  }
  await apiRequestData(AGGREGATION_CAMERAS_PATH, {
    method: 'POST',
    body: cameraIds.map((cameraId) => ({
      aggr_lvl_id: levelId,
      camera_id: cameraId,
    })),
    idempotencyKey,
  });
}

/** Replaces printers for an aggregation level (priority = index). */
export async function replaceAggregationPrinters(
  levelId: number,
  printerIds: number[],
  idempotencyKey: string,
): Promise<void> {
  await apiRequestData(AGGREGATION_PRINTERS_PATH, {
    method: 'DELETE',
    body: { aggr_lvl_id: [levelId] },
    idempotencyKey,
  });
  if (printerIds.length === 0) {
    return;
  }
  await apiRequestData(AGGREGATION_PRINTERS_PATH, {
    method: 'POST',
    body: printerIds.map((printerId, index) => ({
      aggr_lvl_id: levelId,
      printer_id: printerId,
      priority: index,
    })),
    idempotencyKey,
  });
}

/** PATCH weight stations; on failure POST create. */
export async function upsertWeightStations(
  lineId: number,
  payload: unknown,
  idempotencyKey: string,
): Promise<void> {
  try {
    await apiRequestData(`${WEIGHT_STATIONS_PATH}${lineId}`, {
      method: 'PATCH',
      body: payload,
      idempotencyKey,
    });
  } catch {
    await apiRequestData(WEIGHT_STATIONS_PATH, {
      method: 'POST',
      body: payload,
      idempotencyKey,
    });
  }
}

/** Replaces favourite products for a line. */
export async function replaceLineFavouriteProducts(
  lineId: number,
  gtins: string[],
  idempotencyKey: string,
): Promise<void> {
  await apiRequestData(LINE_FAV_PROD_PATH, {
    method: 'DELETE',
    body: { lineid: [lineId] },
    idempotencyKey,
  });
  if (gtins.length === 0) {
    return;
  }
  await apiRequestData(LINE_FAV_PROD_PATH, {
    method: 'POST',
    body: {
      items: gtins.map((gtin) => ({ lineid: lineId, gtin })),
    },
    idempotencyKey,
  });
}
