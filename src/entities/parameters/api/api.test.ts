import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestMock = vi.hoisted(() => vi.fn());

vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/api')>()),
  apiRequestData: requestMock,
}));

import { ApiError } from '@/shared/api';
import { fetchCodeCleanupSettings, parseTeleBotSetting } from './api';

describe('parseTeleBotSetting', () => {
  it('returns null for empty object', () => {
    expect(parseTeleBotSetting({})).toBeNull();
  });

  it('returns row from paginated response', () => {
    const row = { bot_setting_id: 1, api_token: 'token', is_activ: true };
    expect(
      parseTeleBotSetting({
        page: 1,
        next_page: 2,
        previous_page: 0,
        size: 50,
        total_records: 1,
        response: [row],
      }),
    ).toEqual(row);
  });

  it('returns direct row payload', () => {
    const row = { bot_setting_id: 2, api_token: 'abc', is_activ: false };
    expect(parseTeleBotSetting(row)).toEqual(row);
  });
});

describe('fetchCodeCleanupSettings', () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it('parses the four marking options', async () => {
    const values: Record<string, string> = {
      code_cleanup_enabled: 'true',
      code_cleanup_days: '30',
      code_cleanup_start_time: '04:15',
      code_cleanup_interval_hours: '12',
    };
    requestMock.mockImplementation(async (path: string) => {
      const key = decodeURIComponent(path.split('/').pop() ?? '');
      return { options_name: key, options_value: values[key] };
    });

    await expect(fetchCodeCleanupSettings()).resolves.toEqual({
      enabled: true,
      days: 30,
      start_time: '04:15',
      interval_hours: 12,
    });
  });

  it('uses defaults for keys that answer 404', async () => {
    requestMock.mockRejectedValue(new ApiError(404, 'not found'));

    await expect(fetchCodeCleanupSettings()).resolves.toEqual({
      enabled: false,
      days: 180,
      start_time: '03:00',
      interval_hours: 24,
    });
  });

  it('rethrows non-404 errors', async () => {
    requestMock.mockRejectedValue(new ApiError(500, 'boom'));

    await expect(fetchCodeCleanupSettings()).rejects.toThrow('boom');
  });
});
