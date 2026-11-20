import { createIdempotencyKey } from '@/shared/api';
import { useInvalidatingMutation, type EntityMutationOptions } from '@/shared/queries';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
  createDevice,
  deleteDevice,
  updateDevice,
} from '../api/api';
import {
  mapDeviceDetailToRef,
  mapFormValuesToPayload,
  type DeviceDetail,
  type DeviceFormValues,
} from '../model/deviceFormMapping';
import { type DeviceListItem, type DeviceRef } from '../model/types';
import { deviceQueries } from './device-queries';

/**
 * Invalidates device list / lookup and detail prefix `['device-detail', …]`.
 */
export async function invalidateDeviceQueries(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: deviceQueries.keys.all() }),
    queryClient.invalidateQueries({ queryKey: ['device-detail'] }),
  ]);
}

const DEVICE_DETAIL_QUERY_KEY = ['device-detail'] as const;

/** Saves device form values (create or update). */
export function useSaveDeviceMutation(
  options?: EntityMutationOptions<
    DeviceDetail,
    { values: DeviceFormValues; editId?: number }
  >,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [deviceQueries.keys.all(), DEVICE_DETAIL_QUERY_KEY],
    mutationFn: ({ values, editId }) => {
      const type = values.device_type;
      const payload = mapFormValuesToPayload(values);
      const resolvedEditId = editId ?? values.id;
      const key = createIdempotencyKey();
      if (resolvedEditId !== undefined) {
        return updateDevice(type, resolvedEditId, payload, key);
      }
      return createDevice(type, payload, key);
    },
  });
}

/** Deletes a device list row. */
export function useDeleteDeviceMutation(
  options?: EntityMutationOptions<string, DeviceListItem>,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [deviceQueries.keys.all(), DEVICE_DETAIL_QUERY_KEY],
    mutationFn: (record) =>
      deleteDevice(record.device_type, record.id, createIdempotencyKey()),
  });
}

/**
 * POST/PATCH device form values and map the response to {@link DeviceRef}.
 */
export async function persistDeviceFormValues(
  save: (variables: { values: DeviceFormValues; editId?: number }) => Promise<DeviceDetail>,
  values: DeviceFormValues,
  editId?: number,
): Promise<DeviceRef> {
  const detail = await save({ values, editId });
  const type = values.device_type;
  const ref = mapDeviceDetailToRef(type, detail);
  return { device_type: type, id: ref.id, name: ref.name };
}
