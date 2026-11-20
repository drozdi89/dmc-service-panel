import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import { fetchAllLines, fetchWmsEfkoSettings } from '../api/api';
import type { LineListItem, WmsEfkoSettings } from '../model/types';
import { WMS_EFKO_LINES_QUERY_KEY, WMS_EFKO_QUERY_KEY } from './keys';

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

/** Options for {@link useAllLinesQuery} (minus fixed key/fn). */
export type AllLinesQueryOptions = Omit<
  UseQueryOptions<LineListItem[], Error, LineListItem[], typeof WMS_EFKO_LINES_QUERY_KEY>,
  'queryKey' | 'queryFn'
>;

/**
 * Loads all production lines (every page) for the WMS line filter.
 *
 * @param options - TanStack options (`enabled`, `select`, …).
 */
export function useAllLinesQuery(
  options?: AllLinesQueryOptions,
): UseQueryResult<LineListItem[], Error> {
  return useQuery({
    queryKey: WMS_EFKO_LINES_QUERY_KEY,
    queryFn: fetchAllLines,
    ...options,
  });
}
