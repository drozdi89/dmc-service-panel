import { App } from 'antd';
import { useCallback } from 'react';
import { type PrintStation } from '../model/types';
import { usePrintStationMutations } from '../queries/print-station-mutations';

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

  const { saveMutation, deleteMutation, invalidatePrintStations } = usePrintStationMutations({
    onSaveSuccess: () => {
      message.success('Станция печати сохранена');
      callbackSave?.();
    },
    onSaveError: (error) => {
      message.error(error.message || 'Не удалось сохранить станцию печати');
    },
    onDeleteSuccess: () => {
      message.success('Станция печати удалена');
      callbackDelete?.();
    },
    onDeleteError: (error) => {
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
          await deleteMutation.mutateAsync({
            path: '/api/v2/print_stations/',
            method: 'DELETE',
            body: { station_id: [record.station_id] },
          });
        },
      });
    },
    [deleteMutation, modal],
  );

  return {
    saveMutation,
    deleteMutation,
    handleDelete,
    invalidatePrintStations,
  };
}