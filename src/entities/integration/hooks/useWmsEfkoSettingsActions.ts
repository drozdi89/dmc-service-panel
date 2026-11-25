import { ApiError } from '@/shared/api';
import { App } from 'antd';
import { useCallback } from 'react';
import {
  buildWmsEfkoPayload,
  validateWmsEfkoSettings,
  validateWmsMssqlConnection,
} from '../lib/wmsEfkoSettings';
import { INTEGRATION_MESSAGES } from '../model/messages';
import type { WmsEfkoSettings, WmsEfkoSettingsPayload } from '../model/types';
import { useSaveWmsEfkoSettingsMutation, useTestWmsEfkoConnectionMutation } from '../queries';
import type { IntegrationSettingsActionsOptions } from './useCredentialSettingsActions';

/** MS SQL fields edited for the connection test. */
export type WmsEfkoConnectionValues = Pick<
  WmsEfkoSettingsPayload,
  'mssql_host' | 'mssql_port' | 'mssql_database' | 'mssql_username' | 'mssql_password'
>;

/**
 * WMS (Efko) settings save and MS SQL connection test with validation toasts.
 * Qt reference: `modules/WmsEfkoExchange/settings_widget.py`.
 */
export function useWmsEfkoSettingsActions({ onDone }: IntegrationSettingsActionsOptions = {}) {
  const { message } = App.useApp();
  const texts = INTEGRATION_MESSAGES.wmsEfko;

  const saveMutation = useSaveWmsEfkoSettingsMutation({
    onSuccess: () => {
      message.success(texts.saved);
      onDone?.();
    },
    onError: (error) => message.error(error.message),
  });

  const testMutation = useTestWmsEfkoConnectionMutation({
    onSuccess: (result) => {
      if (result.ok) {
        message.success(texts.connectionOk);
        return;
      }
      message.error(texts.connectionFailed);
    },
    onError: (error) => {
      message.error(error instanceof ApiError ? error.message : texts.connectionError(error.message));
    },
  });

  const { mutate: saveMutate } = saveMutation;
  const { mutate: testMutate } = testMutation;

  const save = useCallback(
    (values: WmsEfkoSettingsPayload) => {
      const validationError = validateWmsEfkoSettings(values);
      if (validationError) {
        message.error(validationError);
        return;
      }
      saveMutate(buildWmsEfkoPayload(values));
    },
    [message, saveMutate],
  );

  const testConnection = useCallback(
    (values: WmsEfkoConnectionValues, loaded: WmsEfkoSettings | undefined) => {
      const validationError = validateWmsMssqlConnection(values);
      if (validationError) {
        message.error(texts.connectionError(validationError));
        return;
      }
      if (!loaded) {
        message.error(INTEGRATION_MESSAGES.settingsNotLoaded);
        return;
      }
      testMutate(buildWmsEfkoPayload({ ...loaded, ...values }));
    },
    [message, testMutate, texts],
  );

  return {
    save,
    testConnection,
    isSaving: saveMutation.isPending,
    isTesting: testMutation.isPending,
  };
}
