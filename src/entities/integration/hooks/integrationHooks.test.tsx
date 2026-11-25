import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { INTEGRATION_MESSAGES } from '../model/messages';
import type {
  CrptOrganization,
  OneCExchangeSettings,
  WmsEfkoSettingsPayload,
} from '../model/types';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn() }));

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    App: Object.assign(actual.App, { useApp: () => ({ message: toast }) }),
  };
});

const api = vi.hoisted(() => ({
  saveWmsEfkoSettings: vi.fn(),
  testWmsEfkoConnection: vi.fn(),
  saveOneCExchangeSettings: vi.fn(),
  fetchOneCExchangeServers: vi.fn(),
  createCrptOrganization: vi.fn(),
  updateCrptOrganization: vi.fn(),
  saveOrgCrptTemplateIdx: vi.fn(),
  fetchCrptOrganization: vi.fn(),
}));

vi.mock('../api/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/api')>()),
  ...api,
}));

import { useCrptOrganizationsActions } from './useCrptOrganizationsActions';
import { useOneCExchangeSettingsActions } from './useOneCExchangeSettingsActions';
import { useWmsEfkoSettingsActions } from './useWmsEfkoSettingsActions';

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
  api.saveWmsEfkoSettings.mockResolvedValue({});
  api.testWmsEfkoConnection.mockResolvedValue({ ok: true });
  api.saveOneCExchangeSettings.mockResolvedValue({});
  api.fetchOneCExchangeServers.mockResolvedValue({ servers: [] });
  api.createCrptOrganization.mockResolvedValue({});
  api.saveOrgCrptTemplateIdx.mockResolvedValue({});
});

describe('useWmsEfkoSettingsActions', () => {
  it('shows the validation error without calling the API', () => {
    const { result } = renderHook(() => useWmsEfkoSettingsActions(), {
      wrapper: createWrapper(),
    });

    act(() =>
      result.current.save({ enabled: true, mssql_host: '' } as WmsEfkoSettingsPayload),
    );

    expect(toast.error).toHaveBeenCalledWith('Укажите хост MS SQL WMS.');
    expect(api.saveWmsEfkoSettings).not.toHaveBeenCalled();
  });

  it('saves and calls onDone with the success toast', async () => {
    const onDone = vi.fn();
    const { result } = renderHook(() => useWmsEfkoSettingsActions({ onDone }), {
      wrapper: createWrapper(),
    });

    act(() => result.current.save({ enabled: false } as WmsEfkoSettingsPayload));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith(INTEGRATION_MESSAGES.wmsEfko.saved);
  });
});

describe('useOneCExchangeSettingsActions', () => {
  it('warns when 1C returns no servers', async () => {
    const loaded = {
      enabled: false,
      base_url: 'https://1c',
      username: 'user',
      password: 'stored',
      srv_id: null,
    } as OneCExchangeSettings;
    const onLoaded = vi.fn();
    const { result } = renderHook(() => useOneCExchangeSettingsActions(), {
      wrapper: createWrapper(),
    });

    act(() =>
      result.current.refreshServers(loaded, { loaded, passwordConfigured: true }, onLoaded),
    );

    await waitFor(() => expect(onLoaded).toHaveBeenCalledWith([], null));
    expect(toast.warning).toHaveBeenCalledWith(INTEGRATION_MESSAGES.oneCExchange.serversEmpty);
  });

  it('reports missing loaded settings', () => {
    const { result } = renderHook(() => useOneCExchangeSettingsActions(), {
      wrapper: createWrapper(),
    });

    act(() =>
      result.current.save({} as OneCExchangeSettings, {
        loaded: undefined,
        passwordConfigured: false,
      }),
    );

    expect(toast.error).toHaveBeenCalledWith(INTEGRATION_MESSAGES.settingsNotLoaded);
  });
});

describe('useCrptOrganizationsActions', () => {
  const organization = {
    inn: ' 7700000000 ',
    name: ' Org ',
    kpp: '',
    thumbprint: 'tp',
    is_demo: false,
    oms_id: 'oms',
    oms_connection: 'conn',
    load_wares: false,
    auto_bill: false,
    bill_sum: 0,
    bill_min: 0,
    bill_email: '',
    mods_list: '',
    crpt_template_idx: 1,
  } as CrptOrganization;

  it('creates a trimmed organization and calls onSaved', async () => {
    const onSaved = vi.fn();
    const { result } = renderHook(() => useCrptOrganizationsActions({ onSaved }), {
      wrapper: createWrapper(),
    });

    act(() => result.current.save('create', organization));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(api.createCrptOrganization.mock.calls[0]?.[0]).toMatchObject({
      inn: '7700000000',
      name: 'Org',
      kpp: null,
      bill_email: null,
    });
    expect(toast.success).toHaveBeenCalledWith(INTEGRATION_MESSAGES.crptOrganizations.created);
  });

  it('keeps the modal open when the CRPT template save fails', async () => {
    api.saveOrgCrptTemplateIdx.mockRejectedValue(new Error('boom'));
    const onSaved = vi.fn();
    const { result } = renderHook(() => useCrptOrganizationsActions({ onSaved }), {
      wrapper: createWrapper(),
    });

    act(() => result.current.save('create', organization));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        INTEGRATION_MESSAGES.crptOrganizations.templateNotCreatedRetry,
      ),
    );
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('does not toast when the detail load is aborted', async () => {
    api.fetchCrptOrganization.mockRejectedValue(new Error('aborted'));
    const controller = new AbortController();
    controller.abort();
    const { result } = renderHook(() => useCrptOrganizationsActions(), {
      wrapper: createWrapper(),
    });

    await expect(result.current.loadForEdit('1', controller.signal)).resolves.toBeNull();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
