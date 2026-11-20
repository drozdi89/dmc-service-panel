import { useMemo } from 'react';
import {
  AsyncLookupSelect,
  type AsyncLookupSelectProps,
} from '@/shared/ui/AsyncLookupSelect';
import { fetchDevicesLookup } from '../api/api';
import type { DeviceListItem, DeviceType } from '../model/types';
import { deviceQueries } from '../queries';

/** Props for {@link SelectDevice} (lookup-only device select). */
export interface SelectDeviceProps
  extends Omit<
    AsyncLookupSelectProps<DeviceListItem>,
    'queryKey' | 'fetchFn' | 'mapOption'
  > {
  /** Restrict lookup to these device types (server `types` filter). */
  types?: DeviceType[];
}

/**
 * Server-searchable device select (`AsyncLookupSelect`) — select-only pattern.
 *
 * No Create/Edit chrome. For Select+Add with Host modal, use
 * {@link DeviceResourcePicker} + AppProviders-mounted `DeviceFormModalHost`.
 *
 * Uses canonical keys from {@link deviceQueries} (`['devices', 'lookup', …]`).
 * Pass `types` to filter by device type (e.g. `['printer']`) — merged into
 * `extraParams` so the cache key matches `useDevicesLookupQuery`.
 */
export function SelectDevice({
  types,
  extraParams,
  ...props
}: SelectDeviceProps) {
  const mergedExtraParams = useMemo(
    () => ({
      ...extraParams,
      ...(types && types.length > 0 ? { types } : {}),
    }),
    [extraParams, types],
  );

  return (
    <AsyncLookupSelect<DeviceListItem>
      queryKey={deviceQueries.keys.all()}
      fetchFn={fetchDevicesLookup}
      mapOption={(item) => ({ value: item.id, label: item.name })}
      extraParams={mergedExtraParams}
      {...props}
    />
  );
}
