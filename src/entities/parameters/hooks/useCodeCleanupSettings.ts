import { App } from 'antd';
import { useCallback } from 'react';
import { PARAMETERS_MESSAGES } from '../model/messages';
import type { CodeCleanupSettings } from '../model/types';
import { useCodeCleanupSettingsQuery, useSaveCodeCleanupMutation } from '../queries';

/**
 * Scheduled code cleanup settings: load four marking options, save batch, toasts.
 */
export function useCodeCleanupSettings() {
  const { message } = App.useApp();
  const query = useCodeCleanupSettingsQuery();

  const mutation = useSaveCodeCleanupMutation({
    onSuccess: () => {
      message.success(PARAMETERS_MESSAGES.codeCleanup.saved);
    },
    onError: (error) => {
      message.error(error.message || PARAMETERS_MESSAGES.codeCleanup.saveFailed);
    },
  });
  const { mutate } = mutation;

  const save = useCallback((values: CodeCleanupSettings) => mutate(values), [mutate]);

  return {
    settings: query.data,
    isLoading: query.isLoading,
    error: query.error,
    save,
    isSaving: mutation.isPending,
  };
}
