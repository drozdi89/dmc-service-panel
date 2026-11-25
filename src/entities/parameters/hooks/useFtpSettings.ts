import { App } from 'antd';
import { useCallback } from 'react';
import { PARAMETERS_MESSAGES } from '../model/messages';
import type { FtpConfiguration } from '../model/types';
import {
  useFtpConfigurationQuery,
  useSaveFtpConfigurationMutation,
  useSlaveConfigurationQuery,
} from '../queries';

/**
 * FTP exchange settings: loaded only outside slave mode; save with toasts.
 */
export function useFtpSettings() {
  const { message } = App.useApp();
  const slaveQuery = useSlaveConfigurationQuery();
  const shouldLoad = slaveQuery.isSuccess && slaveQuery.data.slave_mode !== true;
  const ftpQuery = useFtpConfigurationQuery({ enabled: shouldLoad });

  const mutation = useSaveFtpConfigurationMutation({
    onSuccess: () => {
      message.success(PARAMETERS_MESSAGES.ftp.saved);
    },
    onError: (error) => {
      message.error(error.message || PARAMETERS_MESSAGES.ftp.saveFailed);
    },
  });
  const { mutate } = mutation;

  const save = useCallback((values: FtpConfiguration) => mutate(values), [mutate]);

  return {
    config: ftpQuery.data,
    isLoading: slaveQuery.isLoading || (shouldLoad && ftpQuery.isLoading),
    error: slaveQuery.error ?? (shouldLoad ? ftpQuery.error : null),
    save,
    isSaving: mutation.isPending,
  };
}
