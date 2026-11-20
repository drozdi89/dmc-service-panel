import { AsyncLookupSelect, type AsyncLookupSelectProps } from '@/shared/ui/AsyncLookupSelect';
import { fetchPrintStationsLookup } from '../api/api';
import type { PrintStation } from '../model/types';
import { printStationQueries } from '../queries';

/**
 * Server-searchable select of print stations (`AsyncLookupSelect`).
 *
 * Uses canonical query keys from {@link printStationQueries} (`['print-stations', 'lookup', …]`).
 */
export function SelectPrintStation(
  props: Omit<AsyncLookupSelectProps<PrintStation>, 'queryKey' | 'fetchFn' | 'mapOption'>,
) {
  return (
    <AsyncLookupSelect<PrintStation>
      queryKey={printStationQueries.keys.all()}
      fetchFn={fetchPrintStationsLookup}
      mapOption={(item) => ({ value: item.station_id, label: item.name })}
      {...props}
    />
  );
}
