import { createIdempotencyKey } from '@/shared/api';
import { useInvalidatingMutation, type EntityMutationOptions } from '@/shared/queries';
import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  fetchOneCExchangeServers,
  fetchOneCExchangeSettings,
  saveOneCExchangeSettings,
} from '../api/api';
import type {
  OneCExchangeServersResponse,
  OneCExchangeSettings,
  OneCExchangeSettingsPayload,
} from '../model/types';
import { ONE_C_EXCHANGE_QUERY_KEY } from './keys';

/** Query options for 1C exchange settings. */
export function oneCExchangeQueryOptions(): {
  queryKey: typeof ONE_C_EXCHANGE_QUERY_KEY;
  queryFn: typeof fetchOneCExchangeSettings;
} {
  return {
    queryKey: ONE_C_EXCHANGE_QUERY_KEY,
    queryFn: fetchOneCExchangeSettings,
  };
}

/** Options for {@link useOneCExchangeSettingsQuery} (minus fixed key/fn). */
export type OneCExchangeSettingsQueryOptions = Omit<
  UseQueryOptions<
    OneCExchangeSettings,
    Error,
    OneCExchangeSettings,
    typeof ONE_C_EXCHANGE_QUERY_KEY
  >,
  'queryKey' | 'queryFn'
>;

/**
 * Loads singleton 1C Alife exchange settings.
 *
 * @param options - TanStack options (`enabled`, `select`, …).
 */
export function useOneCExchangeSettingsQuery(
  options?: OneCExchangeSettingsQueryOptions,
): UseQueryResult<OneCExchangeSettings, Error> {
  return useQuery({
    ...oneCExchangeQueryOptions(),
    ...options,
  });
}

export function useSaveOneCExchangeSettingsMutation(
  options?: EntityMutationOptions<unknown, OneCExchangeSettingsPayload>,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [ONE_C_EXCHANGE_QUERY_KEY],
    mutationFn: (payload: OneCExchangeSettingsPayload) =>
      saveOneCExchangeSettings(payload, createIdempotencyKey()),
  });
}

export function useRefreshOneCExchangeServersMutation(
  options?: EntityMutationOptions<OneCExchangeServersResponse, OneCExchangeSettingsPayload>,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [ONE_C_EXCHANGE_QUERY_KEY],
    mutationFn: async (payload: OneCExchangeSettingsPayload) => {
      await saveOneCExchangeSettings(payload, createIdempotencyKey());
      return fetchOneCExchangeServers();
    },
  });
}
