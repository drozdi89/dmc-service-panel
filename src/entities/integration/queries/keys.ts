/**
 * Root prefix for all integration React Query keys.
 * Invalidate with `{ queryKey: INTEGRATIONS_QUERY_ROOT }` to clear the whole group.
 */
export const INTEGRATIONS_QUERY_ROOT = ['integrations'] as const;

/** CRPT organizations entry (list / lookup / detail scopes appended by factory). */
export const CRPT_ORGS_QUERY_KEY = [
  ...INTEGRATIONS_QUERY_ROOT,
  'crpt-organizations',
] as const;

/** Server activation (allowed CRPT org count). */
export const SERVER_ACTIVATION_QUERY_KEY = [
  ...INTEGRATIONS_QUERY_ROOT,
  'server-activation',
] as const;

/** DataMark credentials. */
export const DATAMARK_QUERY_KEY = [...INTEGRATIONS_QUERY_ROOT, 'datamark'] as const;

/** Utrace settings. */
export const UTRACE_QUERY_KEY = [...INTEGRATIONS_QUERY_ROOT, 'utrace'] as const;

/** Autoorder options. */
export const AUTOORDER_QUERY_KEY = [...INTEGRATIONS_QUERY_ROOT, 'autoorder'] as const;

/** Autosend settings. */
export const AUTOSEND_QUERY_KEY = [...INTEGRATIONS_QUERY_ROOT, 'autosend'] as const;

/**
 * Products list used by autosend drawer (fetch lives in integration-service).
 * Key only — hook stays outside entity until product queries migrate.
 */
export const AUTOSEND_PRODUCTS_QUERY_KEY = [
  ...INTEGRATIONS_QUERY_ROOT,
  'autosend-products',
] as const;

/**
 * Products list used by CRPT templates drawer (fetch lives in integration-service).
 * Key only — hook stays outside entity until product queries migrate.
 */
export const CRPT_TEMPLATES_QUERY_KEY = [
  ...INTEGRATIONS_QUERY_ROOT,
  'crpt-templates',
] as const;

/** Composite line + options rows for task-type configuration. */
export const LINE_TASK_TYPES_QUERY_KEY = [
  ...INTEGRATIONS_QUERY_ROOT,
  'line-task-types',
] as const;

/** 1C Alife exchange singleton settings. */
export const ONE_C_EXCHANGE_QUERY_KEY = [
  ...INTEGRATIONS_QUERY_ROOT,
  'one-c-exchange',
] as const;

/** WMS (Efko) exchange singleton settings. */
export const WMS_EFKO_QUERY_KEY = [...INTEGRATIONS_QUERY_ROOT, 'wms-efko'] as const;

/**
 * Single line runtime options.
 *
 * @param lineid - Production line id.
 */
export function lineOptionsQueryKey(lineid: number): readonly ['integrations', 'line-options', number] {
  return [...INTEGRATIONS_QUERY_ROOT, 'line-options', lineid] as const;
}
