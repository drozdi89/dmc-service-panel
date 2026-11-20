import { App } from 'antd';
import { useCallback } from 'react';
import { type PrintStation } from '../model/types';
import { printStationQueries } from '../queries';

/**
 * Print station save/delete with toasts and delete confirmation.
 */
export function usePrintStationActions({
  callbackSave,
  callbackDelete,
}: {
  callbackSave?: () => void;
  callbackDelete?: () => void;
} = {}) {
  const { message, modal } = App.useApp();

  const createMutation = printStationQueries.useCreateMutation({
    onSuccess: () => {
      message.success('Станция печати сохранена');
      callbackSave?.();
    },
    onError: (error) => {
      message.error(error.message || 'Не удалось сохранить станцию печати');
    },
  });

  const updateMutation = printStationQueries.useUpdateMutation({
    onSuccess: () => {
      message.success('Станция печати сохранена');
      callbackSave?.();
    },
    onError: (error) => {
      message.error(error.message || 'Не удалось сохранить станцию печати');
    },
  });

  const deleteMutation = printStationQueries.useDeleteMutation({
    onSuccess: () => {
      message.success('Станция печати удалена');
      callbackDelete?.();
    },
    onError: (error) => {
      message.error(error.message || 'Не удалось удалить станцию печати');
    },
  });

  const handleDelete = useCallback(
    (record: PrintStation) => {
      modal.confirm({
        title: 'Удалить выбранную станцию печати?',
        content: `Станция «${record.name}» будет удалена.`,
        okText: 'Удалить',
        okType: 'danger',
        cancelText: 'Отмена',
        okButtonProps: { loading: deleteMutation.isPending },
        onOk: async () => {
          await deleteMutation.mutateAsync(record.station_id);
        },
      });
    },
    [deleteMutation, modal],
  );

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    handleDelete,
    isSavePending: createMutation.isPending || updateMutation.isPending,
  };
}