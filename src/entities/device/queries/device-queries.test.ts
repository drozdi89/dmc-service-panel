import { describe, expect, it } from 'vitest';
import { FACTORY_QUERY_SCOPES } from '@/shared/queries';
import {
  DEVICE_QUERY_ENTRY,
  DEVICE_SCALES_LOOKUP_PREFIX,
  DEVICE_SCALES_PREFIX,
  deviceDetailQueryKey,
  deviceQueries,
  scalesLookupQueryKey,
} from './device-queries';

describe('deviceQueries keys', () => {
  it('uses entry devices with list / lookup scopes', () => {
    const params = { size: 20, number: 0, q: 'cam', types: ['camera'] as const };

    expect(deviceQueries.keys.all()).toEqual([...DEVICE_QUERY_ENTRY]);
    expect(deviceQueries.keys.list()).toEqual([
      ...DEVICE_QUERY_ENTRY,
      FACTORY_QUERY_SCOPES.list,
    ]);
    expect(deviceQueries.keys.list(params)).toEqual([
      ...DEVICE_QUERY_ENTRY,
      FACTORY_QUERY_SCOPES.list,
      params,
    ]);
    expect(deviceQueries.keys.lookup()).toEqual([
      ...DEVICE_QUERY_ENTRY,
      FACTORY_QUERY_SCOPES.lookup,
    ]);
    expect(deviceQueries.keys.lookup(params)).toEqual([
      ...DEVICE_QUERY_ENTRY,
      FACTORY_QUERY_SCOPES.lookup,
      params,
    ]);
  });

  it('uses composite device-detail key for typed detail', () => {
    expect(deviceDetailQueryKey('printer', 42)).toEqual([
      'device-detail',
      'printer',
      42,
    ]);
  });

  it('nests scales lookup under devices entry', () => {
    const params = { size: 20, number: 0, scaleTypes: [1, 6] };

    expect(DEVICE_SCALES_PREFIX).toEqual(['devices', 'scales']);
    expect(DEVICE_SCALES_LOOKUP_PREFIX).toEqual([
      ...DEVICE_SCALES_PREFIX,
      'lookup',
    ]);
    expect(scalesLookupQueryKey()).toEqual(DEVICE_SCALES_LOOKUP_PREFIX);
    expect(scalesLookupQueryKey(params)).toEqual([
      ...DEVICE_SCALES_LOOKUP_PREFIX,
      params,
    ]);
  });

  it('AsyncLookupSelect prefix + lookup matches factory / scales keys', () => {
    const deviceParams = {
      size: 20,
      number: 0,
      q: undefined,
      types: ['printer'] as const,
    };
    const scalesParams = {
      size: 20,
      number: 0,
      q: undefined,
      scaleTypes: [1],
    };

    expect([
      ...deviceQueries.keys.all(),
      FACTORY_QUERY_SCOPES.lookup,
      deviceParams,
    ]).toEqual(deviceQueries.keys.lookup(deviceParams));

    expect([
      ...DEVICE_SCALES_PREFIX,
      'lookup',
      scalesParams,
    ]).toEqual(scalesLookupQueryKey(scalesParams));
  });
});
