import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  factoryQuery,
  type FactoryDetailQueryHookOptions,
  type FactoryQueryOptionsResult,
} from '@/shared/queries';
import type { ListQueryParams } from '@/shared/types/listQuery';
import {
  fetchLineAllowPrintedDm,
  fetchLineConfiguration,
  fetchLinePrintedDmRaw,
  fetchLinesList,
  fetchLinesLookup,
} from '../api/api';
import type { LineConfiguration, LineListItem } from '../model/types';

/**
 * Canonical TanStack Query entry for the line entity.
 * Scopes: `list` | `lookup` | `detail` (configuration) + settings suffixes.
 */
export const LINE_QUERY_ENTRY = ['lines'] as const;

/**
 * List / lookup helpers. Lookup uses {@link fetchLinesLookup} (list alias)
 * until a dedicated `/lines/lookup` exists — keys are stable for reuse.
 *
 * Detail type differs from list rows (`LineConfiguration` vs `LineListItem`),
 * so configuration is exposed via {@link useLineConfigurationQuery}, not
 * `lineQueries.useDetailQuery`.
 */
export const lineQueries = factoryQuery<LineListItem, ListQueryParams, number>({
  entry: LINE_QUERY_ENTRY,
  fetchList: fetchLinesList,
  fetchLookup: fetchLinesLookup,
});

/** Extra query-key builders for line settings / marking options (under `lines` entry). */
export const lineSettingsQueryKeys = {
  /**
   * Per-line allow-printed-DM flag.
   *
   * @param lineId - Line primary key.
   */
  allowPrintedDm: (lineId: number): readonly unknown[] => [
    ...LINE_QUERY_ENTRY,
    'allow-printed-dm',
    lineId,
  ],
  /** Raw `line_printed_dm_use` marking option JSON string. */
  printedDmRaw: (): readonly unknown[] => [...LINE_QUERY_ENTRY, 'printed-dm-raw'],
} as const;

/**
 * Query options for full line configuration (`GET /lines/get_line/{id}`).
 * Key: `[...LINE_QUERY_ENTRY, 'detail', lineId]` (same shape as factory detail).
 *
 * @param lineId - Line primary key.
 */
export function lineConfigurationQueryOptions(
  lineId: number,
): FactoryQueryOptionsResult<LineConfiguration> {
  return {
    queryKey: lineQueries.keys.detail(lineId),
    queryFn: ({ signal }) => fetchLineConfiguration(lineId, signal),
  };
}

/**
 * Loads full line configuration for the editor.
 *
 * @param lineId - Line primary key.
 * @param options - TanStack options (without fixed key/fn).
 */
export function useLineConfigurationQuery<TSelected = LineConfiguration>(
  lineId: number,
  options?: FactoryDetailQueryHookOptions<LineConfiguration, TSelected>,
): UseQueryResult<TSelected, Error> {
  const { queryKey, queryFn } = lineConfigurationQueryOptions(lineId);
  return useQuery<LineConfiguration, Error, TSelected, readonly unknown[]>({
    queryKey,
    queryFn,
    ...options,
  });
}

/**
 * Query options for per-line allow-printed-DM flag.
 *
 * @param lineId - Line primary key.
 */
export function lineAllowPrintedDmQueryOptions(
  lineId: number,
): FactoryQueryOptionsResult<boolean> {
  return {
    queryKey: lineSettingsQueryKeys.allowPrintedDm(lineId),
    queryFn: () => fetchLineAllowPrintedDm(lineId),
  };
}

/**
 * Loads per-line allow-printed-DM flag from marking_options.
 *
 * @param lineId - Line primary key.
 * @param options - TanStack options (without fixed key/fn).
 */
export function useLineAllowPrintedDmQuery(
  lineId: number,
  options?: Omit<
    UseQueryOptions<boolean, Error, boolean, readonly unknown[]>,
    'queryKey' | 'queryFn'
  >,
): UseQueryResult<boolean, Error> {
  const { queryKey, queryFn } = lineAllowPrintedDmQueryOptions(lineId);
  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
}

/**
 * Query options for raw `line_printed_dm_use` marking option value.
 */
export function linePrintedDmRawQueryOptions(): FactoryQueryOptionsResult<string | null> {
  return {
    queryKey: lineSettingsQueryKeys.printedDmRaw(),
    queryFn: () => fetchLinePrintedDmRaw(),
  };
}

/**
 * Loads raw line_printed_dm_use marking option value (shared map for all lines).
 *
 * @param options - TanStack options (without fixed key/fn).
 */
export function useLinePrintedDmRawQuery(
  options?: Omit<
    UseQueryOptions<string | null, Error, string | null, readonly unknown[]>,
    'queryKey' | 'queryFn'
  >,
): UseQueryResult<string | null, Error> {
  const { queryKey, queryFn } = linePrintedDmRawQueryOptions();
  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
}

/** @see lineQueries.useListQuery */
export const useLinesListQuery = lineQueries.useListQuery;

/** @see lineQueries.useLookupQuery — same fetcher as list; used by SelectLine. */
export const useLinesLookupQuery = lineQueries.useLookupQuery;
