import { App } from 'antd';
import { useCallback, useMemo } from 'react';
import { INTEGRATION_MESSAGES } from '../model/messages';
import type { AutoorderOptions, AutosendSettingsPayload, LineTaskTypeRow } from '../model/types';
import {
  useSaveAutoorderOptionsMutation,
  useSaveAutosendSettingsMutation,
  useSaveLineTaskTypesMutation,
} from '../queries';
import type { IntegrationSettingsActionsOptions } from './useCredentialSettingsActions';

/**
 * Autoorder options save with toasts.
 */
export function useAutoorderSettingsActions({ onDone }: IntegrationSettingsActionsOptions = {}) {
  const { message } = App.useApp();
  const mutation = useSaveAutoorderOptionsMutation({
    onSuccess: () => {
      message.success(INTEGRATION_MESSAGES.autoorder.saved);
      onDone?.();
    },
    onError: (error) => message.error(error.message),
  });
  const { mutate } = mutation;
  const save = useCallback((options: AutoorderOptions) => mutate(options), [mutate]);
  return { save, isSaving: mutation.isPending };
}

/**
 * Autosend settings save with toasts.
 */
export function useAutosendSettingsActions({ onDone }: IntegrationSettingsActionsOptions = {}) {
  const { message } = App.useApp();
  const mutation = useSaveAutosendSettingsMutation({
    onSuccess: () => {
      message.success(INTEGRATION_MESSAGES.autosend.saved);
      onDone?.();
    },
    onError: (error) => message.error(error.message),
  });
  const { mutate } = mutation;
  const save = useCallback((payload: AutosendSettingsPayload) => mutate(payload), [mutate]);
  return { save, isSaving: mutation.isPending };
}

/**
 * Per-line KM task type batch save with toasts.
 */
export function useLineTaskTypesSaveActions({ onDone }: IntegrationSettingsActionsOptions = {}) {
  const { message } = App.useApp();
  const mutation = useSaveLineTaskTypesMutation({
    onSuccess: (count) => {
      message.success(INTEGRATION_MESSAGES.lineTaskType.saved(count));
      onDone?.();
    },
    onError: (error) => message.error(error.message),
  });
  const { mutate } = mutation;
  const save = useCallback((rows: LineTaskTypeRow[]) => mutate(rows), [mutate]);
  return { save, isSaving: mutation.isPending };
}

/**
 * Toast handlers for the product CRPT template batch save.
 *
 * The mutation itself is orchestrated in `services/integration-service`
 * (entities cannot import services), so the caller passes these handlers to it.
 */
export function useCrptTemplatesSaveFeedback({ onDone }: IntegrationSettingsActionsOptions = {}) {
  const { message } = App.useApp();
  return useMemo(
    () => ({
      onSuccess: (count: number) => {
        message.success(INTEGRATION_MESSAGES.crptTemplates.saved(count));
        onDone?.();
      },
      onError: (error: Error) => {
        message.error(error.message);
      },
    }),
    [message, onDone],
  );
}
