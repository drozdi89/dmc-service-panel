import { App } from 'antd';
import { useCallback } from 'react';
import { INTEGRATION_MESSAGES } from '../model/messages';
import {
  useDeleteDataMarkCredentialsMutation,
  useDeleteUtraceSettingsMutation,
  useSaveDataMarkCredentialsMutation,
  useSaveUtraceSettingsMutation,
  type SaveDataMarkCredentialsVariables,
  type SaveUtraceSettingsVariables,
} from '../queries';

/** Callbacks shared by integration settings action hooks. */
export interface IntegrationSettingsActionsOptions {
  /** Called after a successful save or delete (e.g. close the drawer). */
  onDone?: () => void;
}

/**
 * DataMark credentials save / delete with toasts.
 */
export function useDataMarkSettingsActions({ onDone }: IntegrationSettingsActionsOptions = {}) {
  const { message } = App.useApp();
  const showError = (error: Error) => message.error(error.message);

  const saveMutation = useSaveDataMarkCredentialsMutation({
    onSuccess: () => {
      message.success(INTEGRATION_MESSAGES.datamark.saved);
      onDone?.();
    },
    onError: showError,
  });
  const deleteMutation = useDeleteDataMarkCredentialsMutation({
    onSuccess: () => {
      message.success(INTEGRATION_MESSAGES.datamark.deleted);
      onDone?.();
    },
    onError: showError,
  });
  const { mutate: saveMutate } = saveMutation;
  const { mutate: deleteMutate } = deleteMutation;

  const save = useCallback(
    (variables: SaveDataMarkCredentialsVariables) => saveMutate(variables),
    [saveMutate],
  );
  const remove = useCallback((unp: string) => deleteMutate(unp), [deleteMutate]);

  return {
    save,
    remove,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Utrace settings save / delete with toasts.
 */
export function useUtraceSettingsActions({ onDone }: IntegrationSettingsActionsOptions = {}) {
  const { message } = App.useApp();
  const showError = (error: Error) => message.error(error.message);

  const saveMutation = useSaveUtraceSettingsMutation({
    onSuccess: () => {
      message.success(INTEGRATION_MESSAGES.utrace.saved);
      onDone?.();
    },
    onError: showError,
  });
  const deleteMutation = useDeleteUtraceSettingsMutation({
    onSuccess: () => {
      message.success(INTEGRATION_MESSAGES.utrace.deleted);
      onDone?.();
    },
    onError: showError,
  });
  const { mutate: saveMutate } = saveMutation;
  const { mutate: deleteMutate } = deleteMutation;

  const save = useCallback(
    (variables: SaveUtraceSettingsVariables) => saveMutate(variables),
    [saveMutate],
  );
  const remove = useCallback(() => deleteMutate(), [deleteMutate]);

  return {
    save,
    remove,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
