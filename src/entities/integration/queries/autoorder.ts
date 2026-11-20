import { createIdempotencyKey } from '@/shared/api';
import { useInvalidatingMutation, type EntityMutationOptions } from '@/shared/queries';
import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import { fetchAutoorderOptions, saveAutoorderOptions } from '../api/api';
import type { AutoorderOptions } from '../model/types';
import { AUTOORDER_QUERY_KEY } from './keys';

/** Query options for autoorder configuration. */
export function autoorderQueryOptions(): {
  queryKey: typeof AUTOORDER_QUERY_KEY;
  queryFn: typeof fetchAutoorderOptions;
} {
  return {
    queryKey: AUTOORDER_QUERY_KEY,
    queryFn: fetchAutoorderOptions,
  };
}

/** Options for {@link useAutoorderOptionsQuery} (minus fixed key/fn). */
export type AutoorderOptionsQueryOptions = Omit<
  UseQueryOptions<AutoorderOptions, Error, AutoorderOptions, typeof AUTOORDER_QUERY_KEY>,
  'queryKey' | 'queryFn'
>;

/**
 * Loads autoorder configuration.
 *
 * @param options - TanStack options (`enabled`, `select`, …).
 */
export function useAutoorderOptionsQuery(
  options?: AutoorderOptionsQueryOptions,
): UseQueryResult<AutoorderOptions, Error> {
  return useQuery({
    ...autoorderQueryOptions(),
    ...options,
  });
}

export function useSaveAutoorderOptionsMutation(
  options?: EntityMutationOptions<{ updated_products: number }, AutoorderOptions>,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [AUTOORDER_QUERY_KEY],
    mutationFn: (payload: AutoorderOptions) =>
      saveAutoorderOptions(payload, createIdempotencyKey()),
  });
}
