import { createIdempotencyKey } from '@/shared/api';
import {
  factoryQuery,
  useInvalidatingMutation,
  type EntityMutationOptions,
} from '@/shared/queries';
import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import type { ListQueryParams } from '@/shared/types/listQuery';
import {
  createCrptOrganization,
  deleteCrptOrganizations,
  fetchCrptOrganization,
  fetchCrptOrganizations,
  fetchServerActivation,
  saveOrgCrptTemplateIdx,
  updateCrptOrganization,
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

export interface SaveCrptOrganizationVariables {
  mode: 'create' | 'edit';
  organization: CrptOrganization;
}

export interface SaveCrptOrganizationResult {
  templateError: Error | null;
}

export function useSaveCrptOrganizationMutation(
  options?: EntityMutationOptions<SaveCrptOrganizationResult, SaveCrptOrganizationVariables>,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [CRPT_ORGS_QUERY_KEY],
    mutationFn: async ({ mode, organization }: SaveCrptOrganizationVariables) => {
      const { crpt_template_idx: templateIdx, ...body } = organization;
      const key = createIdempotencyKey();
      if (mode === 'edit') {
        const { inn, ...updateBody } = body;
        await updateCrptOrganization(inn, updateBody, key);
      } else {
        await createCrptOrganization(body, key);
      }
      try {
        await saveOrgCrptTemplateIdx(body.inn, templateIdx ?? 0);
        return { templateError: null };
      } catch (error) {
        return { templateError: error instanceof Error ? error : new Error(String(error)) };
      }
    },
  });
}

export function useDeleteCrptOrganizationMutation(
  options?: EntityMutationOptions<string, string>,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [CRPT_ORGS_QUERY_KEY],
    mutationFn: (inn: string) => deleteCrptOrganizations([inn], createIdempotencyKey()),
  });
}
