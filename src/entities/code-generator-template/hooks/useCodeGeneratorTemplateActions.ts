import { App } from 'antd';
import { useCallback } from 'react';
import { CODE_GENERATOR_TEMPLATES_PATH } from '../api/api';
import type { CodeGeneratorTemplate } from '../model/types';
import { useCodeGeneratorTemplateMutations } from '../queries/code-generator-template-mutations';

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

  const { saveMutation, deleteMutation, handleSubmit } = useCodeGeneratorTemplateMutations({
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
    (record: CodeGeneratorTemplate) => {
      modal.confirm({
        title: 'Удалить шаблон?',
        content: `Шаблон «${record.name}» будет удалён без возможности восстановления.`,
        okText: 'Удалить',
        okType: 'danger',
        cancelText: 'Отмена',
        okButtonProps: { loading: deleteMutation.isPending },
        onOk: () => {
          void deleteMutation.mutateAsync({
            path: CODE_GENERATOR_TEMPLATES_PATH,
            method: 'DELETE',
            body: { id_code_generator_templates: [record.id] },
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