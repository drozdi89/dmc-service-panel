import { App } from 'antd';
import { useCallback } from 'react';
import type { DeviceFormValues } from '../model/deviceFormMapping';
import type { DeviceListItem, DeviceRef } from '../model/types';
import {
  persistDeviceFormValues,
  useDeleteDeviceMutation,
  useSaveDeviceMutation,
} from '../queries';

export interface UseDeviceActionsOptions {
  /**
   * Host: show «Устройство сохранено» when `dialog.consumerId` is null.
   * Nested ResourcePicker saves stay silent.
   */
  showSuccessMessage?: boolean;
  callbackSave?: () => void;
  callbackDelete?: () => void;
}

/**
 * Device save (modal / picker) and list delete with toasts and confirmation.
 */
export function useDeviceActions({
  showSuccessMessage = false,
  callbackSave,
  callbackDelete,
}: UseDeviceActionsOptions = {}) {
  const { message, modal } = App.useApp();

  const saveMutation = useSaveDeviceMutation({
    onSuccess: () => {
      if (showSuccessMessage) {
        message.success('Устройство сохранено');
      }
      callbackSave?.();
    },
    onError: (error) => {
      message.error(
        error.message || 'Не удалось сохранить устройство',
      );
    },
  });

  const deleteMutation = useDeleteDeviceMutation({
    onSuccess: () => {
      message.success('Устройство удалено');
      callbackDelete?.();
    },
    onError: (error) => {
      message.error(error.message || 'Ошибка удаления');
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
          await deleteMutation.mutateAsync(record);
        },
      });
    },
    [deleteMutation, modal],
  );

  return {
    saveDevice,
    isPending: saveMutation.isPending,
    saveMutation,
    deleteMutation,
    handleDelete,
  };
}