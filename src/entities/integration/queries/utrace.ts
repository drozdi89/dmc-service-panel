import { createIdempotencyKey } from '@/shared/api';
import { useInvalidatingMutation, type EntityMutationOptions } from '@/shared/queries';
import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  createUtraceSettings,
  deleteUtraceSettings,
  fetchUtraceSettings,
  saveUtraceSettings,
} from '../api/api';
import type { UtraceSettings } from '../model/types';
import { UTRACE_QUERY_KEY } from './keys';

/** Query options for Utrace settings. */
export function utraceQueryOptions(): {
  queryKey: typeof UTRACE_QUERY_KEY;
  queryFn: typeof fetchUtraceSettings;
} {
  return {
    queryKey: UTRACE_QUERY_KEY,
    queryFn: fetchUtraceSettings,
  };
}

/** Options for {@link useUtraceSettingsQuery} (minus fixed key/fn). */
export type UtraceSettingsQueryOptions = Omit<
  UseQueryOptions<
    Partial<UtraceSettings>,
    Error,
    Partial<UtraceSettings>,
    typeof UTRACE_QUERY_KEY
  >,
  'queryKey' | 'queryFn'
>;

/**
 * Loads latest Utrace settings (or empty partial).
 *
 * @param options - TanStack options (`enabled`, `select`, …).
 */
export function useUtraceSettingsQuery(
  options?: UtraceSettingsQueryOptions,
): UseQueryResult<Partial<UtraceSettings>, Error> {
  return useQuery({
    ...utraceQueryOptions(),
    ...options,
  });
}

export interface SaveUtraceSettingsVariables {
  currentInn?: string | null;
  settings: UtraceSettings;
}

export function useSaveUtraceSettingsMutation(
  options?: EntityMutationOptions<unknown, SaveUtraceSettingsVariables>,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [UTRACE_QUERY_KEY],
    mutationFn: ({ currentInn, settings }: SaveUtraceSettingsVariables) => {
      const key = createIdempotencyKey();
      return currentInn
        ? saveUtraceSettings(currentInn, settings, key)
        : createUtraceSettings(settings, key);
    },
  });
}

export function useDeleteUtraceSettingsMutation(
  options?: EntityMutationOptions<{ deleted: number }, void>,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [UTRACE_QUERY_KEY],
    mutationFn: () => deleteUtraceSettings(createIdempotencyKey()),
  });
}
