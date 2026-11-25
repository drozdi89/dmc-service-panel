import { describe, expect, it } from 'vitest';
import type { MactLicenceInfo } from '../model/types';
import { filterUnboundLicences } from './availableLicences';

function licence(pin: string, clientId?: string | null): MactLicenceInfo {
  return {
    pin,
    client_id: clientId,
    is_active: true,
    valid_until: '2027-01-01',
    lic_type: 'DMC',
    valid_days: 365,
  };
}

describe('filterUnboundLicences', () => {
  it('drops a licence that has client_id', () => {
    const result = filterUnboundLicences([licence('A', 'client-1'), licence('B')], []);
    expect(result.map((item) => item.pin)).toEqual(['B']);
  });

  it('drops a licence whose pin is registered to a client', () => {
    const result = filterUnboundLicences(
      [licence('A'), licence('B')],
      [{ licence_key: 'A' }, { licence_key: null }, {}],
    );
    expect(result.map((item) => item.pin)).toEqual(['B']);
  });

  it('keeps free licences in the original order', () => {
    const result = filterUnboundLicences(
      [licence('C'), licence('A', ''), licence('B', null)],
      [{ licence_key: 'X' }],
    );
    expect(result.map((item) => item.pin)).toEqual(['C', 'A', 'B']);
  });

  it('handles empty inputs', () => {
    expect(filterUnboundLicences([], [{ licence_key: 'A' }])).toEqual([]);
    expect(filterUnboundLicences([licence('A')], [])).toHaveLength(1);
  });
});
