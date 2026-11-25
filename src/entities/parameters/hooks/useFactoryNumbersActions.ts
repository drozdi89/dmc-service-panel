import { App } from 'antd';
import { useCallback } from 'react';
import { PARAMETERS_MESSAGES } from '../model/messages';
import type { FactoryNumberRow } from '../model/types';
import { factoryNumbersQueries } from '../queries';

/** Options for {@link useFactoryNumbersActions}. */
export interface UseFactoryNumbersActionsOptions {
  /** Called after a successful create or update (e.g. close the modal). */
  onSaved?: () => void;
}

/**
 * Factory numbers create / update / delete with toasts.
 */
export function useFactoryNumbersActions({ onSaved }: UseFactoryNumbersActionsOptions = {}) {
  const { message } = App.useApp();
  const texts = PARAMETERS_MESSAGES.factoryNumbers;

  const createMutation = factoryNumbersQueries.useCreateMutation({
    onSuccess: () => {
      message.success(texts.created);
      onSaved?.();
    },
    onError: (error) => message.error(error.message || texts.saveFailed),
  });

  const updateMutation = factoryNumbersQueries.useUpdateMutation({
    onSuccess: () => {
      message.success(texts.updated);
      onSaved?.();
    },
    onError: (error) => message.error(error.message || texts.saveFailed),
  });

  const deleteMutation = factoryNumbersQueries.useDeleteMutation({
    onSuccess: () => {
      message.success(texts.deleted);
    },
    onError: (error) => message.error(error.message || texts.deleteFailed),
  });

  const { mutate: create } = createMutation;
  const { mutate: update } = updateMutation;
  const { mutate: remove } = deleteMutation;

  const save = useCallback(
    (values: FactoryNumberRow, editingId: number | null) => {
      if (editingId !== null) {
        update({ ...values, id: editingId });
      } else {
        create(values);
      }
    },
    [create, update],
  );

  const deleteRow = useCallback((row: FactoryNumberRow) => remove(row.id), [remove]);

  return {
    save,
    deleteRow,
    isSaving: createMutation.isPending || updateMutation.isPending,
    deletingId: deleteMutation.isPending ? deleteMutation.variables : null,
  };
}
