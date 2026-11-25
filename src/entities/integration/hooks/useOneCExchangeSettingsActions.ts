import { ApiError } from '@/shared/api';
import { App } from 'antd';
import { useCallback } from 'react';
import {
  buildOneCExchangePayload,
  validateOneCConnection,
  validateOneCExchangeSettings,
} from '../lib/oneCExchangeSettings';
import { INTEGRATION_MESSAGES } from '../model/messages';
import type { OneCExchangeServer, OneCExchangeSettings } from '../model/types';
import {
  useRefreshOneCExchangeServersMutation,
  useSaveOneCExchangeSettingsMutation,
} from '../queries';
import type { IntegrationSettingsActionsOptions } from './useCredentialSettingsActions';

/** Context for 1C save / refresh: loaded snapshot and stored-password flag. */
export interface OneCExchangeActionContext {
  loaded: OneCExchangeSettings | undefined;
  passwordConfigured: boolean;
}

/**
 * 1C exchange settings save and DMC server list refresh with validation toasts.
 */
export function useOneCExchangeSettingsActions({ onDone }: IntegrationSettingsActionsOptions = {}) {
  const { message } = App.useApp();
  const texts = INTEGRATION_MESSAGES.oneCExchange;

  const saveMutation = useSaveOneCExchangeSettingsMutation({
    onSuccess: () => {
      message.success(texts.saved);
      onDone?.();
    },
    onError: (error) => message.error(error.message),
  });

  const refreshMutation = useRefreshOneCExchangeServersMutation({
    onError: (error) => {
      message.error(error instanceof ApiError ? error.message : texts.serversError(error.message));
    },
  });

  const { mutate: saveMutate } = saveMutation;
  const { mutate: refreshMutate } = refreshMutation;

  const save = useCallback(
    (values: OneCExchangeSettings, { loaded, passwordConfigured }: OneCExchangeActionContext) => {
      if (!loaded) {
        message.error(INTEGRATION_MESSAGES.settingsNotLoaded);
        return;
      }
      const saved = { loaded, passwordConfigured };
      const validationError = validateOneCExchangeSettings(values, saved);
      if (validationError) {
        message.error(validationError);
        return;
      }
      saveMutate(buildOneCExchangePayload(values, saved));
    },
    [message, saveMutate],
  );

  /**
   * Saves connection fields and reloads the DMC server list from 1C.
   *
   * @param onLoaded - Receives the server list and the srv_id to keep selected.
   */
  const refreshServers = useCallback(
    (
      values: OneCExchangeSettings,
      { loaded, passwordConfigured }: OneCExchangeActionContext,
      onLoaded: (servers: OneCExchangeServer[], selectedSrvId: number | null) => void,
    ) => {
      if (!loaded) {
        message.error(INTEGRATION_MESSAGES.settingsNotLoaded);
        return;
      }
      const saved = { loaded, passwordConfigured };
      const validationError =
        validateOneCConnection(values, saved) ??
        (values.enabled ? validateOneCExchangeSettings(values, saved) : null);
      if (validationError) {
        message.error(texts.serversError(validationError));
        return;
      }
      const selectedSrvId = values.srv_id ?? loaded.srv_id ?? null;
      refreshMutate(buildOneCExchangePayload(values, saved, { preserveFlags: true }), {
        onSuccess: (response) => {
          const servers = response.servers ?? [];
          if (servers.length === 0) {
            message.warning(texts.serversEmpty);
          } else if (
            selectedSrvId != null &&
            !servers.some((server) => server.code === selectedSrvId)
          ) {
            message.warning(texts.srvIdMissing(selectedSrvId));
          } else {
            message.success(texts.serversRefreshed);
          }
          onLoaded(servers, selectedSrvId);
        },
      });
    },
    [message, refreshMutate, texts],
  );

  return {
    save,
    refreshServers,
    isSaving: saveMutation.isPending,
    isRefreshing: refreshMutation.isPending,
  };
}
