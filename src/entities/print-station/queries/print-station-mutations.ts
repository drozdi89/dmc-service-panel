import { createIdempotencyKey } from '@/shared/api';
import { factoryMutation } from '@/shared/queries';
import {
  createPrintStation,
  deletePrintStations,
  updatePrintStation,
} from '../api/api';
import type {
  CreatePrintStationPayload,
  PrintStation,
  UpdatePrintStationPayload,
} from '../model/types';

/** Print station row with `id` for {@link factoryMutation} detail cache. */
export type PrintStationItem = PrintStation & { id: number };

function withMutationId(row: PrintStation): PrintStationItem {
  return { ...row, id: row.station_id };
}

/** Create / update / delete mutations for print stations. */
export const printStationFactory = factoryMutation<PrintStationItem, number>({
  entry: ['print-stations'],
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