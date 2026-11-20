import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import { fetchAllLines, fetchLineOptions } from '../api/api';
import type { LineOptions, LineTaskTypeRow } from '../model/types';
import { LINE_TASK_TYPES_QUERY_KEY, lineOptionsQueryKey } from './keys';

/**
 * Loads production lines with runtime options for task-type configuration.
 *
 * Missing options rows are treated as defaults (`reserve_disabled: false`, `hasOptions: false`).
 */
export async function fetchLineTaskTypeRows(): Promise<LineTaskTypeRow[]> {
  const lines = await fetchAllLines();
  const optionsList = await Promise.all(
    lines.map(async (line) => {
      try {
        const options = await fetchLineOptions(line.lineid);
        return { options, hasOptions: true as const };
      } catch {
        return {
          options: { lineid: line.lineid, reserve_disabled: false },
          hasOptions: false as const,
        };
      }
    }),
  );
  return lines.map((line, index) => {
    const entry = optionsList[index];
    return {
      lineid: line.lineid,
      linename: line.linename,
      reserve_disabled: entry?.options.reserve_disabled ?? false,
      hasOptions: entry?.hasOptions ?? false,
    };
  });
}

/** Query options for composite line task-type rows. */
export function lineTaskTypesQueryOptions(): {
  queryKey: typeof LINE_TASK_TYPES_QUERY_KEY;
  queryFn: typeof fetchLineTaskTypeRows;
} {
  return {
    queryKey: LINE_TASK_TYPES_QUERY_KEY,
    queryFn: fetchLineTaskTypeRows,
  };
}

/** Options for {@link useLineTaskTypesQuery} (minus fixed key/fn). */
export type LineTaskTypesQueryOptions = Omit<
  UseQueryOptions<LineTaskTypeRow[], Error, LineTaskTypeRow[], typeof LINE_TASK_TYPES_QUERY_KEY>,
  'queryKey' | 'queryFn'
>;

/**
 * Loads lines + options for task-type drawer.
 *
 * @param options - TanStack options (`enabled`, `select`, …).
 */
export function useLineTaskTypesQuery(
  options?: LineTaskTypesQueryOptions,
): UseQueryResult<LineTaskTypeRow[], Error> {
  return useQuery({
    ...lineTaskTypesQueryOptions(),
    ...options,
  });
}

/** Query options for a single line's runtime options. */
export function lineOptionsQueryOptions(lineid: number): {
  queryKey: ReturnType<typeof lineOptionsQueryKey>;
  queryFn: (context: { signal: AbortSignal }) => Promise<LineOptions>;
} {
  return {
    queryKey: lineOptionsQueryKey(lineid),
    queryFn: () => fetchLineOptions(lineid),
  };
}

/** Options for {@link useLineOptionsQuery} (minus fixed key/fn). */
export type LineOptionsQueryOptions = Omit<
  UseQueryOptions<LineOptions, Error, LineOptions, ReturnType<typeof lineOptionsQueryKey>>,
  'queryKey' | 'queryFn'
>;

/**
 * Loads line runtime options by line id.
 *
 * @param lineid - Production line id.
 * @param options - TanStack options (`enabled`, `select`, …).
 */
export function useLineOptionsQuery(
  lineid: number,
  options?: LineOptionsQueryOptions,
): UseQueryResult<LineOptions, Error> {
  return useQuery({
    ...lineOptionsQueryOptions(lineid),
    ...options,
  });
}
