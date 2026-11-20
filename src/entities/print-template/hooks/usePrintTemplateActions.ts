import { App } from 'antd';
import { useCallback } from 'react';
import { type PrintTemplate } from '../model/types';
import { printTemplateFactory } from '../queries/print-template-mutations';

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

  const createMutation = printTemplateFactory.useCreateMutation({
    onSuccess: () => {
      message.success('Шаблон сохранён');
      callbackSave?.();
    },
    onError: (error) => {
      message.error(error.message || 'Не удалось сохранить шаблон');
    },
  });

  const updateMutation = printTemplateFactory.useUpdateMutation({
    onSuccess: () => {
      message.success('Шаблон сохранён');
      callbackSave?.();
    },
    onError: (error) => {
      message.error(error.message || 'Не удалось сохранить шаблон');
    },
  });

  const deleteMutation = printTemplateFactory.useDeleteMutation({
    onSuccess: () => {
      message.success('Шаблон удалён');
      callbackDelete?.();
    },
    onError: (error) => {
      message.error(error.message || 'Не удалось удалить шаблон');
    },
  });

  const handleSubmit = useCallback(
    (values: Partial<PrintTemplate> & { name: string; template: string }) => {
      if (!values.id) {
        createMutation.mutate({
          name: values.name,
          template: values.template,
        });
        return;
      }

      updateMutation.mutate({
        id: values.id,
        name: values.name,
        template: values.template,
      });
    },
    [createMutation, updateMutation],
  );

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
          await deleteMutation.mutateAsync(record.id);
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
    isSavePending: createMutation.isPending || updateMutation.isPending,
  };
}