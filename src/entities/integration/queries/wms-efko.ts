import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import { fetchWmsEfkoSettings } from '../api/api';
import type { WmsEfkoSettings } from '../model/types';
import { WMS_EFKO_QUERY_KEY } from './keys';

/** Query options for WMS (Efko) exchange settings. */
export function wmsEfkoQueryOptions(): {
  queryKey: typeof WMS_EFKO_QUERY_KEY;
  queryFn: typeof fetchWmsEfkoSettings;
} {
  return {
    queryKey: WMS_EFKO_QUERY_KEY,
    queryFn: fetchWmsEfkoSettings,
  };
}

/** Options for {@link useWmsEfkoSettingsQuery} (minus fixed key/fn). */
export type WmsEfkoSettingsQueryOptions = Omit<
  UseQueryOptions<
    WmsEfkoSettings,
    Error,
    WmsEfkoSettings,
    typeof WMS_EFKO_QUERY_KEY
  >,
  'queryKey' | 'queryFn'
>;

/**
 * Loads singleton WMS (Efko) exchange settings.
 *
 * @param options - TanStack options (`enabled`, `select`, …).
 */
export function useWmsEfkoSettingsQuery(
  options?: WmsEfkoSettingsQueryOptions,
): UseQueryResult<WmsEfkoSettings, Error> {
  return useQuery({
    ...wmsEfkoQueryOptions(),
    ...options,
  });
}
