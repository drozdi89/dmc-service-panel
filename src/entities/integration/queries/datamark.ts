import { createIdempotencyKey } from '@/shared/api';
import { useInvalidatingMutation, type EntityMutationOptions } from '@/shared/queries';
import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  createDataMarkCredentials,
  deleteDataMarkCredentials,
  fetchDataMarkCredentials,
  saveDataMarkCredentials,
} from '../api/api';
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

/** Variables for {@link useSaveDataMarkCredentialsMutation}. */
export interface SaveDataMarkCredentialsVariables {
  currentUnp?: string | null;
  credentials: DataMarkCredentials;
}

/** Creates or updates DataMark credentials. */
export function useSaveDataMarkCredentialsMutation(
  options?: EntityMutationOptions<unknown, SaveDataMarkCredentialsVariables>,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [DATAMARK_QUERY_KEY],
    mutationFn: ({ currentUnp, credentials }: SaveDataMarkCredentialsVariables) => {
      const key = createIdempotencyKey();
      return currentUnp
        ? saveDataMarkCredentials(currentUnp, credentials, key)
        : createDataMarkCredentials(credentials, key);
    },
  });
}

/** Deletes DataMark credentials by UNP. */
export function useDeleteDataMarkCredentialsMutation(
  options?: EntityMutationOptions<string, string>,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [DATAMARK_QUERY_KEY],
    mutationFn: (unp: string) => deleteDataMarkCredentials([unp], createIdempotencyKey()),
  });
}
