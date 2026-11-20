import { useIdempotentMutation } from '@/shared/hooks/useIdempotentMutation';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { type PrintTemplate } from '../model/types';
import { printTemplateQueries } from './print-template-queries';

export type PrintTemplateMutationHandlers = {
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
  onDeleteSuccess?: () => void;
  onDeleteError?: (error: Error) => void;
};

/**
 * Create / update / delete mutations for print templates (React Query only).
 */
export function usePrintTemplateMutations(handlers?: PrintTemplateMutationHandlers) {
  const queryClient = useQueryClient();

  const invalidatePrintTemplates = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: printTemplateQueries.keys.all(),
    });
  }, [queryClient]);

  const saveMutation = useIdempotentMutation<PrintTemplate>({
    onSuccess: () => {
      invalidatePrintTemplates();
      handlers?.onSaveSuccess?.();
    },
    onError: (error) => {
      handlers?.onSaveError?.(
        error instanceof Error ? error : new Error(String(error)),
      );
    },
  });

  const deleteMutation = useIdempotentMutation<string>({
    onSuccess: () => {
      invalidatePrintTemplates();
      handlers?.onDeleteSuccess?.();
    },
    onError: (error) => {
      handlers?.onDeleteError?.(
        error instanceof Error ? error : new Error(String(error)),
      );
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

  return {
    saveMutation,
    deleteMutation,
    handleSubmit,
    /** Invalidates list + lookup under `printTemplateQueries.keys.all()`. */
    invalidatePrintTemplates,
  };
}