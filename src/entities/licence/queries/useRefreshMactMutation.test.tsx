import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  refreshMactLicences: vi.fn(),
  refreshMactSubscription: vi.fn(),
  fetchMactPersonalAccount: vi.fn(),
}));

vi.mock('../api/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/api')>()),
  ...api,
}));

import {
  MACT_LICENCES_QUERY_KEY,
  MACT_PERSONAL_ACCOUNT_QUERY_KEY,
  MACT_SUBSCRIPTION_QUERY_KEY,
} from './keys';
import {
  DEFAULT_MACT_LICENCES_PAGE_SIZE,
  useMactLicencesQuery,
  useRefreshMactMutation,
} from './licence-queries';

const licences = { used: [], available: [{ pin: 'PIN-1', valid_until: '2027-01-01' }] };
const subscription = { text: 'sub' };
const account = { url: 'https://mact.example' };

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

beforeEach(() => {
  vi.clearAllMocks();
  api.refreshMactLicences.mockResolvedValue(licences);
  api.refreshMactSubscription.mockResolvedValue(subscription);
  api.fetchMactPersonalAccount.mockResolvedValue(account);
});

describe('MACT queries', () => {
  it('useMactLicencesQuery loads the snapshot on mount', async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useMactLicencesQuery(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual(licences));
    expect(api.refreshMactLicences).toHaveBeenCalledWith(DEFAULT_MACT_LICENCES_PAGE_SIZE);
  });
});

describe('useRefreshMactMutation', () => {
  it('puts the three results into the MACT query cache', async () => {
    const { client, wrapper } = setup();
    const { result } = renderHook(() => useRefreshMactMutation(), { wrapper });

    await act(() => result.current.mutateAsync());

    expect(
      client.getQueryData([...MACT_LICENCES_QUERY_KEY, DEFAULT_MACT_LICENCES_PAGE_SIZE]),
    ).toEqual(licences);
    expect(client.getQueryData(MACT_SUBSCRIPTION_QUERY_KEY)).toEqual(subscription);
    expect(client.getQueryData(MACT_PERSONAL_ACCOUNT_QUERY_KEY)).toEqual(account);
  });

  it('rejects when a request fails', async () => {
    api.refreshMactSubscription.mockRejectedValue(new Error('MACT down'));
    const { wrapper } = setup();
    const { result } = renderHook(() => useRefreshMactMutation(), { wrapper });

    await expect(act(() => result.current.mutateAsync())).rejects.toThrow('MACT down');
  });
});
