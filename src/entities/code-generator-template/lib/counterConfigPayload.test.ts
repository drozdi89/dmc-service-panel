import { describe, expect, it } from 'vitest';
import {
  counterConfigToApiPayload,
  counterRowToApiSpec,
  mapApiCounterRowToForm,
  widthFromLegacyFormat,
} from './counterConfigPayload';

describe('counterConfigPayload', () => {
  it('parses width from legacy format', () => {
    expect(widthFromLegacyFormat('06d')).toBe(6);
    expect(widthFromLegacyFormat('')).toBe(6);
  });

  it('keeps API width from detail when user saves without counter edits', () => {
    expect(
      counterRowToApiSpec({
        name: 'serial',
        type: 'sscc_level',
        key_template: '',
        format: '06d',
        level_from: 'aggregation_level',
        initial_value: 0,
        width: 8,
        key_fields: ['task_id'],
        min: 1,
        max: 0,
      }),
    ).toEqual({
      name: 'serial',
      width: 8,
      key_fields: ['task_id'],
      min: 1,
      max: 0,
    });
  });

  it('maps legacy rows without width to CounterSpecSchema', () => {
    expect(
      counterConfigToApiPayload([
        {
          name: 'serial',
          type: 'task_pack',
          key_template: 'task_id',
          format: '08d',
          level_from: 'aggregation_level',
          initial_value: 5,
        },
      ]),
    ).toEqual([
      {
        name: 'serial',
        width: 8,
        key_fields: ['task_id'],
        min: 5,
        max: 0,
      },
    ]);
  });

  it('hydrates legacy form fields from API counter shape', () => {
    expect(
      mapApiCounterRowToForm({
        name: 'sscc_seq',
        width: 6,
        key_fields: ['gln', 'task_id'],
        min: 1,
        max: 0,
        type: 'sscc_level',
        key_template: '',
        format: '',
        level_from: 'aggregation_level',
        initial_value: 0,
      }),
    ).toMatchObject({
      name: 'sscc_seq',
      format: '06d',
      key_template: 'gln, task_id',
      initial_value: 1,
      width: 6,
    });
  });
});