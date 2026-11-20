import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { PaginatedResponse } from '../types/listQuery';
import { useServerListQuery } from './useServerListQuery';

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useServerListQuery', () => {
  it('fetches paginated data with params in the query key', async () => {
    const response: PaginatedResponse<{ id: number }> = {
      page: 1,
      next_page: 1,
      previous_page: 1,
      size: 50,
      total_records: 1,
      response: [{ id: 1 }],
    };
    const fetchFn = vi.fn().mockResolvedValue(response);
    const params = { size: 50, number: 1, q: 'cam' };

    const { result } = renderHook(
      () =>
        useServerListQuery({
          queryKey: ['devices'],
          fetchFn,
          params,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchFn).toHaveBeenCalledWith(params);
    expect(result.current.data).toEqual(response);
  });

  it('does not fetch when enabled is false', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      page: 1,
      next_page: 1,
      previous_page: 1,
      size: 50,
      total_records: 0,
      response: [],
    });

    const { result } = renderHook(
      () =>
        useServerListQuery({
          queryKey: ['devices'],
          fetchFn,
          params: { size: 50, number: 1 },
          enabled: false,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
