import { describe, expect, it } from 'vitest';
import { FACTORY_QUERY_SCOPES } from '@/shared/queries';
import {
  PRINT_STATION_QUERY_ENTRY,
  printStationQueries,
} from './print-station-queries';

describe('printStationQueries keys', () => {
  it('uses entry print-stations with list / lookup / detail scopes', () => {
    const params = { size: 20, number: 0, q: 'line' };

    expect(PRINT_STATION_QUERY_ENTRY).toEqual(['print-stations']);
    expect(printStationQueries.keys.all()).toEqual([...PRINT_STATION_QUERY_ENTRY]);
    expect(printStationQueries.keys.list()).toEqual([
      'print-stations',
      FACTORY_QUERY_SCOPES.list,
    ]);
    expect(printStationQueries.keys.list(params)).toEqual([
      'print-stations',
      FACTORY_QUERY_SCOPES.list,
      params,
    ]);
    expect(printStationQueries.keys.lookup()).toEqual([
      'print-stations',
      FACTORY_QUERY_SCOPES.lookup,
    ]);
    expect(printStationQueries.keys.lookup(params)).toEqual([
      'print-stations',
      FACTORY_QUERY_SCOPES.lookup,
      params,
    ]);
    expect(printStationQueries.keys.detail(7)).toEqual([
      'print-stations',
      FACTORY_QUERY_SCOPES.detail,
      7,
    ]);
  });

  it('exposes CRUD mutation hooks on the merged API', () => {
    expect(typeof printStationQueries.useCreateMutation).toBe('function');
    expect(typeof printStationQueries.useUpdateMutation).toBe('function');
    expect(typeof printStationQueries.useDeleteMutation).toBe('function');
  });
});
