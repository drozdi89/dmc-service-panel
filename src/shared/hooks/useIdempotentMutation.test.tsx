import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useIdempotentMutation } from './useIdempotentMutation';

const apiRequestDataMock = vi.fn();

vi.mock('../api', async () => {
  const actual = await vi.importActual<typeof import('../api')>('../api');
  return {
    ...actual,
    apiRequestData: (...args: unknown[]) => apiRequestDataMock(...args),
  };
});

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useIdempotentMutation', () => {
  beforeEach(() => {
    apiRequestDataMock.mockReset();
    apiRequestDataMock.mockResolvedValue({ ok: true });
  });

  it('calls apiRequestData with POST and generated idempotency key by default', async () => {
    const { result } = renderHook(() => useIdempotentMutation<{ ok: boolean }>(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ path: '/api/v2/items', body: { name: 'a' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiRequestDataMock).toHaveBeenCalledTimes(1);
    const [path, options] = apiRequestDataMock.mock.calls[0] as [
      string,
      { method: string; body: unknown; idempotencyKey: string },
    ];
    expect(path).toBe('/api/v2/items');
    expect(options.method).toBe('POST');
    expect(options.body).toEqual({ name: 'a' });
    expect(options.idempotencyKey).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('reuses caller-provided idempotency key and method', async () => {
    const { result } = renderHook(() => useIdempotentMutation(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      path: '/api/v2/items/1',
      method: 'PATCH',
      body: { name: 'b' },
      idempotencyKey: 'fixed-key-123',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiRequestDataMock).toHaveBeenCalledWith('/api/v2/items/1', {
      method: 'PATCH',
      body: { name: 'b' },
      params: undefined,
      idempotencyKey: 'fixed-key-123',
    });
  });
});
