import {
  buildAggregationLevelPayload,
  buildLinePayload,
  buildLinePrintedDmSettings,
  buildLinesOptionsPayload,
  buildWeightStationsPayload,
  createAggregationLevel,
  createLine,
  deleteAggregationLevels,
  extractAggregationLevelId,
  extractLineId,
  replaceAggregationCameras,
  replaceAggregationPrinters,
  replaceLineFavouriteProducts,
  updateAggregationLevel,
  updateLine,
  upsertLinesOptions,
  upsertWeightStations,
  validateLineForm,
  type LineEditorFormState,
} from '@/entities/line';
import { saveMarkingOptionsBatch } from '@/entities/parameters';
import { createIdempotencyKey } from '@/shared/api';

/** Result of line save orchestration. */
export interface LineSaveResult {
  lineId: number;
}

/** Dialog context of a line save (not part of the form object). */
export interface LineSaveContext {
  /** Undefined for create. */
  existingLineId: number | undefined;
  /** Persisted aggregation levels removed in the editor (DELETE before upserts). */
  deletedAggregationLevelIds: number[];
  /** Current `line_printed_dm_use` JSON string. */
  printedDmRaw: string | null;
}

/**
 * Saves line configuration using Qt LineConfiguration.accept chain.
 *
 * HTTP lives in entity-api; this module only sequences calls.
 *
 * @param state - Editor form state.
 * @param context - Line id, deleted aggregation level ids, printed DM setting.
 * @param idempotencyKey - Shared key for the whole save chain.
 */
export async function saveLineConfiguration(
  state: LineEditorFormState,
  { existingLineId, deletedAggregationLevelIds, printedDmRaw }: LineSaveContext,
  idempotencyKey: string,
): Promise<LineSaveResult> {
  const validationError = validateLineForm(state);
  if (validationError) {
    throw new Error(validationError);
  }

  const linePayload = buildLinePayload(state);
  let lineId = existingLineId;

  if (lineId === undefined) {
    const created = await createLine(linePayload, idempotencyKey);
    lineId = extractLineId(created);
    if (lineId === undefined) {
      throw new Error('Не удалось получить идентификатор созданной линии');
    }
  } else {
    await updateLine(lineId, linePayload, idempotencyKey);
  }

  await upsertLinesOptions(lineId, buildLinesOptionsPayload(state, lineId), idempotencyKey);

  const printedSettings = buildLinePrintedDmSettings(lineId, state.allow_printed_dm, printedDmRaw);
  await saveMarkingOptionsBatch(printedSettings);

  if (deletedAggregationLevelIds.length > 0) {
    await deleteAggregationLevels(deletedAggregationLevelIds, idempotencyKey);
  }

  for (const level of state.aggregation_levels) {
    const payload = buildAggregationLevelPayload(level, lineId);
    let levelId = level.id;

    if (levelId === undefined) {
      const created = await createAggregationLevel(payload, idempotencyKey);
      levelId = extractAggregationLevelId(created);
    } else {
      await updateAggregationLevel(levelId, payload, idempotencyKey);
    }

    if (levelId === undefined) {
      continue;
    }

    await replaceAggregationCameras(levelId, level.unit_camera_ids, idempotencyKey);
    await replaceAggregationPrinters(levelId, level.printer_ids, idempotencyKey);
  }

  if (state.is_scale) {
    await upsertWeightStations(
      lineId,
      buildWeightStationsPayload(state, lineId),
      idempotencyKey,
    );
  }

  await replaceLineFavouriteProducts(lineId, state.favourite_gtins, idempotencyKey);

  return { lineId };
}

/**
 * Convenience wrapper with auto-generated idempotency key.
 */
export async function saveLineWithIdempotency(
  state: LineEditorFormState,
  context: LineSaveContext,
): Promise<LineSaveResult> {
  return saveLineConfiguration(state, context, createIdempotencyKey());
}

export { extractAggregationLevelId, extractLineId } from '@/entities/line';
