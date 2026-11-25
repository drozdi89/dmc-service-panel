import { useQuery } from '@tanstack/react-query';
import { App } from 'antd';
import { useCallback } from 'react';
import { statisticsFormToBatchEntries } from '../lib/markingFormToBatchEntries';
import { PARAMETERS_MESSAGES } from '../model/messages';
import type { ParametersSettingsBundle } from '../model/types';
import { settingsBundleQueryOptions, useSaveMarkingOptionsMutation } from '../queries';

/** Statistics toggles slice of the settings bundle. */
export type StatisticsSettings = Pick<
  ParametersSettingsBundle,
  'disable_statistics' | 'disable_statistics_export'
>;

/** Stable selector: keeps the reference unless a statistics flag changes. */
function selectStatistics(bundle: ParametersSettingsBundle): StatisticsSettings {
  return {
    disable_statistics: bundle.disable_statistics,
    disable_statistics_export: bundle.disable_statistics_export,
  };
}

/**
 * Statistics collection toggles: load from settings bundle, save two options, toasts.
 */
export function useStatisticsSettings() {
  const { message } = App.useApp();
  const query = useQuery({ ...settingsBundleQueryOptions(), select: selectStatistics });

  const mutation = useSaveMarkingOptionsMutation({
    onSuccess: () => {
      message.success(PARAMETERS_MESSAGES.statistics.saved);
    },
    onError: (error) => {
      message.error(error.message || PARAMETERS_MESSAGES.statistics.saveFailed);
    },
  });
  const { mutate } = mutation;

  const save = useCallback(
    (values: StatisticsSettings) => mutate(statisticsFormToBatchEntries(values)),
    [mutate],
  );

  return {
    values: query.data,
    isLoading: query.isLoading,
    error: query.error,
    save,
    isSaving: mutation.isPending,
  };
}
