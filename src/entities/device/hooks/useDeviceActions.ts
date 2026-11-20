import { App } from 'antd';
import { useCallback } from 'react';
import { getDeviceCollectionPath, getDeviceDeleteBody } from '../api/api';
import type { DeviceListItem } from '../model/types';
import { useDeviceMutations } from '../queries/device-mutations';

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

  const { saveMutation, deleteMutation, handleSubmit } = useDeviceMutations({
    onSaveSuccess: () => {
      message.success('Устройство сохранено');
      callbackSave?.();
    },
    onSaveError: (error) => {
      message.error(error.message || 'Ошибка сохранения');
    },
    onDeleteSuccess: () => {
      message.success('Устройство удалено');
      callbackDelete?.();
    },
    onDeleteError: (error) => {
      message.error(error.message || 'Ошибка удаления');
    },
  });

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
}