import { App } from 'antd';
import { useCallback } from 'react';
import type { CodeGeneratorTemplate } from '../model/types';
import { codeGeneratorTemplateQueries } from '../queries';

/**
 * Code generator template save/delete with toasts and delete confirmation.
 */
export function useCodeGeneratorTemplateActions({
  callbackSave,
  callbackDelete,
}: {
  callbackSave?: () => void;
  callbackDelete?: () => void;
} = {}) {
  const { message, modal } = App.useApp();

  const createMutation = codeGeneratorTemplateQueries.useCreateMutation({
    onSuccess: () => {
      message.success('Шаблон сохранён');
      callbackSave?.();
    },
    onError: (error) => {
      message.error(error.message || 'Не удалось сохранить шаблон');
    },
  });

  const updateMutation = codeGeneratorTemplateQueries.useUpdateMutation({
    onSuccess: () => {
      message.success('Шаблон сохранён');
      callbackSave?.();
    },
    onError: (error) => {
      message.error(error.message || 'Не удалось сохранить шаблон');
    },
  });

  const deleteMutation = codeGeneratorTemplateQueries.useDeleteMutation({
    onSuccess: () => {
      message.success('Шаблон удалён');
      callbackDelete?.();
    },
    onError: (error) => {
      message.error(error.message || 'Не удалось удалить шаблон');
    },
  });

  const handleSubmit = useCallback(
    (values: Partial<CodeGeneratorTemplate>) => {
      if (!values.id) {
        createMutation.mutate(values);
        return;
      }

      updateMutation.mutate({ id: values.id, ...values });
    },
    [createMutation, updateMutation],
  );

  const guardEditable = useCallback(
    (record: CodeGeneratorTemplate, action: 'edit' | 'delete'): boolean => {
      if (!record.is_system) {
        return true;
      }
      message.warning(
        action === 'edit'
          ? 'Системный шаблон нельзя изменить'
          : 'Системный шаблон нельзя удалить',
      );
      return false;
    },
    [message],
  );

  const handleDelete = useCallback(
    (record: CodeGeneratorTemplate) => {
      if (!guardEditable(record, 'delete')) {
        return;
      }
      modal.confirm({
        title: 'Удалить шаблон?',
        content: `Шаблон «${record.name}» будет удалён без возможности восстановления.`,
        okText: 'Удалить',
        okType: 'danger',
        cancelText: 'Отмена',
        okButtonProps: { loading: deleteMutation.isPending },
        onOk: () => {
          void deleteMutation.mutateAsync(record.id);
        },
      });
    },
    [deleteMutation, guardEditable, modal],
  );

  const handleEdit = useCallback(
    (record: CodeGeneratorTemplate, openEdit: (id: CodeGeneratorTemplate['id']) => void) => {
      if (guardEditable(record, 'edit')) {
        openEdit(record.id);
      }
    },
    [guardEditable],
  );

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    handleSubmit,
    handleEdit,
    handleDelete,
    isSavePending: createMutation.isPending || updateMutation.isPending,
  };
}