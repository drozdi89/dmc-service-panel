import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import { factoryQuery, useInvalidatingMutation, type EntityMutationOptions } from '@/shared/queries';
import type { ListQueryParams } from '@/shared/types/listQuery';
import {
  deleteClients,
  fetchClientById,
  fetchClients,
  fetchClientsLookup,
  fetchMactPersonalAccount,
  fetchRegisteredClients,
  refreshMactLicences,
  refreshMactSubscription,
  registerClientLicense,
  unregisterClientLicense,
} from '../api/api';
import type {
  DmcClient,
  MactLicenceList,
  MactPersonalAccount,
  MactSubscription,
  RegisteredClient,
} from '../model/types';
import {
  CLIENTS_QUERY_ENTRY,
  MACT_LICENCES_QUERY_KEY,
  MACT_PERSONAL_ACCOUNT_QUERY_KEY,
  MACT_SUBSCRIPTION_QUERY_KEY,
  REGISTERED_CLIENTS_QUERY_KEY,
} from './keys';

/**
 * Canonical TanStack Query helpers for DMC clients.
 *
 * Keys (entry `['licences', 'clients']`):
 * - list: `['licences', 'clients', 'list', params?]`
 * - lookup: `['licences', 'clients', 'lookup', params?]`
 * - detail: `['licences', 'clients', 'detail', clientId]`
 *
 * Invalidate after mutations via `clientQueries.keys.all()` or `LICENCE_QUERY_ROOT`.
 */
export const clientQueries = factoryQuery<DmcClient, ListQueryParams, string>({
  entry: CLIENTS_QUERY_ENTRY,
  fetchList: fetchClients,
  fetchLookup: fetchClientsLookup,
  fetchDetail: fetchClientById,
});

/** @see clientQueries.useListQuery */
export const useClientsListQuery = clientQueries.useListQuery;

/** @see clientQueries.useLookupQuery */
export const useClientsLookupQuery = clientQueries.useLookupQuery;

/** @see clientQueries.useDetailQuery */
export const useClientDetailQuery = clientQueries.useDetailQuery;

/** Query options for registered clients list. */
export function registeredClientsQueryOptions(): {
  queryKey: typeof REGISTERED_CLIENTS_QUERY_KEY;
  queryFn: typeof fetchRegisteredClients;
} {
  return {
    queryKey: REGISTERED_CLIENTS_QUERY_KEY,
    queryFn: fetchRegisteredClients,
  };
}

/** Options for {@link useRegisteredClientsQuery} (minus fixed key/fn). */
export type RegisteredClientsQueryOptions = Omit<
  UseQueryOptions<
    RegisteredClient[],
    Error,
    RegisteredClient[],
    typeof REGISTERED_CLIENTS_QUERY_KEY
  >,
  'queryKey' | 'queryFn'
>;

/**
 * Loads registered clients with license metadata.
 *
 * @param options - TanStack options (`enabled`, `select`, …).
 */
export function useRegisteredClientsQuery(
  options?: RegisteredClientsQueryOptions,
): UseQueryResult<RegisteredClient[], Error> {
  return useQuery({
    ...registeredClientsQueryOptions(),
    ...options,
  });
}

/**
 * MACT proxy is an external service: no automatic retries or focus refetches,
 * they only slow the page down when the service is unavailable.
 */
const MACT_PROXY_QUERY_DEFAULTS = {
  retry: false,
  refetchOnWindowFocus: false,
} as const;

/** Default page size for MACT licences refresh (matches LicencesPage). */
export const DEFAULT_MACT_LICENCES_PAGE_SIZE = 50;

/**
 * Query options for MACT licences snapshot.
 *
 * @param pageSize - Proxy `page_size` (default {@link DEFAULT_MACT_LICENCES_PAGE_SIZE}).
 */
export function mactLicencesQueryOptions(
  pageSize: number = DEFAULT_MACT_LICENCES_PAGE_SIZE,
): {
  queryKey: readonly [...typeof MACT_LICENCES_QUERY_KEY, number];
  queryFn: () => Promise<MactLicenceList>;
  retry: false;
  refetchOnWindowFocus: false;
} {
  return {
    queryKey: [...MACT_LICENCES_QUERY_KEY, pageSize],
    queryFn: () => refreshMactLicences(pageSize),
    ...MACT_PROXY_QUERY_DEFAULTS,
  };
}

/** Options for {@link useMactLicencesQuery} (minus fixed key/fn). */
export type MactLicencesQueryOptions = Omit<
  UseQueryOptions<
    MactLicenceList,
    Error,
    MactLicenceList,
    readonly [...typeof MACT_LICENCES_QUERY_KEY, number]
  >,
  'queryKey' | 'queryFn'
>;

/**
 * Loads MACT licences (used / available) via licence proxy.
 *
 * @param pageSize - Proxy `page_size`.
 * @param options - TanStack options (`enabled`, `select`, …).
 */
export function useMactLicencesQuery(
  pageSize: number = DEFAULT_MACT_LICENCES_PAGE_SIZE,
  options?: MactLicencesQueryOptions,
): UseQueryResult<MactLicenceList, Error> {
  return useQuery({
    ...mactLicencesQueryOptions(pageSize),
    ...options,
  });
}

