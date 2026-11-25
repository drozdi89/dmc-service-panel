import { invalidateLineQueries, type LineEditorFormState } from '@/entities/line';
import { createIdempotencyKey } from '@/shared/api';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { saveLineConfiguration, type LineSaveResult } from './lineSaveOrchestration';

/** Variables for {@link useSaveLineConfigurationMutation}. */
export interface SaveLineConfigurationVariables {
  state: LineEditorFormState;
  /** Undefined for create. */
  lineId: number | undefined;
  /** Persisted aggregation levels removed in the editor. */
  deletedAggregationLevelIds: number[];
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
    mutationFn: ({
      state,
      lineId,
      deletedAggregationLevelIds,
      printedDmRaw,
    }: SaveLineConfigurationVariables) =>
      saveLineConfiguration(
        state,
        { existingLineId: lineId, deletedAggregationLevelIds, printedDmRaw },
        createIdempotencyKey(),
      ),
    onSuccess: () => {
      void invalidateLineQueries(queryClient);
    },
  });
}
