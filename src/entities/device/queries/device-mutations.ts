import {
  useIdempotentMutation,
  type IdempotentMutationVariables,
} from '@/shared/hooks/useIdempotentMutation';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { getDeviceCollectionPath, getDeviceDeleteBody, getDeviceItemPath } from '../api/api';
import {
  mapDeviceDetailToRef,
  mapFormValuesToPayload,
  type DeviceDetail,
  type DeviceFormValues,
} from '../model/deviceFormMapping';
import { type DeviceListItem, type DeviceRef } from '../model/types';
import { deviceQueries } from './device-queries';

export type DeviceMutationHandlers = {
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
  onDeleteSuccess?: () => void;
  onDeleteError?: (error: Error) => void;
};

/**
 * Invalidates device list / lookup (and scales lookup under the same entry)
 * via canonical {@link deviceQueries} keys, plus the detail prefix
 * `['device-detail', …]` so Edit → save → re-open does not hydrate from a stale cache.
 */
export async function invalidateDeviceQueries(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: deviceQueries.keys.all() }),
    queryClient.invalidateQueries({ queryKey: ['device-detail'] }),
  ]);
}

/**
 * POST/PATCH device form values via type-specific paths and map the response to {@link DeviceRef}.
 */
export async function persistDeviceFormValues(
  mutateAsync: (variables: IdempotentMutationVariables) => Promise<DeviceDetail>,
  values: DeviceFormValues,
  editId?: number,
): Promise<DeviceRef> {
  const type = values.device_type;
  const payload = mapFormValuesToPayload(values);
  const resolvedEditId = editId ?? values.id;

  const detail = await mutateAsync(
    resolvedEditId !== undefined
      ? {
          path: getDeviceItemPath(type, resolvedEditId),
          method: 'PATCH',
          body: payload,
        }
      : {
          path: getDeviceCollectionPath(type),
          method: 'POST',
          body: payload,
        },
  );

  const ref = mapDeviceDetailToRef(type, detail);
  return { device_type: type, id: ref.id, name: ref.name };
}

/**
 * Device create / update / delete mutations (React Query only).
 */
export function useDeviceMutations(handlers?: DeviceMutationHandlers) {
  const queryClient = useQueryClient();

  const invalidate = useCallback(() => {
    void invalidateDeviceQueries(queryClient);
  }, [queryClient]);

  const saveMutation = useIdempotentMutation<DeviceDetail>({
    onSuccess: () => {
      void invalidate();
      handlers?.onSaveSuccess?.();
    },
    onError: (error) => {
      handlers?.onSaveError?.(
        error instanceof Error ? error : new Error(String(error)),
      );
    },
  });

  const deleteMutation = useIdempotentMutation({
    onSuccess: () => {
      void invalidate();
      handlers?.onDeleteSuccess?.();
    },
    onError: (error) => {
      handlers?.onDeleteError?.(
        error instanceof Error ? error : new Error(String(error)),
      );
    },
  });

  const handleSubmit = useCallback(
    async (values: DeviceFormValues) => {
      await persistDeviceFormValues(
        (variables) => saveMutation.mutateAsync(variables),
        values,
      );
    },
    [saveMutation],
  );

  return {
    saveMutation,
    deleteMutation,
    handleSubmit,
  };
}