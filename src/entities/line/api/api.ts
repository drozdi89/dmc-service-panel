import { apiRequestData, fetchPaginatedList } from '@/shared/api';
import type { ListQueryParams } from '@/shared/types/listQuery';
import { LINE_PRINTED_DM_OPTION } from '../model/constants';
import type { LineConfiguration, LineListItem } from '../model/types';

const LINES_PATH = '/api/v2/lines/';

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
  return apiRequestData<LineConfiguration>(`/api/v2/lines/get_line/${lineId}`, {
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
    const data = await apiRequestData<{ options_value?: string | null }>(
      `/api/v2/marking_options/value/${LINE_PRINTED_DM_OPTION}`,
    );
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
    const data = await apiRequestData<{ options_value?: string | null }>(
      `/api/v2/marking_options/value/${LINE_PRINTED_DM_OPTION}`,
    );
    return data.options_value ?? null;
  } catch {
    return null;
  }
}
