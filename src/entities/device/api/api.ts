import type { components } from '@/shared/api';
import { apiRequestData, fetchPaginatedList } from '@/shared/api';
import type { ListQueryParams, PaginatedResponse } from '@/shared/types/listQuery';
import type { DeviceDetail } from '../model/deviceFormMapping';
import type { DeviceListItem, DeviceType, DevicesListParams } from '../model/types';

/** Scale row from GET /api/v2/scales/. */
export type ScaleListItem = components['schemas']['GetScalesSchema'];

/** Lookup parameters for scales with optional type filters (client-side). */
export interface ScalesLookupParams extends ListQueryParams {
  scaleTypes?: number[];
  excludeScaleTypes?: number[];
}

const SCALES_LIST_PATH = '/api/v2/scales/';

const DEVICES_LIST_PATH = '/api/v2/devices/';
const DEVICES_LOOKUP_PATH = '/api/v2/devices/lookup';

/** API path and id field config per device type. */
const DEVICE_ENDPOINTS: Record<
  DeviceType,
  { collection: string; idParam: string; deleteBodyKey: string }
> = {
  camera: {
    collection: '/api/v2/cameras/',
    idParam: 'id_camera',
    deleteBodyKey: 'id_cameras',
  },
  printer: {
    collection: '/api/v2/printers/',
    idParam: 'id_printer',
    deleteBodyKey: 'id_printers',
  },
  scale: {
    collection: '/api/v2/scales/',
    idParam: 'id_scales',
    deleteBodyKey: 'id_scales',
  },
  controller: {
    collection: '/api/v2/controllers/',
    idParam: 'id_controller',
    deleteBodyKey: 'id_controllers',
  },
  divider: {
    collection: '/api/v2/divider/',
    idParam: 'id_divider',
    deleteBodyKey: 'id_dividers',
  },
};

/**
 * Fetches the unified paginated devices list.
 *
 * @param params - List query with optional type filters.
 */
export async function fetchDevicesList(
  params: DevicesListParams,
): Promise<PaginatedResponse<DeviceListItem>> {
  const { types, ...listParams } = params;
  const queryParams: Record<string, string | number | boolean | (string | number)[] | undefined> =
    {
      ...listParams,
    };

  if (types && types.length > 0) {
    queryParams.types = types;
  }

  return apiRequestData<PaginatedResponse<DeviceListItem>>(DEVICES_LIST_PATH, {
    params: queryParams,
  });
}

/**
 * Lookup-select fetcher for devices (`GET /api/v2/devices/lookup`).
 *
 * @param params - Lookup list parameters with optional `types` filter.
 */
export async function fetchDevicesLookup(
  params: DevicesListParams,
): Promise<PaginatedResponse<DeviceListItem>> {
  const { types, ...listParams } = params;
  const queryParams: Record<string, string | number | boolean | (string | number)[] | undefined> =
    {
      ...listParams,
      size: listParams.size ?? 20,
    };

  if (types && types.length > 0) {
    queryParams.types = types;
  }

  return apiRequestData<PaginatedResponse<DeviceListItem>>(DEVICES_LOOKUP_PATH, {
    params: queryParams,
  });
}

/** Maps scale list row to unified device list item. */
function mapScaleToDeviceItem(scale: ScaleListItem): DeviceListItem {
  return {
    device_type: 'scale',
    id: scale.id,
    name: scale.name,
  };
}

/** Applies client-side scale type include/exclude filters. */
function filterScalesByType(
  scales: ScaleListItem[],
  scaleTypes?: number[],
  excludeScaleTypes?: number[],
): ScaleListItem[] {
  let filtered = scales;
  if (scaleTypes && scaleTypes.length > 0) {
    filtered = filtered.filter((scale) => scaleTypes.includes(scale.type));
  }
  if (excludeScaleTypes && excludeScaleTypes.length > 0) {
    filtered = filtered.filter((scale) => !excludeScaleTypes.includes(scale.type));
  }
  return filtered;
}

/**
 * Fetches all scale pages for client-side type filtering.
 *
 * @param listParams - Shared list query (search, sort).
 */
