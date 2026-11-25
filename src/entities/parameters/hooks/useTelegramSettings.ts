import { App } from 'antd';
import { useCallback } from 'react';
import { PARAMETERS_MESSAGES } from '../model/messages';
import type { TeleBotSettingRow } from '../model/types';
import { useSaveTeleBotSettingMutation, useTeleBotSettingQuery } from '../queries';

/**
 * Telegram bot settings: load, save, toasts.
 */
export function useTelegramSettings() {
  const { message } = App.useApp();
  const query = useTeleBotSettingQuery();

  const mutation = useSaveTeleBotSettingMutation({
    onSuccess: () => {
      message.success(PARAMETERS_MESSAGES.telegram.saved);
    },
    onError: (error) => {
      message.error(error.message || PARAMETERS_MESSAGES.telegram.saveFailed);
    },
  });
  const { mutate } = mutation;
  const existingId = query.data?.bot_setting_id ?? null;

  const save = useCallback(
    (values: Pick<TeleBotSettingRow, 'api_token' | 'is_activ'>) => {
      mutate({ setting: values, existingId });
    },
    [existingId, mutate],
  );

  return {
    setting: query.data,
    isLoading: query.isLoading,
    error: query.error,
    save,
    isSaving: mutation.isPending,
  };
}
