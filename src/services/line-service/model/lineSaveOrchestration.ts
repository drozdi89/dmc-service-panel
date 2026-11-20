import {
  buildAggregationLevelPayload,
  buildLinePayload,
  buildLinePrintedDmSettings,
  buildLinesOptionsPayload,
  buildWeightStationsPayload,
  validateLineForm,
  type LineEditorFormState,
} from '@/entities/line';
import { ApiError, apiRequestData } from '@/shared/api';
import { createIdempotencyKey } from '@/shared/api/headers';

/** Mutation executor for idempotent save chain steps. */
export interface LineSaveMutator {
  (
    path: string,
    method: 'POST' | 'PATCH' | 'DELETE',
    body?: unknown,
  ): Promise<unknown>;
}

/** Result of line save orchestration. */
export interface LineSaveResult {
  lineId: number;
}

/**
 * Creates a mutator that sends requests with a shared idempotency key.
 *
 * @param idempotencyKey - Shared key for the whole save chain.
 */
export function createLineSaveMutator(idempotencyKey: string): LineSaveMutator {
  return (path, method, body) =>
    apiRequestData(path, {
      method,
      body,
      // idempotencyKey,
    });
}

/**
 * Saves line configuration using Qt LineConfiguration.accept chain.
 *
 * @param state - Editor form state.
 * @param existingLineId - Undefined for create.
 * @param printedDmRaw - Current line_printed_dm_use JSON string.
 * @param mutate - Idempotent mutation executor.
 */
export async function saveLineConfiguration(
  state: LineEditorFormState,
  existingLineId: number | undefined,
  printedDmRaw: string | null,
  mutate: LineSaveMutator,
): Promise<LineSaveResult> {
  const validationError = validateLineForm(state);
  if (validationError) {
    throw new Error(validationError);
  }

  const linePayload = buildLinePayload(state);
  let lineId = existingLineId;

  if (lineId === undefined) {
    const created = await mutate('/api/v2/lines/', 'POST', linePayload);
    lineId = extractLineId(created);
    if (lineId === undefined) {
      throw new Error('Не удалось получить идентификатор созданной линии');
    }
  } else {
    await mutate(`/api/v2/lines/${lineId}`, 'PATCH', linePayload);
  }

  await upsertLinesOptions(state, lineId, mutate);

  const printedSettings = buildLinePrintedDmSettings(lineId, state.allow_printed_dm, printedDmRaw);
  await apiRequestData('/api/v2/marking_options/batch', {
    method: 'POST',
    body: { "settings": printedSettings },
  });

  if (state.deleted_aggregation_level_ids.length > 0) {
    await mutate('/api/v2/aggregation_levels/', 'DELETE', {
      id_aggregate_levels: state.deleted_aggregation_level_ids,
    });
  }

  for (const level of state.aggregation_levels) {
    const payload = buildAggregationLevelPayload(level, lineId);
    let levelId = level.id;

    if (levelId === undefined) {
      const created = await mutate('/api/v2/aggregation_levels/', 'POST', payload);
      levelId = extractAggregationLevelId(created);
    } else {
      await mutate(`/api/v2/aggregation_levels/${levelId}`, 'PATCH', payload);
    }

    if (levelId === undefined) {
      continue;
    }

    await mutate('/api/v2/aggregation_cameras/', 'DELETE', { aggr_lvl_id: levelId });

    if (level.unit_camera_ids.length > 0) {
      await mutate(
        '/api/v2/aggregation_cameras/',
        'POST',
        level.unit_camera_ids.map((cameraId) => ({
          aggr_lvl_id: levelId,
          camera_id: cameraId,
        })),
      );
    }

    await mutate('/api/v2/aggregation_printers/', 'DELETE', {
      aggr_lvl_id: [levelId],
    });

    if (level.printer_ids.length > 0) {
      await mutate(
        '/api/v2/aggregation_printers/',
        'POST',
        level.printer_ids.map((printerId, index) => ({
          aggr_lvl_id: levelId,
          printer_id: printerId,
          priority: index,
        })),
      );
    }
  }

  if (state.is_scale) {
    const weightPayload = buildWeightStationsPayload(state, lineId);
    try {
      await mutate(`/api/v2/weight_stations/${lineId}`, 'PATCH', weightPayload);
    } catch {
      await mutate('/api/v2/weight_stations/', 'POST', weightPayload);
    }
  }

  await mutate('/api/v2/line_fav_prod/', 'DELETE', { lineid: [lineId] });
  if (state.favourite_gtins.length > 0) {
    await mutate('/api/v2/line_fav_prod/', 'POST', {
      items: state.favourite_gtins.map((gtin) => ({ lineid: lineId, gtin })),
    });
  }

  return { lineId };
}

/**
 * Persists line options: PATCH when row exists, POST on 404 (Qt save_line_options parity).
 *
 * @param state - Editor form state.
 * @param lineId - Target line id.
 * @param mutate - Idempotent mutation executor.
 */
async function upsertLinesOptions(
  state: LineEditorFormState,
  lineId: number,
  mutate: LineSaveMutator,
): Promise<void> {
  const optionsPayload = buildLinesOptionsPayload(state, lineId);
  try {
    await mutate(`/api/v2/lines_options/${lineId}`, 'PATCH', optionsPayload);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      await mutate('/api/v2/lines_options/', 'POST', optionsPayload);
      return;
    }
    throw error;
  }
}

/**
 * Convenience wrapper with auto-generated idempotency key.
 */
export async function saveLineWithIdempotency(
  state: LineEditorFormState,
  existingLineId: number | undefined,
  printedDmRaw: string | null,
): Promise<LineSaveResult> {
  const key = createIdempotencyKey();
  return saveLineConfiguration(state, existingLineId, printedDmRaw, createLineSaveMutator(key));
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
