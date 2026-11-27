import { describe, expect, it } from 'vitest';
import { prepareSave } from './counterConfigPayload';

describe('prepareSave', () => {
  it('normalizes named counters to CounterSpecSchema', () => {
    expect(
      prepareSave([
        {
          name: 'serial',
          width: 8,
          key_fields: ['taskid'],
          min: 5,
          max: 0,
        },
      ]),
    ).toEqual([
      {
        name: 'serial',
        width: 8,
        key_fields: ['taskid'],
        min: 5,
        max: 0,
      },
    ]);
  });

  it('drops unnamed rows', () => {
    expect(
      prepareSave([
        { name: '', width: 6, key_fields: [], min: 1, max: 0 },
        { name: 's', width: 6, key_fields: [], min: 1, max: 0 },
      ]),
    ).toEqual([{ name: 's', width: 6, key_fields: [], min: 1, max: 0 }]);
  });
});