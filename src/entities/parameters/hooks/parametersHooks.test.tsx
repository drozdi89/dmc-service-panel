import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PARAMETERS_MESSAGES } from '../model/messages';
import type { ParametersSettingsBundle } from '../model/types';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    App: Object.assign(actual.App, { useApp: () => ({ message: toast }) }),
  };
});

const api = vi.hoisted(() => ({
  fetchCodeCleanupSettings: vi.fn(),
  fetchSettingsBundle: vi.fn(),
  fetchSlaveConfiguration: vi.fn(),
  fetchTeleBotSetting: vi.fn(),
  saveMarkingOptionsBatch: vi.fn(),
  saveTeleBotSetting: vi.fn(),
}));

vi.mock('../api/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/api')>()),
  ...api,
}));

import { useCodeCleanupSettings } from './useCodeCleanupSettings';
import { useMarkingSettings } from './useMarkingSettings';
import { useStatisticsSettings } from './useStatisticsSettings';
import { useTelegramSettings } from './useTelegramSettings';

const bundle = {
  gln: '1234567890123',
  batch_template: '{mandate}-{serial}',
  export_data_path: '/export',
  disable_statistics: true,
  disable_statistics_export: false,
} as ParametersSettingsBundle;

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  api.fetchCodeCleanupSettings.mockResolvedValue({
    enabled: true,
    days: 30,
    start_time: '04:00',
    interval_hours: 12,
  });
  api.fetchSettingsBundle.mockResolvedValue(bundle);
  api.fetchSlaveConfiguration.mockResolvedValue({ slave_mode: true });
  api.fetchTeleBotSetting.mockResolvedValue(null);
  api.saveMarkingOptionsBatch.mockResolvedValue({});
  api.saveTeleBotSetting.mockResolvedValue({ bot_setting_id: 1 });
});

describe('useMarkingSettings', () => {
  it('rejects an invalid batch template without calling the API', async () => {
    const { result } = renderHook(() => useMarkingSettings(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.save({ ...bundle, batch_template: '{unknown}' }));

    expect(toast.error).toHaveBeenCalledWith(
      'Указано некорректное поле в формате шаблона: {unknown}',
    );
    expect(api.saveMarkingOptionsBatch).not.toHaveBeenCalled();
  });

  it('skips slave-hidden fields and shows the success text', async () => {
    const { result } = renderHook(() => useMarkingSettings(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSlaveMode).toBe(true));

    act(() => result.current.save(bundle));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(PARAMETERS_MESSAGES.marking.saved));
    const entries = api.saveMarkingOptionsBatch.mock.calls[0][0] as { name: string }[];
    expect(entries.map((entry) => entry.name)).not.toContain('export_data_path');
  });
});

describe('useStatisticsSettings', () => {
  it('sends exactly two entries', async () => {
    const { result } = renderHook(() => useStatisticsSettings(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.values).toBeDefined());

    act(() => result.current.save(result.current.values!));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(PARAMETERS_MESSAGES.statistics.saved));
    expect(api.saveMarkingOptionsBatch.mock.calls[0][0]).toEqual([
      { name: 'disable_statistics', value: true },
      { name: 'disable_statistics_export', value: false },
    ]);
  });
});

describe('useCodeCleanupSettings', () => {
  it('saves clamped entries and shows the success text', async () => {
    const { result } = renderHook(() => useCodeCleanupSettings(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.settings).toBeDefined());

    act(() =>
      result.current.save({ enabled: true, days: 99999, start_time: '04:00', interval_hours: 12 }),
    );

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(PARAMETERS_MESSAGES.codeCleanup.saved),
    );
    expect(api.saveMarkingOptionsBatch.mock.calls[0][0]).toEqual([
      { name: 'code_cleanup_enabled', value: 'true' },
      { name: 'code_cleanup_days', value: 3650 },
      { name: 'code_cleanup_start_time', value: '04:00' },
      { name: 'code_cleanup_interval_hours', value: 12 },
    ]);
  });

  it('shows the entity error text when saving fails without a message', async () => {
    api.saveMarkingOptionsBatch.mockRejectedValue(new Error(''));
    const { result } = renderHook(() => useCodeCleanupSettings(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.save(result.current.settings!));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(PARAMETERS_MESSAGES.codeCleanup.saveFailed),
    );
  });
});

describe('useTelegramSettings', () => {
  it('shows the entity error text when saving fails without a message', async () => {
    api.saveTeleBotSetting.mockRejectedValue(new Error(''));
    const { result } = renderHook(() => useTelegramSettings(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.save({ api_token: 'token', is_activ: true }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(PARAMETERS_MESSAGES.telegram.saveFailed),
    );
  });
});
