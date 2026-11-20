import { apiRequestData, fetchPaginatedList } from '@/shared/api';
import type { ListQueryParams } from '@/shared/types/listQuery';
import type { PrintStation } from '../model/types';

const PRINT_STATIONS_PATH = '/api/v2/print_stations/';
const PRINT_STATIONS_LOOKUP_PATH = '/api/v2/print_stations/lookup';

/**
 * Fetches paginated print stations (List Query Contract).
 *
 * @param params - size, number, q, sort_by, sort_dir.
 */
export function fetchPrintStations(params: ListQueryParams) {
  return fetchPaginatedList<PrintStation>(PRINT_STATIONS_PATH, params);
}

/**
 * Lookup-select fetcher for print stations (`/print_stations/lookup`).
 *
 * @param params - size, number, q (List Query Contract subset).
 */
export function fetchPrintStationsLookup(params: ListQueryParams) {
  return fetchPaginatedList<PrintStation>(PRINT_STATIONS_LOOKUP_PATH, params);
}

/**
 * Fetches a single print station by id.
 *
 * @param stationId - Station primary key.
 * @param signal - Optional abort signal to cancel an in-flight request.
 */
export function fetchPrintStationById(
  stationId: number,
  signal?: AbortSignal,
): Promise<PrintStation> {
  return apiRequestData<PrintStation>(`${PRINT_STATIONS_PATH}${stationId}`, { signal });
}
