import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import { fetchOneCExchangeSettings } from '../api/api';
import type { OneCExchangeSettings } from '../model/types';
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
