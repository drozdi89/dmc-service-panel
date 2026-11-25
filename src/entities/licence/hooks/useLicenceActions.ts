import { App } from 'antd';
import { useCallback } from 'react';
import { LICENCE_MESSAGES } from '../model/messages';
import type { MactLicenceInfo } from '../model/types';
import {
  useDeleteClientMutation,
  useRefetchClientsMutation,
  useRefreshMactMutation,
  useRegisterClientLicenceMutation,
  useUnregisterClientLicenceMutation,
} from '../queries';

/** Callbacks for {@link useLicenceActions}. */
export interface LicenceActionsOptions {
  /** Called after a licence is bound (close the register modal). */
  onRegistered?: () => void;
}

/** MACT load state used to explain why no licence can be bound. */
export interface MactLoadState {
  loading: boolean;
  error: Error | null;
}

/**
 * Licences page actions (MACT refresh, clients refresh, bind / unbind, delete client) with toasts.
 * Qt reference: `apps/service_panel/service_panel.py` (`refresh_licences`, `register_licence`).
 */
export function useLicenceActions({ onRegistered }: LicenceActionsOptions = {}) {
  const { message } = App.useApp();

  const mactRefreshMutation = useRefreshMactMutation({
    onSuccess: () => {
      message.success(LICENCE_MESSAGES.mactRefreshed);
    },
    onError: (error) => {
      message.error(error.message || LICENCE_MESSAGES.mactRefreshFailed);
    },
  });
  const { mutate: refreshMactMutate } = mactRefreshMutation;

  const refetchClientsMutation = useRefetchClientsMutation({
    onSuccess: () => {
      message.success(LICENCE_MESSAGES.clientsRefreshed);
    },
    onError: (error) => {
      message.error(error.message || LICENCE_MESSAGES.clientsRefreshFailed);
    },
  });

  const registerMutation = useRegisterClientLicenceMutation({
    onSuccess: () => {
      message.success(LICENCE_MESSAGES.registered);
      onRegistered?.();
      refreshMactMutate();
    },
    onError: (error) => {
      message.error(error.message || LICENCE_MESSAGES.registerFailed);
    },
  });

  const unregisterMutation = useUnregisterClientLicenceMutation({
    onSuccess: () => {
      message.success(LICENCE_MESSAGES.unregistered);
      refreshMactMutate();
    },
    onError: (error) => {
      message.error(error.message || LICENCE_MESSAGES.unregisterFailed);
    },
  });

  const deleteClientMutation = useDeleteClientMutation({
    onSuccess: () => {
      message.success(LICENCE_MESSAGES.clientDeleted);
    },
    onError: (error) => {
      message.error(error.message || LICENCE_MESSAGES.clientDeleteFailed);
    },
  });

  const { mutate: refetchClientsMutate } = refetchClientsMutation;
  const { mutate: registerMutate } = registerMutation;
  const { mutate: unregisterMutate } = unregisterMutation;
  const { mutate: deleteClientMutate } = deleteClientMutation;

  const refreshMact = useCallback(() => refreshMactMutate(), [refreshMactMutate]);
  const refetchClients = useCallback(() => refetchClientsMutate(), [refetchClientsMutate]);

  const register = useCallback(
    (clientId: string, licence: MactLicenceInfo | undefined) => {
      if (!licence) {
        message.error(LICENCE_MESSAGES.selectLicence);
        return;
      }
      registerMutate({
        client_id: clientId,
        licence_key: licence.pin,
        valid_until: licence.valid_until,
      });
    },
    [message, registerMutate],
  );

  const unregister = useCallback(
    (clientId: string) => unregisterMutate(clientId),
    [unregisterMutate],
  );

  const deleteClient = useCallback(
    (clientId: string) => deleteClientMutate(clientId),
    [deleteClientMutate],
  );

  /** Explains why the register modal cannot open (no unbound licences). */
  const notifyNoAvailableLicences = useCallback(
    ({ loading, error }: MactLoadState) => {
      if (loading) {
        message.info(LICENCE_MESSAGES.licencesLoading);
      } else if (error) {
        message.error(error.message || LICENCE_MESSAGES.licencesLoadFailed);
      } else {
        message.warning(LICENCE_MESSAGES.noAvailableLicences);
      }
    },
    [message],
  );

  return {
    refreshMact,
    isRefreshingMact: mactRefreshMutation.isPending,
    refetchClients,
    isRefetchingClients: refetchClientsMutation.isPending,
    register,
    isRegistering: registerMutation.isPending,
    unregister,
    unregisteringId: unregisterMutation.isPending ? unregisterMutation.variables : null,
    deleteClient,
    deletingId: deleteClientMutation.isPending ? deleteClientMutation.variables : null,
    notifyNoAvailableLicences,
  };
}
