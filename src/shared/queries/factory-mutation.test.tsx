import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FACTORY_QUERY_SCOPES } from './options';
import {
  factoryMutation,
  invalidateFactoryListAndLookup,
} from './factory-mutation';

interface TemplateItem {
  id: number;
  name: string;
  template: string;
}

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('invalidateFactoryListAndLookup', () => {
  it('invalidates list and lookup prefixes only', async () => {
    const client = new QueryClient();
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');
    const keys = {
      all: () => ['print-templates'] as const,
      list: (params?: unknown) =>
        params
          ? (['print-templates', FACTORY_QUERY_SCOPES.list, params] as const)
          : (['print-templates', FACTORY_QUERY_SCOPES.list] as const),
      lookup: (params?: unknown) =>
        params
          ? (['print-templates', FACTORY_QUERY_SCOPES.lookup, params] as const)
          : (['print-templates', FACTORY_QUERY_SCOPES.lookup] as const),
      detail: (id: number) =>
        ['print-templates', FACTORY_QUERY_SCOPES.detail, id] as const,
    };

    await invalidateFactoryListAndLookup(client, keys);

    expect(invalidateSpy).toHaveBeenCalledTimes(2);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['print-templates', FACTORY_QUERY_SCOPES.list],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['print-templates', FACTORY_QUERY_SCOPES.lookup],
    });
    expect(invalidateSpy).not.toHaveBeenCalledWith({
      queryKey: ['print-templates'],
    });
  });
});

describe('factoryMutation', () => {
  it('useUpdateMutation sets detail cache and does not invalidate keys.all()', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');

    const saved: TemplateItem = { id: 12, name: 'Label', template: 'ZPL' };
    const api = factoryMutation<TemplateItem>({
      entry: ['print-templates'],
      fetchUpdate: vi.fn().mockResolvedValue(saved),
    });

    const { result } = renderHook(() => api.useUpdateMutation(), {
      wrapper: createWrapper(client),
    });

    await result.current.mutateAsync({
      id: 12,
      name: 'Label',
      template: 'ZPL',
    });

    await waitFor(() => {
      expect(client.getQueryData(api.keys.detail(12))).toEqual(saved);
    });

    const allKeyInvalidations = invalidateSpy.mock.calls.filter(
      ([arg]) =>
        Array.isArray(arg?.queryKey) &&
        arg.queryKey.length === 1 &&
        arg.queryKey[0] === 'print-templates',
    );
    expect(allKeyInvalidations).toHaveLength(0);

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['print-templates', FACTORY_QUERY_SCOPES.list],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['print-templates', FACTORY_QUERY_SCOPES.lookup],
    });
  });
});