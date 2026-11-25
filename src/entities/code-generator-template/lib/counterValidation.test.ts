import { describe, expect, it } from 'vitest';
import {
  counterRangeCeiling,
  isCounterNameValidForCollect,
  isCounterRowFilledWithoutName,
  normalizeCounterConfig,
} from './counterValidation';

describe('counterValidation', () => {
  it('rejects digit-only counter names', () => {
    expect(isCounterNameValidForCollect('123')).toBe(false);
    expect(isCounterNameValidForCollect('serial')).toBe(true);
  });

  it('computes range ceiling from width', () => {
    expect(counterRangeCeiling(6)).toBe(999_999);
  });

  it('detects filled row without name', () => {
    expect(
      isCounterRowFilledWithoutName({
        name: '',
        width: 8,
        key_fields: [],
        min: 1,
        max: 0,
      }),
    ).toBe(true);
  });

  it('normalizes width bounds', () => {
    expect(
      normalizeCounterConfig([
        {
          name: 'serial',
          width: 99,
          key_fields: ['gtin', 'gtin'],
          min: 1,
          max: 0,
        },
      ]),
    ).toEqual([
      {
        name: 'serial',
        width: 18,
        key_fields: ['gtin'],
        min: 1,
        max: 0,
      },
    ]);
  });
});