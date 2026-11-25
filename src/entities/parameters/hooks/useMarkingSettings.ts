import { App } from 'antd';
import { useCallback } from 'react';
import { markingFormToBatchEntries } from '../lib/markingFormToBatchEntries';
import { validateBatchTemplate } from '../lib/validateBatchTemplate';
import { PARAMETERS_MESSAGES } from '../model/messages';
import type { ParametersSettingsBundle } from '../model/types';
import {
  useSaveMarkingOptionsMutation,
  useSettingsBundleQuery,
  useSlaveConfigurationQuery,
} from '../queries';

/**
 * Marking options: load bundle + slave mode, validate batch template, save, toasts.
 */
export function useMarkingSettings() {
  const { message } = App.useApp();
  const bundleQuery = useSettingsBundleQuery();
  const slaveQuery = useSlaveConfigurationQuery();
  const isSlaveMode = slaveQuery.data?.slave_mode === true;

  const mutation = useSaveMarkingOptionsMutation({
    onSuccess: () => {
      message.success(PARAMETERS_MESSAGES.marking.saved);
    },
    onError: (error) => {
      message.error(error.message || PARAMETERS_MESSAGES.marking.saveFailed);
    },
  });
  const { mutate } = mutation;

  const save = useCallback(
    (values: ParametersSettingsBundle) => {
      const templateError = validateBatchTemplate(values.batch_template);
      if (templateError) {
        message.error(templateError);
        return;
      }
      mutate(markingFormToBatchEntries(values, isSlaveMode));
    },
    [isSlaveMode, message, mutate],
  );

  return {
    values: bundleQuery.data,
    isSlaveMode,
    isLoading: bundleQuery.isLoading || slaveQuery.isLoading,
    error: bundleQuery.error ?? slaveQuery.error,
    save,
    isSaving: mutation.isPending,
  };
}