async function fetchAllScales(listParams: ListQueryParams): Promise<ScaleListItem[]> {
  const pageSize = 100;
  const first = await fetchPaginatedList<ScaleListItem>(SCALES_LIST_PATH, {
    ...listParams,
    number: 0,
    size: pageSize,
  });

  const allScales = [...first.response];
  if (first.total_records > pageSize) {
    const pageCount = Math.ceil(first.total_records / pageSize);
    const rest = await Promise.all(
      Array.from({ length: pageCount - 1 }, (_, index) =>
        fetchPaginatedList<ScaleListItem>(SCALES_LIST_PATH, {
          ...listParams,
          number: index + 1,
          size: pageSize,
        }),
      ),
    );
    for (const page of rest) {
      allScales.push(...page.response);
    }
  }

  return allScales;
}

/**
 * Lookup-select fetcher for scales with optional ScaleType filters.
 *
 * Server list has no type filter — matching types are applied client-side after fetch.
 * When type filters are active, all server pages are loaded before filtering.
 *
 * @param params - Lookup list parameters plus optional include/exclude scale types.
 */
export async function fetchScalesLookup(
  params: ScalesLookupParams,
): Promise<PaginatedResponse<DeviceListItem>> {
  const { scaleTypes, excludeScaleTypes, ...listParams } = params;
  const pageSize = listParams.size ?? 20;
  const pageNumber = listParams.number ?? 0;
  const hasTypeFilter =
    (scaleTypes?.length ?? 0) > 0 || (excludeScaleTypes?.length ?? 0) > 0;

  if (!hasTypeFilter) {
    const page = await fetchPaginatedList<ScaleListItem>(SCALES_LIST_PATH, {
      ...listParams,
      number: pageNumber,
      size: pageSize,
    });
    return {
      ...page,
      response: page.response.map(mapScaleToDeviceItem),
    };
  }

  const allScales = await fetchAllScales(listParams);
  const filtered = filterScalesByType(allScales, scaleTypes, excludeScaleTypes);
  const start = pageNumber * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  return {
    page: pageNumber,
    next_page: start + pageSize < filtered.length ? pageNumber + 1 : pageNumber,
    previous_page: pageNumber > 0 ? pageNumber - 1 : 0,
    size: pageSize,
    total_records: filtered.length,
    response: pageItems.map(mapScaleToDeviceItem),
  };
}

/**
 * Fetches a single device record by type and id.
 *
 * @param deviceType - Device type.
 * @param id - Device id.
 * @param signal - Optional abort signal to cancel an in-flight request.
 */
export async function fetchDeviceDetail(
  deviceType: DeviceType,
  id: number,
  signal?: AbortSignal,
): Promise<DeviceDetail> {
  const { collection } = DEVICE_ENDPOINTS[deviceType];
  const base = collection.replace(/\/$/, '');
  return apiRequestData<DeviceDetail>(`${base}/${id}`, { signal });
}

/**
 * Returns REST collection path for a device type.
 *
 * @param deviceType - Device type.
 */
export function getDeviceCollectionPath(deviceType: DeviceType): string {
  return DEVICE_ENDPOINTS[deviceType].collection;
}

/**
 * Returns REST item path for a device type and id.
 *
 * @param deviceType - Device type.
 * @param id - Device id.
 */
export function getDeviceItemPath(deviceType: DeviceType, id: number): string {
  const { collection } = DEVICE_ENDPOINTS[deviceType];
  return `${collection.replace(/\/$/, '')}/${id}`;
}

/**
 * Returns DELETE request body for a device type.
 *
 * @param deviceType - Device type.
 * @param id - Device id.
 */
export function getDeviceDeleteBody(
  deviceType: DeviceType,
  id: number,
): Record<string, number[]> {
  const { deleteBodyKey } = DEVICE_ENDPOINTS[deviceType];
  return { [deleteBodyKey]: [id] };
}

/** Re-export for list tables that use the shared fetchPaginatedList helper. */
export { fetchPaginatedList };
