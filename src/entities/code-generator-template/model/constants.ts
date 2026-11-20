import type { CounterSpec, CounterSpecType } from './types';

/** Ordered counter type values for Select options (Desktop `_COUNTER_TYPES`). */
export const COUNTER_SPEC_TYPES: readonly CounterSpecType[] = [
  'sscc_level',
  'gln_sscc',
  'date_serial',
  'task_pack',
  'none',
] as const;

/**
 * Display labels for counter types.
 * Desktop uses raw type strings in the combo; labels match those values.
 */
export const COUNTER_TYPE_LABELS: Record<CounterSpecType, string> = {
  sscc_level: 'sscc_level',
  gln_sscc: 'gln_sscc',
  date_serial: 'date_serial',
  task_pack: 'task_pack',
  none: 'none',
};

export const COUNTER_TYPE_OPTIONS = COUNTER_SPEC_TYPES.map((value) => ({
  value,
  label: COUNTER_TYPE_LABELS[value],
}));

/**
 * Default counter row values (Desktop `_counter_row_values(None)`).
 */
export const DEFAULT_COUNTER_ROW: CounterSpec = {
  name: '',
  type: 'sscc_level',
  key_template: '',
  format: '',
  level_from: 'aggregation_level',
  initial_value: 0,
};
