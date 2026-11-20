import { App } from 'antd';
import { useCallback } from 'react';
import type { DeviceFormValues } from '../model/deviceFormMapping';
import { persistDeviceFormValues, useDeviceMutations } from '../queries/device-mutations';
import type { DeviceRef } from '../model/types';

/**
 * Nested picker/list save: POST/PATCH + invalidate lookup/list, returns {@link DeviceRef}.
 *
 * @param options.showSuccessMessage - When true, show «Устройство сохранено» after save.
 */
export function useDeviceFormSave(options?: { showSuccessMessage?: boolean }) {
  const { message } = App.useApp();
  const showSuccessMessage = options?.showSuccessMessage ?? false;

  const { saveMutation } = useDeviceMutations({
    onSaveSuccess: () => {
      if (showSuccessMessage) {
        message.success('Устройство сохранено');
      }
    },
    onSaveError: (error) => {
      message.error(
        error.message || 'Не удалось сохранить устройство',
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