import type { components } from '@/shared/api';

/**
 * CRPT organization row from list/detail API.
 * OpenAPI is incomplete: detail also returns `crpt_template_idx` (stored in marking options).
 */
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

/**
 * Per-product autosend flags.
 * OpenAPI is incomplete: the autosend endpoint also returns and accepts `auto_send_aggregate`.
 */
export type AutosendProductSettings = components['schemas']['AutosendProductSettings'] & {
  auto_aggregate?: boolean;
};

/** Autosend CRPT transfer mode. */
export type AutosendSendMode = components['schemas']['AutosendSendMode'];

/** Autosend scheduler settings. */
export type TaskerSchedule = components['schemas']['TaskerSchedule'];

/** Autosend configuration (GET response, PUT body). */
export type AutosendSettingsPayload = Omit<
  components['schemas']['AutosendSettingsPayload-Output'],
  'products'
> & {
  products?: AutosendProductSettings[];
};

/** Production line list row. */
export type LineListItem = components['schemas']['GetLinesSchema'];

/** Line runtime options. */
export type LineOptions = components['schemas']['LinesOptionsSchema'];

/** Line with options for task type configuration. */
export interface LineTaskTypeRow {
  lineid: number;
  linename: string;
  reserve_disabled: boolean;
  hasOptions: boolean;
}

/**
 * Server activation info (allowed CRPT org count).
 * OpenAPI is incomplete: GET returns `allowed_company_count` (present only in `ServerActivationUpdate`).
 */
export type ServerActivationInfo = components['schemas']['ServerActivationState'] & {
  allowed_company_count?: number | null;
};

/** 1C Alife exchange singleton settings (GET/PUT). */
export type OneCExchangeSettings = components['schemas']['UpdateOneCExchangeSettingsPayload'];

/** 1C Alife exchange PUT payload. */
export type OneCExchangeSettingsPayload = components['schemas']['UpdateOneCExchangeSettingsPayload'];

/** Response from GET /one_c_exchange/servers. */
export type OneCExchangeServersResponse = components['schemas']['OneCExchangeServersResultSchema'];

/** One DMC server entry from GET /one_c_exchange/servers. */
export type OneCExchangeServer = NonNullable<OneCExchangeServersResponse['servers']>[number];

/** WMS (Efko) exchange singleton settings (GET). */
export type WmsEfkoSettings = components['schemas']['WmsEfkoSettingsData'];

/** WMS (Efko) line filter mode. */
export type WmsEfkoLineFilterMode = WmsEfkoSettings['line_filter_mode'];

/** WMS (Efko) exchange PUT payload (`mssql_password` optional). */
export type WmsEfkoSettingsPayload = components['schemas']['UpdateWmsEfkoSettingsPayload'];