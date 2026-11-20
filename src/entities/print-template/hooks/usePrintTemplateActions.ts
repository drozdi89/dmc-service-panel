import { App } from 'antd';
import { useCallback } from 'react';
import { type PrintTemplate } from '../model/types';
import { usePrintTemplateMutations } from '../queries/print-template-mutations';

/**
 * Print template save/delete with toasts and delete confirmation.
 */
export function usePrintTemplateActions({
  callbackSave,
  callbackDelete,
}: {
  callbackSave?: () => void;
  callbackDelete?: () => void;
} = {}) {
  const { message, modal } = App.useApp();

  const { saveMutation, deleteMutation, handleSubmit, invalidatePrintTemplates } =
    usePrintTemplateMutations({
      onSaveSuccess: () => {
        message.success('Шаблон сохранён');
        callbackSave?.();
      },
      onSaveError: (error) => {
        message.error(error.message || 'Не удалось сохранить шаблон');
      },
      onDeleteSuccess: () => {
        message.success('Шаблон удалён');
        callbackDelete?.();
      },
      onDeleteError: (error) => {
        message.error(error.message || 'Не удалось удалить шаблон');
      },
    });

  const handleDelete = useCallback(
    (record: PrintTemplate) => {
      modal.confirm({
        title: 'Удалить шаблон?',
        content: `Шаблон «${record.name}» будет удалён без возможности восстановления.`,
        okText: 'Удалить',
        okType: 'danger',
        cancelText: 'Отмена',
        okButtonProps: { loading: deleteMutation.isPending },
        onOk: async () => {
          await deleteMutation.mutateAsync({
            path: '/api/v2/print_templates/',
            method: 'DELETE',
            body: { id_print_templates: [record.id] },
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
    invalidatePrintTemplates,
  };
}