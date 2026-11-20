import {
  useIdempotentMutation,
  type IdempotentMutationVariables,
} from '@/shared/hooks/useIdempotentMutation';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { App } from 'antd';
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

/**
 * Invalidates device list / lookup (and scales lookup under the same entry)
 * via canonical {@link deviceQueries} keys, plus the detail prefix
 * `['device-detail', …]` so Edit → save → re-open does not hydrate from a stale cache.
 *
 * @param queryClient - TanStack Query client.
 */
export async function invalidateDeviceQueries(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: deviceQueries.keys.all() }),
    queryClient.invalidateQueries({ queryKey: ['device-detail'] }),
  ]);
}

/**
 * POST/PATCH device form values via type-specific paths and map the response to {@link DeviceRef}.
 *
 * Shared by Select+Add widgets and DevicesPage so create/edit paths stay aligned.
 *
 * @param mutateAsync - Idempotent API mutation executor.
 * @param values - Form values from DeviceFormModal.
 * @param editId - Explicit edit id (picker/list); falls back to `values.id` when omitted.
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
 * Nested picker/list save: POST/PATCH + invalidate lookup/list, returns {@link DeviceRef}.
 *
 * Success toast is off by default (inline create should not spam); errors are toasted.
 *
 * @param options.showSuccessMessage - When true, show «Устройство сохранено» after save.
 */
export function useDeviceFormSave(options?: { showSuccessMessage?: boolean }) {
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const showSuccessMessage = options?.showSuccessMessage ?? false;

  const saveMutation = useIdempotentMutation<DeviceDetail>({
    onSuccess: () => {
      void invalidateDeviceQueries(queryClient);
      if (showSuccessMessage) {
        message.success('Устройство сохранено');
      }
    },
    onError: (error) => {
      message.error(
        error instanceof Error ? error.message : 'Не удалось сохранить устройство',
      );
    },
  });

  const saveDevice = useCallback(
    async (values: DeviceFormValues, editId?: number): Promise<DeviceRef> => {
      return persistDeviceFormValues(
        (variables) => saveMutation.mutateAsync(variables),
        values,
        editId,
      );
    },
    [saveMutation],
  );

  return {
    saveDevice,
    isPending: saveMutation.isPending,
    saveMutation,
  };
}

/**
 * CRUD mutation helpers for devices (create / update / delete) with list+lookup invalidation.
 */
export const deviceMutations = ({
  callbackSave,
  callbackDelete,
}: {
  callbackSave?: () => void;
  callbackDelete?: () => void;
}) => {
  const queryClient = useQueryClient();
  const { message, modal } = App.useApp();

  const saveMutation = useIdempotentMutation<DeviceDetail>({
    onSuccess: () => {
      void invalidateDeviceQueries(queryClient);
      message.success('Устройство сохранено');
      callbackSave?.();
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : 'Ошибка сохранения');
    },
  });

  const deleteMutation = useIdempotentMutation({
    onSuccess: () => {
      void invalidateDeviceQueries(queryClient);
      message.success('Устройство удалено');
      callbackDelete?.();
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : 'Ошибка удаления');
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

  const handleDelete = useCallback(
    (record: DeviceListItem) => {
      modal.confirm({
        title: 'Удалить выбранное устройство?',
        content: `Устройство «${record.name}» будет удалено.`,
        okText: 'Удалить',
        okType: 'danger',
        cancelText: 'Отмена',
        okButtonProps: { loading: deleteMutation.isPending },
        onOk: async () => {
          await deleteMutation.mutateAsync({
            path: getDeviceCollectionPath(record.device_type),
            method: 'DELETE',
            body: getDeviceDeleteBody(record.device_type, record.id),
          });
        },
      });
    },
    [deleteMutation, modal],
  );

  return {
    saveMutation,
    deleteMutation,
    handleSubmit,
    handleDelete,
  };
};
