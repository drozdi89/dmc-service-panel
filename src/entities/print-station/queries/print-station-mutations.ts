import { useIdempotentMutation } from '@/shared/hooks/useIdempotentMutation';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { type PrintStation } from '../model/types';
import { printStationQueries } from './print-station-queries';

export type PrintStationMutationHandlers = {
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
  onDeleteSuccess?: () => void;
  onDeleteError?: (error: Error) => void;
};

/**
 * Create / update / delete mutations for print stations (React Query only).
 *
 * On success invalidates {@link printStationQueries.keys.all()}.
 */
export function usePrintStationMutations(handlers?: PrintStationMutationHandlers) {
  const queryClient = useQueryClient();

  const invalidatePrintStations = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: printStationQueries.keys.all(),
    });
  }, [queryClient]);

  const saveMutation = useIdempotentMutation<PrintStation>({
    onSuccess: () => {
      invalidatePrintStations();
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
      invalidatePrintStations();
      handlers?.onDeleteSuccess?.();
    },
    onError: (error) => {
      handlers?.onDeleteError?.(
        error instanceof Error ? error : new Error(String(error)),
      );
    },
  });

  return {
    saveMutation,
    deleteMutation,
    /** Invalidates list + lookup under `printStationQueries.keys.all()`. */
    invalidatePrintStations,
  };
}