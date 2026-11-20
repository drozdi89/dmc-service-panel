import type { components } from '@/shared/api/types';

/** Marking options bundle for the Parameters page (GET settings_bundle). */
export type ParametersSettingsBundle = {
  use_special_numbers: boolean;
  batch_number_mandatory: boolean;
  export_data_path: string;
  use_batch_number_template: boolean;
  batch_template: string;
  use_vsd_import: boolean;
  vsd_import_path: string;
  dm_lifetime_days: number;
  dm_lifetime_warning_days: number;
  gln: string;
  tasks_limit: number;
  man_date_switch_time: string;
  minimal_culling_grade: string;
  man_date_switch_enabled: boolean;
  sscc_with_ai00_enabled: boolean;
  store_pdf_on_task_finish: boolean;
  sscc_generate_on_new_task: boolean;
  dm_is_introduced_option: boolean;
  calculate_mandate_by_days: boolean;
  subacc_products_archived: boolean;
  disable_statistics: boolean;
  disable_statistics_export: boolean;
};

/** Single marking option entry for batch upsert. */
export interface MarkingOptionEntry {
  name: string;
  value: string | number | boolean;
}

/** Single marking option value (GET /marking_options/value/{options_name}). */
export interface MarkingOptionValue {
  options_name: string;
  options_value: string | null;
}

export type FtpConfiguration = components['schemas']['FtpConfiguration'];
export type FtpConnectionSettings = components['schemas']['FtpConnectionSettings'];
export type WatchdogConfiguration = components['schemas']['WatchdogConfiguration'];
export type SlaveConfiguration = components['schemas']['SlaveConfiguration'];

/** Factory number row from list API. */
export interface FactoryNumberRow {
  id: number;
  factory_number: string;
  is_default: boolean;
}

/** Telegram bot setting row. */
export interface TeleBotSettingRow {
  bot_setting_id: number;
  api_token?: string | null;
  is_activ: boolean;
}

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
