/**
 * Root prefix for all parameters React Query keys.
 * Invalidate with `{ queryKey: PARAMETERS_QUERY_ROOT }` to clear the whole group.
 */
export const PARAMETERS_QUERY_ROOT = ['parameters'] as const;

/** Marking options settings bundle (Parameters page + line aggregation GLN). */
export const SETTINGS_BUNDLE_QUERY_KEY = [
  ...PARAMETERS_QUERY_ROOT,
  'settings-bundle',
] as const;

/** Slave mode configuration. */
export const SLAVE_QUERY_KEY = [...PARAMETERS_QUERY_ROOT, 'slave'] as const;

/** Telegram bot settings. */
export const TELE_BOT_QUERY_KEY = [...PARAMETERS_QUERY_ROOT, 'tele-bot'] as const;

/** FTP service configuration. */
export const FTP_QUERY_KEY = [...PARAMETERS_QUERY_ROOT, 'ftp'] as const;

/** Watchdog service configuration. */
export const WATCHDOG_QUERY_KEY = [...PARAMETERS_QUERY_ROOT, 'watchdog'] as const;

/**
 * Factory numbers entry (list / lookup / detail scopes appended by factoryQuery).
 * AsyncLookupSelect / tables use this as `queryKey` prefix.
 */
export const FACTORY_NUMBERS_QUERY_KEY = [
  ...PARAMETERS_QUERY_ROOT,
  'factory-numbers',
] as const;

/**
 * Single marking option value by key.
 *
 * @param optionsName - Marking option key (e.g. `dmc_comp_size`).
 */
export function markingOptionValueQueryKey(
  optionsName: string,
): readonly [typeof PARAMETERS_QUERY_ROOT[number], 'marking-option-value', string] {
  return [...PARAMETERS_QUERY_ROOT, 'marking-option-value', optionsName];
}
