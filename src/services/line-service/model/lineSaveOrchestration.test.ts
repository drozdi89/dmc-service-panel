import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDefaultLineFormState } from '@/entities/line';
import { ApiError } from '@/shared/api';
import {
  createLineSaveMutator,
  extractLineId,
  saveLineConfiguration,
  type LineSaveMutator,
} from './lineSaveOrchestration';

vi.mock('@/shared/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api')>();
  return {
    ...actual,
    apiRequestData: vi.fn().mockResolvedValue(undefined),
  };
});

function createMutatorRecorder(): {
  mutate: LineSaveMutator;
  calls: Array<{ path: string; method: string; body?: unknown }>;
} {
  const calls: Array<{ path: string; method: string; body?: unknown }> = [];
  const mutate: LineSaveMutator = async (path, method, body) => {
    calls.push({ path, method, body });
    return {};
  };
  return { mutate, calls };
}

describe('saveLineConfiguration lines_options upsert', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('PATCHes lines_options when row exists', async () => {
    const { mutate, calls } = createMutatorRecorder();
    const state = { ...createDefaultLineFormState(), name: 'Line A', has_lines_options: false };

    await saveLineConfiguration(state, 7, '{}', mutate);

    const optionsCalls = calls.filter((call) => call.path.includes('lines_options'));
    expect(optionsCalls).toEqual([
      { path: '/api/v2/lines_options/7', method: 'PATCH', body: expect.objectContaining({ lineid: 7 }) },
    ]);
  });

  it('POSTs lines_options when PATCH returns 404', async () => {
    const calls: Array<{ path: string; method: string; body?: unknown }> = [];
    const mutate: LineSaveMutator = async (path, method, body) => {
      calls.push({ path, method, body });
      if (path === '/api/v2/lines_options/7' && method === 'PATCH') {
        throw new ApiError(404, 'Not found');
      }
      return {};
    };
    const state = { ...createDefaultLineFormState(), name: 'Line A', has_lines_options: true };

    await saveLineConfiguration(state, 7, '{}', mutate);

    const optionsCalls = calls.filter((call) => call.path.includes('lines_options'));
    expect(optionsCalls).toHaveLength(2);
    expect(optionsCalls[0]?.method).toBe('PATCH');
    expect(optionsCalls[1]).toEqual({
      path: '/api/v2/lines_options/',
      method: 'POST',
      body: expect.objectContaining({ lineid: 7 }),
    });
  });

  it('POSTs lines_options for newly created line without relying on has_lines_options', async () => {
    const calls: Array<{ path: string; method: string; body?: unknown }> = [];
    const mutate: LineSaveMutator = async (path, method, body) => {
      calls.push({ path, method, body });
      if (path === '/api/v2/lines/' && method === 'POST') {
        return { lineid: 99 };
      }
      if (path === '/api/v2/lines_options/99' && method === 'PATCH') {
        throw new ApiError(404, 'Not found');
      }
      return {};
    };
    const state = { ...createDefaultLineFormState(), name: 'New line', has_lines_options: false };

    const result = await saveLineConfiguration(state, undefined, '{}', mutate);

    expect(result.lineId).toBe(99);
    const optionsCalls = calls.filter((call) => call.path.includes('lines_options'));
    expect(optionsCalls[0]?.method).toBe('PATCH');
    expect(optionsCalls[1]?.method).toBe('POST');
    expect(optionsCalls[1]?.path).toBe('/api/v2/lines_options/');
  });

  it('rethrows non-404 PATCH errors', async () => {
    const mutate: LineSaveMutator = async (path, method) => {
      if (path === '/api/v2/lines_options/7' && method === 'PATCH') {
        throw new ApiError(500, 'Server error');
      }
      return {};
    };
    const state = { ...createDefaultLineFormState(), name: 'Line A' };

    await expect(saveLineConfiguration(state, 7, '{}', mutate)).rejects.toThrow('Server error');
  });
});

describe('createLineSaveMutator', () => {
  it('delegates to apiRequestData with shared idempotency key', async () => {
    const { apiRequestData } = await import('@/shared/api');
    const mutator = createLineSaveMutator('test-key-123');
    await mutator('/api/v2/lines/1', 'PATCH', { name: 'X' });

    expect(apiRequestData).toHaveBeenCalledWith('/api/v2/lines/1', {
      method: 'PATCH',
      body: { name: 'X' },
      idempotencyKey: 'test-key-123',
    });
  });
});

describe('extractLineId', () => {
  it('reads lineid field', () => {
    expect(extractLineId({ lineid: 42 })).toBe(42);
  });
});
