import type { ListQueryParams } from '@/shared/types/listQuery';

/** Unified device type keys used by GET /api/v2/devices/. */
export type DeviceType = 'camera' | 'printer' | 'scale' | 'controller' | 'divider';

/** Row returned by the unified devices list endpoint. */
export interface DeviceListItem {
  device_type: DeviceType;
  id: number;
  name: string;
  host?: string | null;
  port?: number | string | null;
}

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
