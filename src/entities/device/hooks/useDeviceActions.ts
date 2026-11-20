import { App } from 'antd';
import { useCallback } from 'react';
import type { DeviceListItem } from '../model/types';
import {
  persistDeviceFormValues,
  useDeleteDeviceMutation,
  useSaveDeviceMutation,
} from '../queries/device-mutations';
import type { DeviceFormValues } from '../model/deviceFormMapping';

/**
 * Device list page actions: save/delete with toasts and delete confirmation.
 */
export function useDeviceActions({
  callbackSave,
  callbackDelete,
}: {
  callbackSave?: () => void;
  callbackDelete?: () => void;
} = {}) {
  const { message, modal } = App.useApp();

  const saveMutation = useSaveDeviceMutation({
    onSuccess: () => {
      message.success('Устройство сохранено');
      callbackSave?.();
    },
    onError: (error) => {
      message.error(error.message || 'Ошибка сохранения');
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
          await deleteMutation.mutateAsync(record);
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
}