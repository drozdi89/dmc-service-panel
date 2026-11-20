import { useServerListQuery } from '@/shared/hooks/useServerListQuery';
import {
  factoryQuery,
  type FactoryDetailQueryHookOptions,
  type FactoryListQueryHookOptions,
  type FactoryQueryOptionsResult,
} from '@/shared/queries';
import type { PaginatedResponse } from '@/shared/types/listQuery';
import {
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  fetchDeviceDetail,
  fetchDevicesList,
  fetchDevicesLookup,
  fetchScalesLookup,
  type ScalesLookupParams,
} from '../api/api';
import type { DeviceDetail } from '../model/deviceFormMapping';
import type { DeviceListItem, DeviceType, DevicesListParams } from '../model/types';

/**
 * Canonical TanStack Query entry for the device entity.
 *
 * Keys:
 * - all / invalidate: `['devices']`
 * - list: `['devices', 'list', params?]`
 * - lookup: `['devices', 'lookup', params?]`
 * - detail: `['device-detail', type, id]` (composite type+id; legacy consumer shape)
 * - scales lookup: `['devices', 'scales', 'lookup', params?]`
 *   (Select/Picker pass {@link DEVICE_SCALES_PREFIX}; factory appends `'lookup'`)
 */
export const DEVICE_QUERY_ENTRY = ['devices'] as const;

/**
 * List / lookup helpers via {@link factoryQuery}.
 * Detail and scales use dedicated keys/hooks (composite id / scale filters).
 */
export const deviceQueries = factoryQuery<
  DeviceListItem,
  DevicesListParams,
  number
>({
  entry: DEVICE_QUERY_ENTRY,
  fetchList: fetchDevicesList,
  fetchLookup: fetchDevicesLookup,
});

/**
 * Builds the canonical device detail query key.
 *
 * @param deviceType - Device type segment.
 * @param id - Device primary key.
 */
export function deviceDetailQueryKey(
  deviceType: DeviceType,
  id: number,
): readonly ['device-detail', DeviceType, number] {
  return ['device-detail', deviceType, id];
}

/**
 * Query options for a typed device detail read.
 *
 * @param deviceType - Device type.
 * @param id - Device id.
 */
export function deviceDetailQueryOptions(
  deviceType: DeviceType,
  id: number,
): FactoryQueryOptionsResult<DeviceDetail> {
  return {
    queryKey: deviceDetailQueryKey(deviceType, id),
    queryFn: ({ signal }) => fetchDeviceDetail(deviceType, id, signal),
  };
}

/**
 * Loads a single device by type and id.
 *
 * @param deviceType - Device type (or `null`/`undefined` when disabled).
 * @param id - Device id (or `null`/`undefined` when disabled).
 * @param options - TanStack options (without fixed key/fn).
 */
export function useDeviceDetailQuery<TSelected = DeviceDetail>(
  deviceType: DeviceType | null | undefined,
  id: number | null | undefined,
  options?: FactoryDetailQueryHookOptions<DeviceDetail, TSelected>,
): UseQueryResult<TSelected, Error> {
  const enabled =
    deviceType != null &&
    id != null &&
    (options?.enabled ?? true);

  return useQuery<DeviceDetail, Error, TSelected, readonly unknown[]>({
    queryKey:
      deviceType != null && id != null
        ? deviceDetailQueryKey(deviceType, id)
        : (['device-detail', 'idle'] as const),
    queryFn: ({ signal }) => fetchDeviceDetail(deviceType!, id!, signal),
    ...options,
    enabled,
  });
}

/**
 * Scales key prefix for AsyncLookupSelect / ResourcePicker (`'lookup'` appended by the factory).
 * Final cache key: `['devices', 'scales', 'lookup', params]`.
 */
export const DEVICE_SCALES_PREFIX = [...DEVICE_QUERY_ENTRY, 'scales'] as const;

/**
 * Full scales lookup prefix for hooks / `scalesLookupQueryKey`
 * (`useServerListQuery` appends `params` only).
 */
export const DEVICE_SCALES_LOOKUP_PREFIX = [
  ...DEVICE_SCALES_PREFIX,
  'lookup',
] as const;

/**
 * Builds scales lookup query key (include/exclude filters live in `params`).
 *
 * @param params - Optional lookup params (with scale type filters).
 */
export function scalesLookupQueryKey(
  params?: ScalesLookupParams,
): readonly unknown[] {
  return params === undefined
    ? DEVICE_SCALES_LOOKUP_PREFIX
    : [...DEVICE_SCALES_LOOKUP_PREFIX, params];
}

/**
 * Query options for scales lookup with optional ScaleType filters.
 *
 * @param params - Lookup params plus include/exclude scale types.
 */
export function scalesLookupQueryOptions(
  params: ScalesLookupParams,
): FactoryQueryOptionsResult<PaginatedResponse<DeviceListItem>> {
  return {
    queryKey: scalesLookupQueryKey(params),
    queryFn: () => fetchScalesLookup(params),
  };
}

/**
 * Scales lookup query (client-side type filters when requested).
 *
 * @param params - Lookup params plus optional scale type filters.
 * @param options - Enable flag for the underlying list query.
 */
export function useScalesLookupQuery(
  params: ScalesLookupParams,
  options?: FactoryListQueryHookOptions,
): UseQueryResult<PaginatedResponse<DeviceListItem>, Error> {
  return useServerListQuery<DeviceListItem>({
    queryKey: DEVICE_SCALES_LOOKUP_PREFIX,
    fetchFn: (listParams) => fetchScalesLookup(listParams as ScalesLookupParams),
    params,
    enabled: options?.enabled,
  });
}

/** @see deviceQueries.useListQuery */
export const useDevicesListQuery = deviceQueries.useListQuery;

/** @see deviceQueries.useLookupQuery */
export const useDevicesLookupQuery = deviceQueries.useLookupQuery;
