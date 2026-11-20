import type { components } from '@/shared/api/types';

/** CRPT organization row from list/detail API. */
export type CrptOrganization = components['schemas']['GetCrptOrganizationsSchema'] & {
  crpt_template_idx?: number | null;
};

/** CRPT organization create payload. */
export type CrptOrganizationCreatePayload = components['schemas']['GetCrptOrganizationsSchema'];

/** CRPT organization partial update payload. */
export type CrptOrganizationUpdatePayload = components['schemas']['UpdateCrptOrganizationsSchema'];

/** DataMark credentials. */
export type DataMarkCredentials = components['schemas']['DataMarkCredentialsData'];

/** Utrace integration settings. */
export type UtraceSettings = components['schemas']['UtraceSettingsData'];

/** Autoorder configuration payload. */
export type AutoorderOptions = components['schemas']['AutoorderOptionsPayload'];

/** Per-product autoorder row. */
export type AutoorderProductRow = components['schemas']['ProdOrderDataSchema'];

/** Per-product autosend flags. */
export type AutosendProductSettings = components['schemas']['AutosendProductSettings'];

/** Autosend CRPT transfer mode (OpenAPI TaskerSchedule lacks send_mode). */
export type AutosendSendMode = 'unit_codes' | 'last_aggregate';

/** Autosend scheduler settings (extended with send_mode from backend TaskerSchedule). */
export type TaskerSchedule = components['schemas']['TaskerSchedule'] & {
  send_mode?: AutosendSendMode;
};

/** Autosend configuration payload (schedule includes send_mode). */
export type AutosendSettingsPayload = Omit<
  components['schemas']['AutosendSettingsPayload'],
  'schedule'
> & {
  schedule?: TaskerSchedule;
};

/** Production line list row. */
export type LineListItem = components['schemas']['GetLinesSchema'];

/** Line runtime options. */
export type LineOptions = components['schemas']['LinesOptionsSchema-Output'];

/** Line with options for task type configuration. */
export interface LineTaskTypeRow {
  lineid: number;
  linename: string;
  reserve_disabled: boolean;
  hasOptions: boolean;
}

/** Server activation info (allowed CRPT org count). */
export interface ServerActivationInfo {
  allowed_company_count?: number | null;
}

/** 1C Alife exchange singleton settings (GET/PUT). */
export type OneCExchangeSettings = components['schemas']['UpdateOneCExchangeSettingsPayload'];

/** 1C Alife exchange PUT payload. */
export type OneCExchangeSettingsPayload = components['schemas']['UpdateOneCExchangeSettingsPayload'];

/** One DMC server entry from GET /one_c_exchange/servers. */
export interface OneCExchangeServer {
  code: number;
  name: string;
  ip: string;
  port: string;
}

/** Response envelope from GET /one_c_exchange/servers. */
export interface OneCExchangeServersResponse {
  result: boolean;
  message?: string | unknown[] | null;
  detail?: string | string[] | null;
  servers: OneCExchangeServer[];
}

/** WMS (Efko) line filter mode. */
export type WmsEfkoLineFilterMode = 'all' | 'include' | 'exclude';

/** WMS (Efko) exchange singleton settings (GET/PUT). */
export interface WmsEfkoSettings {
  enabled: boolean;
  mssql_host?: string | null;
  mssql_port?: number | null;
  mssql_database?: string | null;
  mssql_username?: string | null;
  api_host?: string | null;
  api_port?: number | null;
  line_filter_mode: WmsEfkoLineFilterMode;
  line_ids: number[];
}

/** WMS (Efko) exchange PUT payload (`mssql_password` optional). */
export interface WmsEfkoSettingsPayload extends WmsEfkoSettings {
  mssql_password?: string | null;
}

/** CRPT organization form values. */
export interface CrptOrganizationFormValues {
  inn: string;
  name: string;
  kpp?: string;
  thumbprint: string;
  is_demo: boolean;
  oms_id: string;
  oms_connection: string;
  load_wares: boolean;
  auto_bill: boolean;
  bill_sum: number;
  bill_min: number;
  bill_email?: string;
  mods_list: string;
  short_template: boolean;
}
