import type { components } from '@/shared/api';

/** Print station row from list/detail API. */
export type PrintStation = components['schemas']['PrintStationsSchema'] & {
  station_id: number;
};

/** Payload for creating a print station. */
export type CreatePrintStationPayload = components['schemas']['PrintStationsSchema'];

/** Payload for updating a print station. */
export type UpdatePrintStationPayload = components['schemas']['UpdatePrintStationsSchema'];

/** Payload for deleting print stations. */
export type DeletePrintStationsPayload = components['schemas']['DeletePrintStationsSchema'];
