import type { WmsEfkoLineFilterMode } from './types';

/** WMS (Efko) line filter modes for the settings select. */
export const WMS_EFKO_LINE_FILTER_OPTIONS: Array<{ value: WmsEfkoLineFilterMode; label: string }> = [
  { value: 'all', label: 'Все линии' },
  { value: 'include', label: 'Только выбранные линии' },
  { value: 'exclude', label: 'Исключить выбранные линии' },
];

/** MS SQL default port for WMS (Efko) when the API returns none. */
export const DEFAULT_WMS_MSSQL_PORT = 1433;