/** Query options for MACT subscription snapshot. */
export function mactSubscriptionQueryOptions(): {
  queryKey: typeof MACT_SUBSCRIPTION_QUERY_KEY;
  queryFn: typeof refreshMactSubscription;
  retry: false;
  refetchOnWindowFocus: false;
} {
  return {
    queryKey: MACT_SUBSCRIPTION_QUERY_KEY,
    queryFn: refreshMactSubscription,
    ...MACT_PROXY_QUERY_DEFAULTS,
  };
}

/** Options for {@link useMactSubscriptionQuery} (minus fixed key/fn). */
export type MactSubscriptionQueryOptions = Omit<
  UseQueryOptions<
    MactSubscription,
    Error,
    MactSubscription,
    typeof MACT_SUBSCRIPTION_QUERY_KEY
  >,
  'queryKey' | 'queryFn'
>;

/**
 * Loads MACT subscription info via licence proxy.
 *
 * @param options - TanStack options (`enabled`, `select`, …).
 */
export function useMactSubscriptionQuery(
  options?: MactSubscriptionQueryOptions,
): UseQueryResult<MactSubscription, Error> {
  return useQuery({
    ...mactSubscriptionQueryOptions(),
    ...options,
  });
}

/** Query options for MACT personal account URL. */
export function mactPersonalAccountQueryOptions(): {
  queryKey: typeof MACT_PERSONAL_ACCOUNT_QUERY_KEY;
  queryFn: typeof fetchMactPersonalAccount;
  retry: false;
  refetchOnWindowFocus: false;
} {
  return {
    queryKey: MACT_PERSONAL_ACCOUNT_QUERY_KEY,
    queryFn: fetchMactPersonalAccount,
    ...MACT_PROXY_QUERY_DEFAULTS,
  };
}

/** Options for {@link useMactPersonalAccountQuery} (minus fixed key/fn). */
export type MactPersonalAccountQueryOptions = Omit<
  UseQueryOptions<
    MactPersonalAccount,
    Error,
    MactPersonalAccount,
    typeof MACT_PERSONAL_ACCOUNT_QUERY_KEY
  >,
  'queryKey' | 'queryFn'
>;

/**
 * Loads MACT personal account URL via licence proxy.
 *
 * @param options - TanStack options (`enabled`, `select`, …).
 */
export function useMactPersonalAccountQuery(
  options?: MactPersonalAccountQueryOptions,
): UseQueryResult<MactPersonalAccount, Error> {
  return useQuery({
    ...mactPersonalAccountQueryOptions(),
    ...options,
  });
}

const CLIENT_MUTATION_INVALIDATE_KEYS = [
  CLIENTS_QUERY_ENTRY,
  REGISTERED_CLIENTS_QUERY_KEY,
] as const;

/** Snapshot loaded by {@link useRefreshMactMutation}. */
export interface MactRefreshResult {
  licences: MactLicenceList;
  subscription: MactSubscription;
  account: MactPersonalAccount;
}

/**
 * Reloads MACT licences, subscription and personal account in one go.
 *
 * Results go into the cache of the same queries the page reads
 * ({@link useMactLicencesQuery} and friends); a failure is thrown for the caller toast.
 */
export function useRefreshMactMutation(
  options?: EntityMutationOptions<MactRefreshResult, void>,
) {
  const queryClient = useQueryClient();
  return useInvalidatingMutation({
    ...options,
    invalidate: [REGISTERED_CLIENTS_QUERY_KEY],
    mutationFn: async () => {
      const [licences, subscription, account] = await Promise.all([
        queryClient.fetchQuery({ ...mactLicencesQueryOptions(), staleTime: 0 }),
        queryClient.fetchQuery({ ...mactSubscriptionQueryOptions(), staleTime: 0 }),
        queryClient.fetchQuery({ ...mactPersonalAccountQueryOptions(), staleTime: 0 }),
      ]);
      return { licences, subscription, account };
    },
  });
}

/** Body of POST /client_licencing/register. */
export type RegisterClientLicenceVariables = Parameters<typeof registerClientLicense>[0];

/** Binds a MACT licence to a DMC client. */
export function useRegisterClientLicenceMutation(
  options?: EntityMutationOptions<unknown, RegisterClientLicenceVariables>,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: CLIENT_MUTATION_INVALIDATE_KEYS,
    mutationFn: (payload: RegisterClientLicenceVariables) => registerClientLicense(payload),
  });
}

/** Unbinds the licence from a DMC client. */
export function useUnregisterClientLicenceMutation(
  options?: EntityMutationOptions<unknown, string>,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: CLIENT_MUTATION_INVALIDATE_KEYS,
    mutationFn: (clientId: string) => unregisterClientLicense(clientId),
  });
}

/** Deletes a DMC client record. */
export function useDeleteClientMutation(options?: EntityMutationOptions<unknown, string>) {
  return useInvalidatingMutation({
    ...options,
    invalidate: CLIENT_MUTATION_INVALIDATE_KEYS,
    mutationFn: (clientId: string) => deleteClients([clientId]),
  });
}

/** Refetches clients list and registered licences right away. */
export function useRefetchClientsMutation(options?: EntityMutationOptions<void, void>) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: async () => {
      await Promise.all(
        CLIENT_MUTATION_INVALIDATE_KEYS.map((queryKey) =>
          queryClient.refetchQueries({ queryKey }),
        ),
      );
    },
  });
}
