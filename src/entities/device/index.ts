export {
  fetchDeviceDetail, fetchDevicesList,
  fetchDevicesLookup, fetchScalesLookup,
  getDeviceCollectionPath, getDeviceDeleteBody, getDeviceItemPath, type ScaleListItem,
  type ScalesLookupParams
} from './api/api';
export {
  hostFormRule, scalePortFormRule, validateHost, validateScalePort, type HostValidationType
} from './lib/networkValidation';
export {
  ALL_DEVICE_TYPES, CONTROLLER_TYPE_OPTIONS, DEFAULT_DEVICE_PORTS,
  DEFAULT_SERIAL_SCALE_PORT,
  DEFAULT_TCP_SCALE_PORT, DEVICE_TYPE_CHIP_OPTIONS,
  DEVICE_TYPE_LABELS, DEVICE_TYPE_SELECT_OPTIONS, isSerialScale, PRINTER_TYPE_OPTIONS, SCALE_TYPE_CHECKWEIGHT_NEW, SCALE_TYPE_CHECKWEIR,
  SCALE_TYPE_MASSA_K_TERM_A, SCALE_TYPE_OPTIONS, SERIAL_SCALE_TYPES, TCP_SCALE_TYPES
} from './model/constants';
export {
  buildDividerPort, deviceRowKey,
  formatDeviceAddress,
  parseDividerPort, usesConnectionFields
} from './model/deviceAddress';
export {
  createDefaultFormValues,
  mapDeviceDetailToFormValues,
  mapDeviceDetailToRef,
  mapFormValuesToPayload,
  normalizeScalePortForSave, type CreateDefaultFormValuesOptions, type DeviceDetail, type DeviceFormValues
} from './model/deviceFormMapping';
export {
  discardDeviceFormForConsumer,
  isSameDeviceFormDialog,
  resetDeviceFormUiStore,
  useDeviceFormUiStore,
} from './model/deviceFormUiStore';
export type {
  DeviceFormDialog,
  DeviceFormDialogCreate,
  DeviceFormDialogEdit,
  DeviceFormDialogNone,
  DeviceFormOpenCreateOptions,
  DeviceFormOpenEditOptions,
  DeviceFormUiActions,
  DeviceFormUiDeviceType,
  DeviceFormUiState,
  DeviceFormUiStore,
} from './model/deviceFormUiStore';
export type {
  DeviceListItem,
  DeviceRef, DevicesListParams, DeviceType
} from './model/types';
export { useDeviceActions, useDeviceFormSave } from './hooks';
export {
  DEVICE_QUERY_ENTRY,
  DEVICE_SCALES_LOOKUP_PREFIX,
  DEVICE_SCALES_PREFIX,
  deviceDetailQueryKey,
  deviceDetailQueryOptions,
  deviceQueries,
  invalidateDeviceQueries,
  persistDeviceFormValues,
  scalesLookupQueryKey,
  scalesLookupQueryOptions,
  useDeviceDetailQuery,
  useDeviceMutations,
  useDevicesListQuery,
  useDevicesLookupQuery,
  useScalesLookupQuery,
  type DeviceMutationHandlers,
} from './queries';
export * from './ui';

