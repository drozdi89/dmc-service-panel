import { describe, expect, it } from 'vitest';
import { FACTORY_QUERY_SCOPES } from '@/shared/lib/factory-query';
import {
  LINE_QUERY_ENTRY,
  lineAllowPrintedDmQueryOptions,
  lineConfigurationQueryOptions,
  linePrintedDmRawQueryOptions,
  lineQueries,
  lineSettingsQueryKeys,
} from './line-queries';

describe('line query keys', () => {
  it('uses stable entry and factory scopes for list / lookup / detail', () => {
    const params = { size: 50, number: 0, q: 'line' };

    expect(LINE_QUERY_ENTRY).toEqual(['lines']);
    expect(lineQueries.keys.all()).toEqual(['lines']);
    expect(lineQueries.keys.list()).toEqual(['lines', FACTORY_QUERY_SCOPES.list]);
    expect(lineQueries.keys.list(params)).toEqual([
      'lines',
      FACTORY_QUERY_SCOPES.list,
      params,
    ]);
    expect(lineQueries.keys.lookup()).toEqual(['lines', FACTORY_QUERY_SCOPES.lookup]);
    expect(lineQueries.keys.lookup(params)).toEqual([
      'lines',
      FACTORY_QUERY_SCOPES.lookup,
      params,
    ]);
    expect(lineQueries.keys.detail(7)).toEqual([
      'lines',
      FACTORY_QUERY_SCOPES.detail,
      7,
    ]);
  });

  it('builds configuration and settings query options under lines entry', () => {
    expect(lineConfigurationQueryOptions(3).queryKey).toEqual([
      'lines',
      FACTORY_QUERY_SCOPES.detail,
      3,
    ]);
    expect(lineSettingsQueryKeys.allowPrintedDm(3)).toEqual([
      'lines',
      'allow-printed-dm',
      3,
    ]);
    expect(lineAllowPrintedDmQueryOptions(3).queryKey).toEqual([
      'lines',
      'allow-printed-dm',
      3,
    ]);
    expect(lineSettingsQueryKeys.printedDmRaw()).toEqual(['lines', 'printed-dm-raw']);
    expect(linePrintedDmRawQueryOptions().queryKey).toEqual([
      'lines',
      'printed-dm-raw',
    ]);
  });
});
