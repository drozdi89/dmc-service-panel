import { createIdempotencyKey } from '@/shared/api';
import { useInvalidatingMutation, type EntityMutationOptions } from '@/shared/queries';
import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import { fetchAutosendSettings, saveAutosendSettings } from '../api/api';
import type { AutosendSettingsPayload } from '../model/types';
import { AUTOSEND_QUERY_KEY } from './keys';

/** Query options for autosend configuration. */
export function autosendQueryOptions(): {
  queryKey: typeof AUTOSEND_QUERY_KEY;
  queryFn: typeof fetchAutosendSettings;
} {
  return {
    queryKey: AUTOSEND_QUERY_KEY,
    queryFn: fetchAutosendSettings,
  };
}

/** Options for {@link useAutosendSettingsQuery} (minus fixed key/fn). */
export type AutosendSettingsQueryOptions = Omit<
  UseQueryOptions<
    AutosendSettingsPayload,
    Error,
    AutosendSettingsPayload,
    typeof AUTOSEND_QUERY_KEY
  >,
  'queryKey' | 'queryFn'
>;

/**
 * Loads composite autosend configuration.
 *
 * @param options - TanStack options (`enabled`, `select`, …).
 */
export function useAutosendSettingsQuery(
  options?: AutosendSettingsQueryOptions,
): UseQueryResult<AutosendSettingsPayload, Error> {
  return useQuery({
    ...autosendQueryOptions(),
    ...options,
  });
}

export function useSaveAutosendSettingsMutation(
  options?: EntityMutationOptions<
    Awaited<ReturnType<typeof saveAutosendSettings>>,
    AutosendSettingsPayload
  >,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [AUTOSEND_QUERY_KEY],
    mutationFn: (payload: AutosendSettingsPayload) =>
      saveAutosendSettings(payload, createIdempotencyKey()),
  });
}
