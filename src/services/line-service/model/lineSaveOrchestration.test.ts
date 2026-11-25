import { createDefaultLineFormState } from '@/entities/line';
import { ApiError } from '@/shared/api';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  extractLineId,
  saveLineConfiguration,
  type LineSaveContext,
} from './lineSaveOrchestration';

const lineApi = vi.hoisted(() => ({
  createLine: vi.fn(),
  updateLine: vi.fn(),
  upsertLinesOptions: vi.fn(),
  deleteAggregationLevels: vi.fn(),
  createAggregationLevel: vi.fn(),
  updateAggregationLevel: vi.fn(),
  replaceAggregationCameras: vi.fn(),
  replaceAggregationPrinters: vi.fn(),
  upsertWeightStations: vi.fn(),
  replaceLineFavouriteProducts: vi.fn(),
  extractLineId: vi.fn((response: unknown) => {
    if (!response || typeof response !== 'object') {
      return undefined;
    }
    const record = response as Record<string, unknown>;
    return typeof record.lineid === 'number' ? record.lineid : undefined;
  }),
  extractAggregationLevelId: vi.fn(),
}));

const parametersApi = vi.hoisted(() => ({
  saveMarkingOptionsBatch: vi.fn().mockResolvedValue({ updated: 1 }),
}));

vi.mock('@/entities/line', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/line')>();
  return {
    ...actual,
    ...lineApi,
  };
});

vi.mock('@/entities/parameters', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/parameters')>();
  return {
    ...actual,
    saveMarkingOptionsBatch: parametersApi.saveMarkingOptionsBatch,
  };
});

function editContext(
  existingLineId: number | undefined,
  deletedAggregationLevelIds: number[] = [],
): LineSaveContext {
  return { existingLineId, deletedAggregationLevelIds, printedDmRaw: '{}' };
}

function resetMocks() {
  for (const fn of Object.values(lineApi)) {
    fn.mockReset();
  }
  parametersApi.saveMarkingOptionsBatch.mockReset();
  parametersApi.saveMarkingOptionsBatch.mockResolvedValue({ updated: 1 });
  lineApi.upsertLinesOptions.mockResolvedValue(undefined);
  lineApi.deleteAggregationLevels.mockResolvedValue(undefined);
  lineApi.replaceAggregationCameras.mockResolvedValue(undefined);
  lineApi.replaceAggregationPrinters.mockResolvedValue(undefined);
  lineApi.upsertWeightStations.mockResolvedValue(undefined);
  lineApi.replaceLineFavouriteProducts.mockResolvedValue(undefined);
  lineApi.updateLine.mockResolvedValue({});
  lineApi.createLine.mockResolvedValue({ lineid: 99 });
  lineApi.extractLineId.mockImplementation((response: unknown) => {
    if (!response || typeof response !== 'object') {
      return undefined;
    }
    const record = response as Record<string, unknown>;
    return typeof record.lineid === 'number' ? record.lineid : undefined;
  });
}

describe('saveLineConfiguration aggregation level deletes', () => {
  afterEach(resetMocks);

  it('DELETEs levels passed in the save context, not from the form object', async () => {
    resetMocks();
    const state = { ...createDefaultLineFormState(), linename: 'Line A' };

    await saveLineConfiguration(state, editContext(7, [3, 4]), 'key-1');

    expect(lineApi.deleteAggregationLevels).toHaveBeenCalledWith([3, 4], 'key-1');
  });

  it('skips the DELETE when nothing was removed', async () => {
    resetMocks();
    const state = { ...createDefaultLineFormState(), linename: 'Line A' };

    await saveLineConfiguration(state, editContext(7), 'key-1');

    expect(lineApi.deleteAggregationLevels).not.toHaveBeenCalled();
  });
});

describe('saveLineConfiguration lines_options upsert', () => {
  afterEach(resetMocks);

  it('upserts lines_options for existing line', async () => {
    resetMocks();
    const state = { ...createDefaultLineFormState(), linename: 'Line A' };

    await saveLineConfiguration(state, editContext(7), 'key-1');

    expect(lineApi.upsertLinesOptions).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ lineid: 7 }),
      'key-1',
    );
    expect(lineApi.updateLine).toHaveBeenCalledWith(7, expect.anything(), 'key-1');
    expect(parametersApi.saveMarkingOptionsBatch).toHaveBeenCalled();
  });

  it('propagates upsertLinesOptions errors', async () => {
    resetMocks();
    lineApi.upsertLinesOptions.mockRejectedValue(new ApiError(500, 'Server error'));
    const state = { ...createDefaultLineFormState(), linename: 'Line A' };

    await expect(saveLineConfiguration(state, editContext(7), 'key-1')).rejects.toThrow(
      'Server error',
    );
  });

  it('creates line then upserts options for new line', async () => {
    resetMocks();
    lineApi.createLine.mockResolvedValue({ lineid: 99 });
    const state = { ...createDefaultLineFormState(), linename: 'New line' };

    const result = await saveLineConfiguration(state, editContext(undefined), 'key-1');

    expect(result.lineId).toBe(99);
    expect(lineApi.createLine).toHaveBeenCalled();
    expect(lineApi.upsertLinesOptions).toHaveBeenCalledWith(
      99,
      expect.objectContaining({ lineid: 99 }),
      'key-1',
    );
  });
});

describe('extractLineId', () => {
  it('reads lineid field', () => {
    expect(extractLineId({ lineid: 42 })).toBe(42);
  });
});
