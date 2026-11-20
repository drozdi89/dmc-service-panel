import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { ListQueryParams, PaginatedResponse } from '../types/listQuery';

/** Fetch function signature for server-side lists. */
export type ListFetchFn<T> = (
  params: ListQueryParams,
) => Promise<PaginatedResponse<T>>;

/** Options for {@link useServerListQuery}. */
export interface UseServerListQueryOptions<T> {
  queryKey: readonly unknown[];
  fetchFn: ListFetchFn<T>;
  params: ListQueryParams;
  enabled?: boolean;
}

/**
 * TanStack Query hook for paginated server-side lists (List Query Contract).
 *
 * @param options - Query key, fetch function and list parameters.
 * @returns Query result with paginated data.
 */
export function useServerListQuery<T>(
  options: UseServerListQueryOptions<T>,
): UseQueryResult<PaginatedResponse<T>, Error> {
  const { queryKey, fetchFn, params, enabled = true } = options;

  return useQuery<PaginatedResponse<T>, Error>({
    queryKey: [...queryKey, params],
    queryFn: () => fetchFn(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}
