import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import { fetchMarkingOptionValue } from '../api/api';
import {
  MARKING_OPTION_DMC_COMP_SIZE,
  parseMarkingOptionInt,
} from '../lib/markingOptionValue';
import type { MarkingOptionValue } from '../model/types';
import { markingOptionValueQueryKey } from './keys';

type QueryOpts<TData, TKey extends readonly unknown[]> = Omit<
  UseQueryOptions<TData, Error, TData, TKey>,
  'queryKey' | 'queryFn'
>;

/**
 * Query options for a single marking option value.
 *
 * @param optionsName - Marking option key.
 */
export function markingOptionValueQueryOptions(optionsName: string): {
  queryKey: ReturnType<typeof markingOptionValueQueryKey>;
  queryFn: ({ signal }: { signal: AbortSignal }) => Promise<MarkingOptionValue>;
} {
  return {
    queryKey: markingOptionValueQueryKey(optionsName),
    queryFn: ({ signal }) => fetchMarkingOptionValue(optionsName, signal),
  };
}

/** Options for {@link useMarkingOptionValueQuery}. */
export type MarkingOptionValueQueryOptions = QueryOpts<
  MarkingOptionValue,
  ReturnType<typeof markingOptionValueQueryKey>
>;

/**
 * Loads a single marking option value by key.
 *
 * @param optionsName - Marking option key (e.g. `dmc_comp_size`).
 * @param options - TanStack options (`enabled`, `select`, …).
 */
export function useMarkingOptionValueQuery(
  optionsName: string,
  options?: MarkingOptionValueQueryOptions,
): UseQueryResult<MarkingOptionValue, Error> {
  return useQuery({
    ...markingOptionValueQueryOptions(optionsName),
    ...options,
  });
}

/** Options for {@link useDmcCompSizeQuery}. */
export type DmcCompSizeQueryOptions = Omit<
  UseQueryOptions<number, Error, number, ReturnType<typeof markingOptionValueQueryKey>>,
  'queryKey' | 'queryFn' | 'select'
>;

/**
 * Loads licensed CRPT organization count from `dmc_comp_size` marking option.
 *
 * @param options - TanStack options (`enabled`, …); result is parsed integer (default 1).
 */
export function useDmcCompSizeQuery(
  options?: DmcCompSizeQueryOptions,
): UseQueryResult<number, Error> {
  return useQuery({
    ...markingOptionValueQueryOptions(MARKING_OPTION_DMC_COMP_SIZE),
    select: (data) => parseMarkingOptionInt(data.options_value) ?? 1,
    ...options,
  });
}
