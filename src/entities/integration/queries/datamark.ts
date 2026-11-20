import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import { fetchDataMarkCredentials } from '../api/api';
import type { DataMarkCredentials } from '../model/types';
import { DATAMARK_QUERY_KEY } from './keys';

/** Query options for DataMark credentials. */
export function datamarkQueryOptions(): {
  queryKey: typeof DATAMARK_QUERY_KEY;
  queryFn: typeof fetchDataMarkCredentials;
} {
  return {
    queryKey: DATAMARK_QUERY_KEY,
    queryFn: fetchDataMarkCredentials,
  };
}

/** Options for {@link useDataMarkCredentialsQuery} (minus fixed key/fn). */
export type DataMarkCredentialsQueryOptions = Omit<
  UseQueryOptions<
    Partial<DataMarkCredentials>,
    Error,
    Partial<DataMarkCredentials>,
    typeof DATAMARK_QUERY_KEY
  >,
  'queryKey' | 'queryFn'
>;

/**
 * Loads latest DataMark credentials (or empty partial).
 *
 * @param options - TanStack options (`enabled`, `select`, …).
 */
export function useDataMarkCredentialsQuery(
  options?: DataMarkCredentialsQueryOptions,
): UseQueryResult<Partial<DataMarkCredentials>, Error> {
  return useQuery({
    ...datamarkQueryOptions(),
    ...options,
  });
}
