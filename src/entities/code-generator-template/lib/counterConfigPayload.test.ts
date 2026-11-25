import { describe, expect, it } from 'vitest';
import { counterConfigToApiPayload } from './counterConfigPayload';

describe('counterConfigToApiPayload', () => {
  it('normalizes named counters to CounterSpecSchema', () => {
    expect(
      counterConfigToApiPayload([
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
      counterConfigToApiPayload([
        { name: '', width: 6, key_fields: [], min: 1, max: 0 },
        { name: 's', width: 6, key_fields: [], min: 1, max: 0 },
      ]),
    ).toEqual([{ name: 's', width: 6, key_fields: [], min: 1, max: 0 }]);
  });
});