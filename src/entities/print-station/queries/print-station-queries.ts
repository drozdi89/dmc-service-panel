import { createIdempotencyKey } from '@/shared/api';
import { factoryMutation, factoryQuery } from '@/shared/queries';
import type { ListQueryParams } from '@/shared/types/listQuery';
import {
  createPrintStation,
  deletePrintStations,
  fetchPrintStationById,
  fetchPrintStations,
  fetchPrintStationsLookup,
  updatePrintStation,
} from '../api/api';
import type {
  CreatePrintStationPayload,
  PrintStation,
  UpdatePrintStationPayload,
} from '../model/types';

/** Shared TanStack Query root for list / lookup / detail and CRUD mutations. */
export const PRINT_STATION_QUERY_ENTRY = ['print-stations'] as const;

/** Print station row with `id` for {@link factoryMutation} detail cache. */
export type PrintStationItem = PrintStation & { id: number };

function withMutationId(row: PrintStation): PrintStationItem {
  return { ...row, id: row.station_id };
}

const queryApi = factoryQuery<PrintStation, ListQueryParams, number>({
  entry: PRINT_STATION_QUERY_ENTRY,
  fetchList: fetchPrintStations,
  fetchLookup: fetchPrintStationsLookup,
  fetchDetail: fetchPrintStationById,
});

const mutationApi = factoryMutation<PrintStationItem, number>({
  entry: PRINT_STATION_QUERY_ENTRY,
  fetchCreate: (data) =>
    createPrintStation(data as CreatePrintStationPayload, createIdempotencyKey()).then(
      withMutationId,
    ),
  fetchUpdate: (id, data) =>
    updatePrintStation(id, data as UpdatePrintStationPayload, createIdempotencyKey()).then(
      withMutationId,
    ),
  fetchDelete: async (id) => {
    await deletePrintStations([id], createIdempotencyKey());
    return null;
  },
});

/**
 * Canonical TanStack Query API for print stations (read + create / update / delete).
 *
 * Keys (entry {@link PRINT_STATION_QUERY_ENTRY}).
 * Invalidate via `printStationQueries.keys.all()`.
 */
export const printStationQueries = {
  ...queryApi,
  ...mutationApi,
};