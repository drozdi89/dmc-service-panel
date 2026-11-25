import type { components } from '@/shared/api';

/** Marking options bundle for the Parameters page (GET settings_bundle). */
export type ParametersSettingsBundle = components['schemas']['ParametersSettingsBundle'];

/** Single marking option entry for batch upsert. */
export type MarkingOptionEntry = components['schemas']['MarkingOptionEntry'];

/** Single marking option value (GET /marking_options/value/{options_name}). */
export type MarkingOptionValue = components['schemas']['MarkingOptionValueSchema'];

export type FtpConfiguration = components['schemas']['FtpConfiguration'];
export type FtpConnectionSettings = components['schemas']['FtpConnectionSettings'];
export type WatchdogConfiguration = components['schemas']['WatchdogConfiguration'];
export type SlaveConfiguration = components['schemas']['SlaveConfiguration'];

/**
 * Scheduled code cleanup settings.
 *
 * Not an OpenAPI schema: the spec has no dedicated endpoint, values live in four
 * `marking_options` keys (see `CODE_CLEANUP_KEYS`) and are mapped on the entity boundary.
 */
export interface CodeCleanupSettings {
  enabled: boolean;
  /** Retention in days, 1…3650. */
  days: number;
  /** Daily start time, `HH:MM`. */
  start_time: string;
  /** Minimal interval between runs, 1…168 hours. */
  interval_hours: number;
}

/** Factory number row from list API. */
export type FactoryNumberRow = components['schemas']['GetFactoryNumbersSchema'];

/** Telegram bot setting row. */
export type TeleBotSettingRow = components['schemas']['GetTeleBotSettingSchema'];

/** Allowed batch template placeholder fields (parity with Qt mark_settings). */
export const BATCH_TEMPLATE_FIELDS = [
  'mandate',
  'lifetime',
  'serial',
  'shift',
  'gtin',
] as const;

/** Minimal culling grade options (A–F). */
export const MINIMAL_GRADE_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
