import { App } from 'antd';
import { useCallback } from 'react';
import { PARAMETERS_MESSAGES } from '../model/messages';
import type { WatchdogConfiguration } from '../model/types';
import {
  useSaveWatchdogConfigurationMutation,
  useWatchdogConfigurationQuery,
} from '../queries';

/**
 * Watchdog settings: load, save, toasts.
 */
export function useWatchdogSettings() {
  const { message } = App.useApp();
  const query = useWatchdogConfigurationQuery();

  const mutation = useSaveWatchdogConfigurationMutation({
    onSuccess: () => {
      message.success(PARAMETERS_MESSAGES.watchdog.saved);
    },
    onError: (error) => {
      message.error(error.message || PARAMETERS_MESSAGES.watchdog.saveFailed);
    },
  });
  const { mutate } = mutation;

  const save = useCallback((values: WatchdogConfiguration) => mutate(values), [mutate]);

  return {
    config: query.data,
    isLoading: query.isLoading,
    error: query.error,
    save,
    isSaving: mutation.isPending,
  };
}
