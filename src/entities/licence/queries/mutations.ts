import { useInvalidatingMutation, type EntityMutationOptions } from '@/shared/queries';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteClients,
  fetchMactPersonalAccount,
  refreshMactLicences,
  refreshMactSubscription,
  registerClientLicense,
  unregisterClientLicense,
} from '../api/api';
import type { MactLicenceList, MactPersonalAccount, MactSubscription } from '../model/types';
import { CLIENTS_QUERY_ENTRY, REGISTERED_CLIENTS_QUERY_KEY } from './keys';

const CLIENT_KEYS = [CLIENTS_QUERY_ENTRY, REGISTERED_CLIENTS_QUERY_KEY] as const;

/** Snapshot loaded by {@link useRefreshMactMutation}. */
export interface MactRefreshResult {
  licences: MactLicenceList;
  subscription: MactSubscription;
  account: MactPersonalAccount;
}

/** Reloads MACT licences, subscription and personal account in one go. */
export function useRefreshMactMutation(
  options?: EntityMutationOptions<MactRefreshResult, void>,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [REGISTERED_CLIENTS_QUERY_KEY],
    mutationFn: async () => {
      const [licences, subscription, account] = await Promise.all([
        refreshMactLicences(50),
        refreshMactSubscription(),
        fetchMactPersonalAccount(),
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
    invalidate: CLIENT_KEYS,
    mutationFn: (payload: RegisterClientLicenceVariables) => registerClientLicense(payload),
  });
}

/** Unbinds the licence from a DMC client. */
export function useUnregisterClientLicenceMutation(
  options?: EntityMutationOptions<unknown, string>,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: CLIENT_KEYS,
    mutationFn: (clientId: string) => unregisterClientLicense(clientId),
  });
}

/** Deletes a DMC client record. */
export function useDeleteClientMutation(options?: EntityMutationOptions<unknown, string>) {
  return useInvalidatingMutation({
    ...options,
    invalidate: CLIENT_KEYS,
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
        CLIENT_KEYS.map((queryKey) => queryClient.refetchQueries({ queryKey })),
      );
    },
  });
}
