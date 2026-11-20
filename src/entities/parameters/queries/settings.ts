import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  fetchFtpConfiguration,
  fetchSettingsBundle,
  fetchSlaveConfiguration,
  fetchTeleBotSetting,
  fetchWatchdogConfiguration,
} from '../api/api';
import type {
  FtpConfiguration,
  ParametersSettingsBundle,
  SlaveConfiguration,
  TeleBotSettingRow,
  WatchdogConfiguration,
} from '../model/types';
import {
  FTP_QUERY_KEY,
  SETTINGS_BUNDLE_QUERY_KEY,
  SLAVE_QUERY_KEY,
  TELE_BOT_QUERY_KEY,
  WATCHDOG_QUERY_KEY,
} from './keys';

type QueryOpts<TData, TKey extends readonly unknown[]> = Omit<
  UseQueryOptions<TData, Error, TData, TKey>,
  'queryKey' | 'queryFn'
>;

/** Query options for marking options settings bundle. */
export function settingsBundleQueryOptions(): {
  queryKey: typeof SETTINGS_BUNDLE_QUERY_KEY;
  queryFn: typeof fetchSettingsBundle;
} {
  return {
    queryKey: SETTINGS_BUNDLE_QUERY_KEY,
    queryFn: fetchSettingsBundle,
  };
}

/** Options for {@link useSettingsBundleQuery}. */
export type SettingsBundleQueryOptions = QueryOpts<
  ParametersSettingsBundle,
  typeof SETTINGS_BUNDLE_QUERY_KEY
>;

/**
 * Loads Parameters settings bundle (marking options + GLN, etc.).
 *
 * @param options - TanStack options (`enabled`, `select`, …).
 */
export function useSettingsBundleQuery(
  options?: SettingsBundleQueryOptions,
): UseQueryResult<ParametersSettingsBundle, Error> {
  return useQuery({
    ...settingsBundleQueryOptions(),
    ...options,
  });
}

/** Query options for slave mode configuration. */
export function slaveConfigurationQueryOptions(): {
  queryKey: typeof SLAVE_QUERY_KEY;
  queryFn: typeof fetchSlaveConfiguration;
} {
  return {
    queryKey: SLAVE_QUERY_KEY,
    queryFn: fetchSlaveConfiguration,
  };
}

/** Options for {@link useSlaveConfigurationQuery}. */
export type SlaveConfigurationQueryOptions = QueryOpts<
  SlaveConfiguration,
  typeof SLAVE_QUERY_KEY
>;

/**
 * Loads slave mode configuration (hides FTP / some marking fields when active).
 *
 * @param options - TanStack options (`enabled`, `select`, …).
 */
export function useSlaveConfigurationQuery(
  options?: SlaveConfigurationQueryOptions,
): UseQueryResult<SlaveConfiguration, Error> {
  return useQuery({
    ...slaveConfigurationQueryOptions(),
    ...options,
  });
}

/** Query options for Telegram bot settings. */
export function teleBotSettingQueryOptions(): {
  queryKey: typeof TELE_BOT_QUERY_KEY;
  queryFn: typeof fetchTeleBotSetting;
} {
  return {
    queryKey: TELE_BOT_QUERY_KEY,
    queryFn: fetchTeleBotSetting,
  };
}

/** Options for {@link useTeleBotSettingQuery}. */
export type TeleBotSettingQueryOptions = QueryOpts<
  TeleBotSettingRow | null,
  typeof TELE_BOT_QUERY_KEY
>;

/**
 * Loads active Telegram bot setting row (or null).
 *
 * @param options - TanStack options (`enabled`, `select`, …).
 */
export function useTeleBotSettingQuery(
  options?: TeleBotSettingQueryOptions,
): UseQueryResult<TeleBotSettingRow | null, Error> {
  return useQuery({
    ...teleBotSettingQueryOptions(),
    ...options,
  });
}

/** Query options for FTP configuration. */
export function ftpConfigurationQueryOptions(): {
  queryKey: typeof FTP_QUERY_KEY;
  queryFn: typeof fetchFtpConfiguration;
} {
  return {
    queryKey: FTP_QUERY_KEY,
    queryFn: fetchFtpConfiguration,
  };
}

/** Options for {@link useFtpConfigurationQuery}. */
export type FtpConfigurationQueryOptions = QueryOpts<
  FtpConfiguration,
  typeof FTP_QUERY_KEY
>;

/**
 * Loads FTP service configuration.
 *
 * @param options - TanStack options (`enabled`, `select`, …). Prefer `enabled: !slaveMode`.
 */
export function useFtpConfigurationQuery(
  options?: FtpConfigurationQueryOptions,
): UseQueryResult<FtpConfiguration, Error> {
  return useQuery({
    ...ftpConfigurationQueryOptions(),
    ...options,
  });
}

/** Query options for watchdog configuration. */
export function watchdogConfigurationQueryOptions(): {
  queryKey: typeof WATCHDOG_QUERY_KEY;
  queryFn: typeof fetchWatchdogConfiguration;
} {
  return {
    queryKey: WATCHDOG_QUERY_KEY,
    queryFn: fetchWatchdogConfiguration,
  };
}

/** Options for {@link useWatchdogConfigurationQuery}. */
export type WatchdogConfigurationQueryOptions = QueryOpts<
  WatchdogConfiguration,
  typeof WATCHDOG_QUERY_KEY
>;

/**
 * Loads watchdog service configuration.
 *
 * @param options - TanStack options (`enabled`, `select`, …).
 */
export function useWatchdogConfigurationQuery(
  options?: WatchdogConfigurationQueryOptions,
): UseQueryResult<WatchdogConfiguration, Error> {
  return useQuery({
    ...watchdogConfigurationQueryOptions(),
    ...options,
  });
}
