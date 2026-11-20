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
