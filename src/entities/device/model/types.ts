import type { components } from '@/shared/api';
import type { ListQueryParams } from '@/shared/types/listQuery';

/** Row returned by the unified devices list endpoint. */
export type DeviceListItem = components['schemas']['DeviceListItem'];

/** Unified device type keys used by GET /api/v2/devices/. */
export type DeviceType = DeviceListItem['device_type'];

/** Lightweight device reference after create/edit (ResourcePicker-ready). */
export interface DeviceRef {
  device_type: DeviceType;
  id: number;
  name: string;
}

/** List query parameters for unified devices endpoint. */
export interface DevicesListParams extends ListQueryParams {
  types?: DeviceType[];
}
