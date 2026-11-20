/**
 * Integration entity TanStack Query hooks and stable keys.
 *
 * Grouped by domain files (`crpt`, `datamark`, …); import only via `@/entities/integration`.
 */

export {
  AUTOORDER_QUERY_KEY,
  AUTOSEND_PRODUCTS_QUERY_KEY,
  AUTOSEND_QUERY_KEY,
  CRPT_ORGS_QUERY_KEY,
  CRPT_TEMPLATES_QUERY_KEY,
  DATAMARK_QUERY_KEY,
  INTEGRATIONS_QUERY_ROOT,
  LINE_TASK_TYPES_QUERY_KEY,
  ONE_C_EXCHANGE_QUERY_KEY,
  SERVER_ACTIVATION_QUERY_KEY,
  UTRACE_QUERY_KEY,
  WMS_EFKO_QUERY_KEY,
  lineOptionsQueryKey,
} from './keys';

export {
  autoorderQueryOptions,
  useAutoorderOptionsQuery,
  type AutoorderOptionsQueryOptions,
} from './autoorder';

export {
  autosendQueryOptions,
  useAutosendSettingsQuery,
  type AutosendSettingsQueryOptions,
} from './autosend';

export {
  crptOrganizationsQueries,
  serverActivationQueryOptions,
  useCrptOrganizationsListQuery,
  useServerActivationQuery,
  type ServerActivationQueryOptions,
} from './crpt';

export {
  datamarkQueryOptions,
  useDataMarkCredentialsQuery,
  type DataMarkCredentialsQueryOptions,
} from './datamark';

export {
  fetchLineTaskTypeRows,
  lineOptionsQueryOptions,
  lineTaskTypesQueryOptions,
  useLineOptionsQuery,
  useLineTaskTypesQuery,
  type LineOptionsQueryOptions,
  type LineTaskTypesQueryOptions,
} from './line-task-type';

export {
  utraceQueryOptions,
  useUtraceSettingsQuery,
  type UtraceSettingsQueryOptions,
} from './utrace';

export {
  oneCExchangeQueryOptions,
  useOneCExchangeSettingsQuery,
  type OneCExchangeSettingsQueryOptions,
} from './one-c-exchange';

export {
  wmsEfkoQueryOptions,
  useWmsEfkoSettingsQuery,
  type WmsEfkoSettingsQueryOptions,
} from './wms-efko';
