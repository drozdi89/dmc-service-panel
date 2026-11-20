import { App } from 'antd';
import { useCallback } from 'react';
import type { LineListItem } from '../model/types';
import { useLineMutations } from '../queries/line-mutations';

/**
 * Line list delete/save with toasts and delete confirmation.
 */
export function useLineActions({
  callbackSave,
  callbackDelete,
}: {
  callbackSave?: () => void;
  callbackDelete?: () => void;
} = {}) {
  const { message, modal } = App.useApp();

  const { saveMutation, deleteMutation, handleSubmit } = useLineMutations({
    onSaveSuccess: () => {
      message.success('Линия сохранена');
      callbackSave?.();
    },
    onSaveError: (error) => {
      message.error(error.message || 'Не удалось сохранить линию');
    },
    onDeleteSuccess: () => {
      message.success('Линия удалена');
      callbackDelete?.();
    },
    onDeleteError: (error) => {
      message.error(error.message || 'Не удалось удалить линию');
    },
  });

  const handleDelete = useCallback(
    (record: LineListItem) => {
      modal.confirm({
        title: 'Удалить линию?',
        content: `Линия «${record.linename}» будет удалена без возможности восстановления.`,
        okText: 'Удалить',
        okType: 'danger',
        cancelText: 'Отмена',
        okButtonProps: { loading: deleteMutation.isPending },
        onOk: async () => {
          await deleteMutation.mutateAsync({
            path: '/api/v2/lines/',
            method: 'DELETE',
            body: { id_lines: [record.lineid] },
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