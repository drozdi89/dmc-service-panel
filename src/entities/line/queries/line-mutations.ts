import { useIdempotentMutation } from '@/shared/hooks/useIdempotentMutation';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { type LineListItem } from '../model/types';
import { lineQueries } from './line-queries';

export type LineMutationHandlers = {
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
  onDeleteSuccess?: () => void;
  onDeleteError?: (error: Error) => void;
};

/**
 * Invalidates all line entity queries (list, lookup, detail, settings).
 */
export function invalidateLineQueries(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: lineQueries.keys.all() });
}

/**
 * List-row CRUD mutations for lines (React Query only).
 * Full editor save orchestration lives in `services/line-service`.
 */
export function useLineMutations(handlers?: LineMutationHandlers) {
  const queryClient = useQueryClient();

  const invalidate = useCallback(() => {
    void invalidateLineQueries(queryClient);
  }, [queryClient]);

  const saveMutation = useIdempotentMutation<LineListItem>({
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
    (values: Partial<LineListItem>) => {
      if (!values.lineid) {
        saveMutation.mutate({
          path: '/api/v2/lines/',
          method: 'POST',
          body: values,
        });
        return;
      }

      saveMutation.mutate({
        path: `/api/v2/lines/${values.lineid}`,
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