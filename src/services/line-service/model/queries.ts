import { invalidateLineQueries, type LineEditorFormState } from '@/entities/line';
import { createIdempotencyKey } from '@/shared/api';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import {
  createLineSaveMutator,
  saveLineConfiguration,
  type LineSaveResult,
} from './lineSaveOrchestration';

/** Variables for {@link useSaveLineConfigurationMutation}. */
export interface SaveLineConfigurationVariables {
  state: LineEditorFormState;
  /** Undefined for create. */
  lineId: number | undefined;
  /** Current `line_printed_dm_use` JSON string. */
  printedDmRaw: string | null;
}

/**
 * Runs the full line save chain and invalidates line queries on success,
 * even if the caller dialog was closed while the chain was in flight.
 */
export function useSaveLineConfigurationMutation(): UseMutationResult<
  LineSaveResult,
  Error,
  SaveLineConfigurationVariables
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ state, lineId, printedDmRaw }: SaveLineConfigurationVariables) =>
      saveLineConfiguration(
        state,
        lineId,
        printedDmRaw,
        createLineSaveMutator(createIdempotencyKey()),
      ),
    onSuccess: () => {
      void invalidateLineQueries(queryClient);
    },
  });
}
