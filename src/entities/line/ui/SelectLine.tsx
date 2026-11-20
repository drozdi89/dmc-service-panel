import { AsyncLookupSelect, type AsyncLookupSelectProps } from '@/shared/ui/AsyncLookupSelect';
import { fetchLinesLookup } from '../api/api';
import type { LineListItem } from '../model/types';
import { lineQueries } from '../queries';

/**
 * Server-searchable select of production lines (`AsyncLookupSelect`).
 *
 * Uses canonical query keys from {@link lineQueries} (`['lines', 'lookup', …]`).
 * Fetcher is {@link fetchLinesLookup} (list alias until `/lines/lookup` exists).
 */
export function SelectLine(
  props: Omit<AsyncLookupSelectProps<LineListItem>, 'queryKey' | 'fetchFn' | 'mapOption'>,
) {
  return (
    <AsyncLookupSelect<LineListItem>
      queryKey={lineQueries.keys.all()}
      fetchFn={fetchLinesLookup}
      mapOption={(item) => ({ value: item.lineid, label: item.linename })}
      {...props}
    />
  );
}
