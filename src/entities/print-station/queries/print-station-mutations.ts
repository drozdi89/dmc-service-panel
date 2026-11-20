import { useIdempotentMutation } from '@/shared/hooks/useIdempotentMutation';
import { useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useCallback } from 'react';
import { type PrintStation } from '../model/types';
import { printStationQueries } from './print-station-queries';

/**
 * Create / update / delete mutations for print stations.
 *
 * On success invalidates {@link printStationQueries.keys.all()} so list and
 * lookup refresh after save.
 */
export const printStationMutations = ({
  callbackSave,
  callbackDelete,
}: {
  callbackSave?: () => void;
  callbackDelete?: () => void;
} = {}) => {
  const queryClient = useQueryClient();
  const { message, modal } = App.useApp();

  const invalidatePrintStations = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: printStationQueries.keys.all(),
    });
  }, [queryClient]);

  const saveMutation = useIdempotentMutation<PrintStation>({
    onSuccess: () => {
      invalidatePrintStations();
      message.success('Станция печати сохранена');
      callbackSave?.();
    },
    onError: (error) => {
      message.error(error.message || 'Не удалось сохранить станцию печати');
    },
  });

  const deleteMutation = useIdempotentMutation<string>({
    onSuccess: () => {
      invalidatePrintStations();
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
    /** Invalidates list + lookup under `printStationQueries.keys.all()`. */
    invalidatePrintStations,
  };
};
