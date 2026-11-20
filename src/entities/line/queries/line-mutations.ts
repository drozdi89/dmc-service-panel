import { useIdempotentMutation } from '@/shared/hooks/useIdempotentMutation';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useCallback } from 'react';
import { type LineListItem } from '../model/types';
import { lineQueries } from './line-queries';

/**
 * Invalidates all line entity queries (list, lookup, detail, settings).
 *
 * @param queryClient - TanStack Query client.
 */
export function invalidateLineQueries(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: lineQueries.keys.all() });
}

/**
 * CRUD mutation helpers for production lines (delete + simple list-row save).
 * Full editor save orchestration lives in `services/line-service`.
 */
export const lineMutations = ({
  callbackSave,
  callbackDelete,
}: {
  callbackSave?: () => void;
  callbackDelete?: () => void;
} = {}) => {
  const queryClient = useQueryClient();
  const { message, modal } = App.useApp();

  const saveMutation = useIdempotentMutation<LineListItem>({
    onSuccess: () => {
      void invalidateLineQueries(queryClient);
      message.success('Линия сохранена');
      callbackSave?.();
    },
    onError: (error) => {
      message.error(error.message || 'Не удалось сохранить линию');
    },
  });

  const deleteMutation = useIdempotentMutation<string>({
    onSuccess: () => {
      void invalidateLineQueries(queryClient);
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
          await deleteMutation.mutateAsync({
            path: '/api/v2/lines/',
            method: 'DELETE',
            body: { id_lines: [record.lineid] },
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
