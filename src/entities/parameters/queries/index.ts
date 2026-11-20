/**
 * Parameters entity TanStack Query hooks and stable keys.
 *
 * Import only via `@/entities/parameters`.
 */

export {
  FACTORY_NUMBERS_QUERY_KEY,
  FTP_QUERY_KEY,
  PARAMETERS_QUERY_ROOT,
  SETTINGS_BUNDLE_QUERY_KEY,
  SLAVE_QUERY_KEY,
  TELE_BOT_QUERY_KEY,
  WATCHDOG_QUERY_KEY,
  markingOptionValueQueryKey,
} from './keys';

export {
  factoryNumbersQueries,
  useFactoryNumbersListQuery,
  useFactoryNumbersLookupQuery,
} from './factory-numbers';

export {
  ftpConfigurationQueryOptions,
  settingsBundleQueryOptions,
  slaveConfigurationQueryOptions,
  teleBotSettingQueryOptions,
  useFtpConfigurationQuery,
  useSettingsBundleQuery,
  useSlaveConfigurationQuery,
  useTeleBotSettingQuery,
  useWatchdogConfigurationQuery,
  watchdogConfigurationQueryOptions,
  type FtpConfigurationQueryOptions,
  type SettingsBundleQueryOptions,
  type SlaveConfigurationQueryOptions,
  type TeleBotSettingQueryOptions,
  type WatchdogConfigurationQueryOptions,
} from './settings';

export {
  factoryNumbersMutations,
  useSaveFtpConfigurationMutation,
  useSaveMarkingOptionsMutation,
  useSaveTeleBotSettingMutation,
  useSaveWatchdogConfigurationMutation,
  type SaveTeleBotSettingVariables,
} from './mutations';

export {
  markingOptionValueQueryOptions,
  useDmcCompSizeQuery,
  useMarkingOptionValueQuery,
  type DmcCompSizeQueryOptions,
  type MarkingOptionValueQueryOptions,
} from './marking-option-value';
