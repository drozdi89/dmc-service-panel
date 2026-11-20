import { App } from 'antd';
import { useCallback } from 'react';
import type { LineListItem } from '../model/types';
import { lineListFactory } from '../queries/line-mutations';

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

  const createMutation = lineListFactory.useCreateMutation({
    onSuccess: () => {
      message.success('Линия сохранена');
      callbackSave?.();
    },
    onError: (error) => {
      message.error(error.message || 'Не удалось сохранить линию');
    },
  });

  const updateMutation = lineListFactory.useUpdateMutation({
    onSuccess: () => {
      message.success('Линия сохранена');
      callbackSave?.();
    },
    onError: (error) => {
      message.error(error.message || 'Не удалось сохранить линию');
    },
  });

  const deleteMutation = lineListFactory.useDeleteMutation({
    onSuccess: () => {
      message.success('Линия удалена');
      callbackDelete?.();
    },
    onError: (error) => {
      message.error(error.message || 'Не удалось удалить линию');
    },
  });

  const handleSubmit = useCallback(
    (values: Partial<LineListItem>) => {
      if (!values.lineid) {
        createMutation.mutate(values);
        return;
      }

      updateMutation.mutate({ id: values.lineid, ...values });
    },
    [createMutation, updateMutation],
  );

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
          await deleteMutation.mutateAsync(record.lineid);
        },
      });
    },
    [deleteMutation, modal],
  );

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    handleSubmit,
    handleDelete,
  };
}