/**
 * @deprecated Mutations live next to domain query modules. Import from
 * `datamark`, `utrace`, `crpt`, `autoorder`, `autosend`, `one-c-exchange`,
 * `wms-efko`, or `line-task-type` (still re-exported here for compatibility).
 */
export {
  useSaveDataMarkCredentialsMutation,
  useDeleteDataMarkCredentialsMutation,
  type SaveDataMarkCredentialsVariables,
} from './datamark';
export {
  useSaveUtraceSettingsMutation,
  useDeleteUtraceSettingsMutation,
  type SaveUtraceSettingsVariables,
} from './utrace';
export { useSaveAutoorderOptionsMutation } from './autoorder';
export { useSaveAutosendSettingsMutation } from './autosend';
export {
  useSaveOneCExchangeSettingsMutation,
  useRefreshOneCExchangeServersMutation,
} from './one-c-exchange';
export {
  useSaveWmsEfkoSettingsMutation,
  useTestWmsEfkoConnectionMutation,
} from './wms-efko';
export {
  useSaveCrptOrganizationMutation,
  useDeleteCrptOrganizationMutation,
  type SaveCrptOrganizationResult,
  type SaveCrptOrganizationVariables,
} from './crpt';
export { useSaveLineTaskTypesMutation } from './line-task-type';