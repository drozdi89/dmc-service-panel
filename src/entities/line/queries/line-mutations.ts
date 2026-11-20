import { createIdempotencyKey } from '@/shared/api';
import { factoryMutation } from '@/shared/queries';
import { createLine, deleteLines, updateLine } from '../api/api';
import type { LineListItem } from '../model/types';

/** Line list row with `id` for {@link factoryMutation} detail cache. */
export type LineListMutationItem = LineListItem & { id: number };

function withMutationId(row: LineListItem): LineListMutationItem {
  return { ...row, id: row.lineid };
}

/**
 * List-row CRUD mutations for lines.
 * Full editor save orchestration lives in `services/line-service`.
 */
export const lineListFactory = factoryMutation<LineListMutationItem, number>({
  entry: ['lines'] as const,
  fetchCreate: (data) =>
    createLine(data as Partial<LineListItem>, createIdempotencyKey()).then(withMutationId),
  fetchUpdate: (id, data) =>
    updateLine(id, data as Partial<LineListItem>, createIdempotencyKey()).then(withMutationId),
  fetchDelete: async (id) => {
    await deleteLines([id], createIdempotencyKey());
    return null;
  },
});

/** @deprecated Use {@link lineListFactory} / invalidate via factory onSuccess. */
export async function invalidateLineQueries(
  queryClient: import('@tanstack/react-query').QueryClient,
): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: lineListFactory.keys.all() });
}