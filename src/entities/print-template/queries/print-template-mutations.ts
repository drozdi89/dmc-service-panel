import { useIdempotentMutation } from '@/shared/hooks/useIdempotentMutation';
import { useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useCallback } from 'react';
import { type PrintTemplate } from '../model/types';
import { printTemplateQueries } from './print-template-queries';

/**
 * Create / update / delete mutations for print templates.
 *
 * On success invalidates {@link printTemplateQueries.keys.all()} so list and
 * lookup (`['print-templates', 'lookup', …]`) refresh after save.
 */
export const printTemplateMutations = ({
  callbackSave,
  callbackDelete,
}: {
  callbackSave?: () => void;
  callbackDelete?: () => void;
} = {}) => {
  const queryClient = useQueryClient();
  const { message, modal } = App.useApp();

  const invalidatePrintTemplates = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: printTemplateQueries.keys.all(),
    });
  }, [queryClient]);

  const saveMutation = useIdempotentMutation<PrintTemplate>({
    onSuccess: () => {
      invalidatePrintTemplates();
      message.success('Шаблон сохранён');
      callbackSave?.();
    },
    onError: (error) => {
      message.error(error.message || 'Не удалось сохранить шаблон');
    },
  });

  const deleteMutation = useIdempotentMutation<string>({
    onSuccess: () => {
      invalidatePrintTemplates();
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
        saveMutation.mutate({
          path: '/api/v2/print_templates/',
          method: 'POST',
          body: {
            name: values.name,
            template: values.template,
          },
        });
        return;
      }

      saveMutation.mutate({
        path: `/api/v2/print_templates/${values.id}`,
        method: 'PATCH',
        body: {
          name: values.name,
          template: values.template,
        },
      });
    },
    [saveMutation],
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
    /** Invalidates list + lookup under `printTemplateQueries.keys.all()`. */
    invalidatePrintTemplates,
  };
};
