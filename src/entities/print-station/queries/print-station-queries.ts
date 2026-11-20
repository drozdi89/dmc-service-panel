import { factoryQuery } from '@/shared/lib/factory-query';
import type { ListQueryParams } from '@/shared/types/listQuery';
import {
  fetchPrintStationById,
  fetchPrintStations,
  fetchPrintStationsLookup,
} from '../api/api';
import type { PrintStation } from '../model/types';

/**
 * Canonical TanStack Query helpers for print stations.
 *
 * Keys (entry `['print-stations']`):
 * - list: `['print-stations', 'list', params?]`
 * - lookup: `['print-stations', 'lookup', params?]`
 * - detail: `['print-stations', 'detail', stationId]`
 *
 * Invalidate after mutations via `printStationQueries.keys.all()`.
 */
export const printStationQueries = factoryQuery<PrintStation, ListQueryParams, number>({
  entry: ['print-stations'],
  fetchList: fetchPrintStations,
  fetchLookup: fetchPrintStationsLookup,
  fetchDetail: fetchPrintStationById,
});
