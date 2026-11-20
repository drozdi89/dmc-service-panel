import { useIdempotentMutation } from '@/shared/hooks/useIdempotentMutation';
import { useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useCallback } from 'react';
import { CODE_GENERATOR_TEMPLATES_PATH } from '../api/api';
import type { CodeGeneratorTemplate } from '../model/types';
import { codeGeneratorTemplateQueries } from './code-generator-template-queries';

/**
 * Create / update / delete mutations for code generator templates.
 *
 * Invalidates `codeGeneratorTemplateQueries.keys.all()` on success.
 * API errors (including system-template delete) surface via `message.error`.
 */
export const codeGeneratorTemplateMutations = ({
  callbackSave,
  callbackDelete,
}: {
  callbackSave?: () => void;
  callbackDelete?: () => void;
}) => {
  const queryClient = useQueryClient();
  const { message, modal } = App.useApp();

  const saveMutation = useIdempotentMutation<CodeGeneratorTemplate>({
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: codeGeneratorTemplateQueries.keys.all(),
      });
      message.success('Шаблон сохранён');
      callbackSave?.();
    },
    onError: (error) => {
      message.error(error.message || 'Не удалось сохранить шаблон');
    },
  });

  const deleteMutation = useIdempotentMutation<string>({
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: codeGeneratorTemplateQueries.keys.all(),
      });
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
        saveMutation.mutate({
          path: CODE_GENERATOR_TEMPLATES_PATH,
          method: 'POST',
          body: values,
        });
        return;
      }

      saveMutation.mutate({
        path: `${CODE_GENERATOR_TEMPLATES_PATH}${values.id}`,
        method: 'PATCH',
        body: values,
      });
    },
    [saveMutation],
  );

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
};
