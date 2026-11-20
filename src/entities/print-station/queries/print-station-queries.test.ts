import { describe, expect, it } from 'vitest';
import { FACTORY_QUERY_SCOPES } from '@/shared/lib/factory-query';
import { printStationQueries } from './print-station-queries';

describe('printStationQueries keys', () => {
  it('uses entry print-stations with list / lookup / detail scopes', () => {
    const params = { size: 20, number: 0, q: 'line' };

    expect(printStationQueries.keys.all()).toEqual(['print-stations']);
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
});
