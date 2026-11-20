import { createIdempotencyKey } from '@/shared/api';
import {
  factoryMutation,
  useInvalidatingMutation,
  type EntityMutationOptions,
} from '@/shared/queries';
import {
  createFactoryNumber,
  deleteFactoryNumbers,
  saveFtpConfiguration,
  saveMarkingOptionsBatch,
  saveTeleBotSetting,
  saveWatchdogConfiguration,
  updateFactoryNumber,
} from '../api/api';
import type {
  FactoryNumberRow,
  FtpConfiguration,
  MarkingOptionEntry,
  TeleBotSettingRow,
  WatchdogConfiguration,
} from '../model/types';
import {
  FACTORY_NUMBERS_QUERY_KEY,
  FTP_QUERY_KEY,
  SETTINGS_BUNDLE_QUERY_KEY,
  TELE_BOT_QUERY_KEY,
  WATCHDOG_QUERY_KEY,
} from './keys';

/** Create / update / delete mutations for factory numbers. */
export const factoryNumbersMutations = factoryMutation<FactoryNumberRow, number>({
  entry: FACTORY_NUMBERS_QUERY_KEY,
  fetchCreate: ({ factory_number = '', is_default = false }) =>
    createFactoryNumber({ factory_number, is_default }, createIdempotencyKey()),
  fetchUpdate: (id, { factory_number, is_default }) =>
    updateFactoryNumber(id, { factory_number, is_default }, createIdempotencyKey()),
  fetchDelete: async (id) => {
    await deleteFactoryNumbers([id], createIdempotencyKey());
    return null;
  },
});

/** Upserts marking options (settings bundle) in one batch. */
export function useSaveMarkingOptionsMutation(
  options?: EntityMutationOptions<
    Awaited<ReturnType<typeof saveMarkingOptionsBatch>>,
    MarkingOptionEntry[]
  >,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [SETTINGS_BUNDLE_QUERY_KEY],
    mutationFn: (entries: MarkingOptionEntry[]) => saveMarkingOptionsBatch(entries),
  });
}

/** Variables for {@link useSaveTeleBotSettingMutation}. */
export interface SaveTeleBotSettingVariables {
  setting: Pick<TeleBotSettingRow, 'api_token' | 'is_activ'>;
  /** Stored `bot_setting_id`; PATCH when set, POST otherwise. */
  existingId: number | null;
}

/** Creates or updates the Telegram bot setting. */
export function useSaveTeleBotSettingMutation(
  options?: EntityMutationOptions<TeleBotSettingRow, SaveTeleBotSettingVariables>,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [TELE_BOT_QUERY_KEY],
    mutationFn: ({ setting, existingId }: SaveTeleBotSettingVariables) =>
      saveTeleBotSetting(
        { api_token: setting.api_token ?? '', is_activ: setting.is_activ ?? false },
        existingId,
        createIdempotencyKey(),
      ),
  });
}

/** Saves FTP exchange configuration. */
export function useSaveFtpConfigurationMutation(
  options?: EntityMutationOptions<
    Awaited<ReturnType<typeof saveFtpConfiguration>>,
    FtpConfiguration
  >,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [FTP_QUERY_KEY],
    mutationFn: (config: FtpConfiguration) =>
      saveFtpConfiguration(config, createIdempotencyKey()),
  });
}

/** Saves Watchdog configuration. */
export function useSaveWatchdogConfigurationMutation(
  options?: EntityMutationOptions<
    Awaited<ReturnType<typeof saveWatchdogConfiguration>>,
    WatchdogConfiguration
  >,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [WATCHDOG_QUERY_KEY],
    mutationFn: (config: WatchdogConfiguration) =>
      saveWatchdogConfiguration(config, createIdempotencyKey()),
  });
}
