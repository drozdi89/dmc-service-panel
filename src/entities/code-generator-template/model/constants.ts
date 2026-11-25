import type { CounterSpecSchema } from './types';

/** Frequent series key fields (Qt `template_editor._FREQUENT_KEY_FIELDS`). */
export const FREQUENT_COUNTER_KEY_FIELDS: readonly { name: string; label: string }[] = [
  { name: 'gtin', label: 'GTIN' },
  { name: 'pack_gtin', label: 'GTIN упаковки' },
  { name: 'mandate_11', label: 'Дата пр-ва' },
  { name: 'stock_number', label: 'Партия' },
  { name: 'taskid', label: 'Задание' },
  { name: 'aggregation_level', label: 'Уровень' },
  { name: 'org_gln', label: 'GLN орг.' },
  { name: 'task_expdate_17', label: 'Срок годн.' },
] as const;

/** Default empty counter card (Qt `CounterCardWidget` spinbox defaults). */
export const DEFAULT_COUNTER_ROW: CounterSpecSchema = {
  name: '',
  width: 6,
  key_fields: [],
  min: 1,
  max: 0,
};

/** Min/max width per OpenAPI / Qt spinbox. */
export const COUNTER_WIDTH_MIN = 1;
export const COUNTER_WIDTH_MAX = 18;