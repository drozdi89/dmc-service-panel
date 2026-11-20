import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import { factoryQuery } from '@/shared/queries';
import type { ListQueryParams } from '@/shared/types/listQuery';
import {
  fetchCrptOrganization,
  fetchCrptOrganizations,
  fetchServerActivation,
} from '../api/api';
import type { CrptOrganization, ServerActivationInfo } from '../model/types';
import { CRPT_ORGS_QUERY_KEY, SERVER_ACTIVATION_QUERY_KEY } from './keys';

/**
 * List / lookup / detail queries for CRPT organizations.
 *
 * Keys: `['integrations', 'crpt-organizations', 'list'|'lookup'|'detail', …]`.
 * Pass {@link crptOrganizationsQueries.keys.all} as `queryKey` to AsyncLookupSelect
 * (factory appends `'lookup'` + params).
 */
export const crptOrganizationsQueries = factoryQuery<
  CrptOrganization,
  ListQueryParams,
  string
>({
  entry: CRPT_ORGS_QUERY_KEY,
  fetchList: fetchCrptOrganizations,
  fetchLookup: fetchCrptOrganizations,
  fetchDetail: fetchCrptOrganization,
});

/** @see crptOrganizationsQueries.useListQuery */
export const useCrptOrganizationsListQuery = crptOrganizationsQueries.useListQuery;

/** Query options for server activation info. */
export function serverActivationQueryOptions(): {
  queryKey: typeof SERVER_ACTIVATION_QUERY_KEY;
  queryFn: typeof fetchServerActivation;
} {
  return {
    queryKey: SERVER_ACTIVATION_QUERY_KEY,
    queryFn: fetchServerActivation,
  };
}

/** Options for {@link useServerActivationQuery} (minus fixed key/fn). */
export type ServerActivationQueryOptions = Omit<
  UseQueryOptions<ServerActivationInfo, Error, ServerActivationInfo, typeof SERVER_ACTIVATION_QUERY_KEY>,
  'queryKey' | 'queryFn'
>;

/**
 * Loads server activation info (allowed CRPT organization count).
 *
 * @param options - TanStack options (`enabled`, `select`, …).
 */
export function useServerActivationQuery(
  options?: ServerActivationQueryOptions,
): UseQueryResult<ServerActivationInfo, Error> {
  return useQuery({
    ...serverActivationQueryOptions(),
    ...options,
  });
}
