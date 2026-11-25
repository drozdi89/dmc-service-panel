import {
  COUNTER_WIDTH_MAX,
  COUNTER_WIDTH_MIN,
  DEFAULT_COUNTER_ROW,
} from '../model/constants';
import type { CounterSpecSchema } from '../model/types';

const QSPINBOX_INT_MAX = 2_147_483_647;

/** Russian error when counter name is digits-only (Qt `counter_name_digit_only_field_error`). */
export const COUNTER_NAME_DIGIT_ONLY_ERROR =
  'Имя счётчика не должно состоять только из цифр';

/**
 * Whether a non-empty counter name may be saved (`template_editor.counter_name_valid_for_collect`).
 *
 * @param name - Counter placeholder name without braces.
 */
export function isCounterNameValidForCollect(name: string): boolean {
  const stripped = name.trim();
  return Boolean(stripped) && !/^\d+$/.test(stripped);
}

/**
 * Inclusive max ceiling for min/max spinboxes at a given width (Qt `_counter_range_ceiling`).
 *
 * @param width - Digit count 1–18.
 */
export function counterRangeCeiling(width: number): number {
  const w = Math.max(COUNTER_WIDTH_MIN, Math.min(COUNTER_WIDTH_MAX, Math.trunc(width)));
  const theoretical = 10 ** w - 1;
  return Math.min(theoretical, QSPINBOX_INT_MAX);
}

/**
 * Whether a row has editable content without a valid name (empty-name validation).
 *
 * @param row - Counter row from the form.
 */
export function isCounterRowFilledWithoutName(row: CounterSpecSchema): boolean {
  const name = (row.name ?? '').trim();
  if (name) {
    return false;
  }
  const defaults = DEFAULT_COUNTER_ROW;
  const width = row.width ?? defaults.width;
  const min = row.min ?? defaults.min;
  const max = row.max ?? defaults.max;
  const keyFields = row.key_fields ?? [];
  return (
    width !== defaults.width ||
    min !== defaults.min ||
    max !== defaults.max ||
    keyFields.length > 0
  );
}

/**
 * Normalizes one counter row for save / API.
 *
 * @param row - Form counter row.
 */
export function normalizeCounterRow(row: CounterSpecSchema): CounterSpecSchema | null {
  const name = (row.name ?? '').trim();
  if (!name) {
    return null;
  }
  const widthRaw = row.width ?? DEFAULT_COUNTER_ROW.width;
  const width = Math.min(
    COUNTER_WIDTH_MAX,
    Math.max(COUNTER_WIDTH_MIN, Math.trunc(widthRaw)),
  );
  const ceiling = counterRangeCeiling(width);
  const min = Math.min(
    ceiling,
    Math.max(0, Math.trunc(row.min ?? DEFAULT_COUNTER_ROW.min)),
  );
  const maxRaw = row.max ?? DEFAULT_COUNTER_ROW.max;
  const max =
    maxRaw === 0
      ? 0
      : Math.min(ceiling, Math.max(0, Math.trunc(maxRaw)));
  const key_fields = [...new Set((row.key_fields ?? []).map((k) => k.trim()).filter(Boolean))];
  return { name, width, key_fields, min, max };
}

/**
 * Drops unnamed rows and returns API-ready counter_config.
 *
 * @param rows - Form counter rows.
 */
export function normalizeCounterConfig(
  rows: CounterSpecSchema[] | undefined,
): CounterSpecSchema[] {
  const result: CounterSpecSchema[] = [];
  for (const row of rows ?? []) {
    const normalized = normalizeCounterRow(row);
    if (normalized) {
      result.push(normalized);
    }
  }
  return result;
}