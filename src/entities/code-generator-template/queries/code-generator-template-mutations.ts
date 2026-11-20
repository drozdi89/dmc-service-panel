import { useIdempotentMutation } from '@/shared/hooks/useIdempotentMutation';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { CODE_GENERATOR_TEMPLATES_PATH } from '../api/api';
import type { CodeGeneratorTemplate } from '../model/types';
import { codeGeneratorTemplateQueries } from './code-generator-template-queries';

export type CodeGeneratorTemplateMutationHandlers = {
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
  onDeleteSuccess?: () => void;
  onDeleteError?: (error: Error) => void;
};

/**
 * Create / update / delete mutations for code generator templates (React Query only).
 */
export function useCodeGeneratorTemplateMutations(
  handlers?: CodeGeneratorTemplateMutationHandlers,
) {
  const queryClient = useQueryClient();

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: codeGeneratorTemplateQueries.keys.all(),
    });
  }, [queryClient]);

  const saveMutation = useIdempotentMutation<CodeGeneratorTemplate>({
    onSuccess: () => {
      invalidate();
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
      invalidate();
      handlers?.onDeleteSuccess?.();
    },
    onError: (error) => {
      handlers?.onDeleteError?.(
        error instanceof Error ? error : new Error(String(error)),
      );
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

  return {
    saveMutation,
    deleteMutation,
    handleSubmit,
  };
}