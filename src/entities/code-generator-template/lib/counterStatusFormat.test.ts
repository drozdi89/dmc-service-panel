import { describe, expect, it } from 'vitest';
import { formatSingleCounterStatus, russianRowCountLabel } from './counterStatusFormat';

describe('counterStatusFormat', () => {
  it('formats unused counter', () => {
    expect(
      formatSingleCounterStatus(
        { name: 'serial', width: 6, key_fields: [], min: 1, max: 0 },
        undefined,
      ),
    ).toBe('не начинали (1–999999)');
  });

  it('formats active series', () => {
    expect(
      formatSingleCounterStatus(
        { name: 'serial', width: 6, key_fields: [], min: 1, max: 0 },
        { name: 'serial', series: 42, min: 1, max: 999999, row_count: 2 },
      ),
    ).toContain('000042');
  });

  it('pluralizes row count', () => {
    expect(russianRowCountLabel(21)).toBe('21 ряд');
  });
});