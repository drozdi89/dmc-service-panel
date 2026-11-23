import type { components } from '@/shared/api';
import type { CounterSpec } from '../model/types';

export type ApiCounterSpec = components['schemas']['CounterSpecSchema'];

/** Form row may carry API fields from GET detail between edits. */
export type CounterSpecFormRow = CounterSpec &
  Partial<Pick<ApiCounterSpec, 'width' | 'key_fields' | 'min' | 'max'>>;

const FORMAT_WIDTH_PATTERN = /^0*(\d+)d$/i;

const DEFAULT_LEGACY_FORMAT_WIDTH = 6;

/**
 * Parses digit width from a Python-style format string (`06d` → 6).
 *
 * @param format - Legacy counter format.
 */
export function widthFromLegacyFormat(format: string | undefined): number {
  const trimmed = (format ?? '').trim();
  if (!trimmed) {
    return DEFAULT_LEGACY_FORMAT_WIDTH;
  }
  const match = FORMAT_WIDTH_PATTERN.exec(trimmed);
  if (!match) {
    return DEFAULT_LEGACY_FORMAT_WIDTH;
  }
  const width = Number.parseInt(match[1], 10);
  return Number.isFinite(width) && width > 0 ? width : DEFAULT_LEGACY_FORMAT_WIDTH;
}

/**
 * Builds `key_fields` from legacy key template / level hints.
 *
 * @param row - Legacy counter row.
 */
export function keyFieldsFromLegacyRow(row: CounterSpec): string[] {
  const keyTemplate = (row.key_template ?? '').trim();
  if (keyTemplate) {
    if (keyTemplate.includes(',')) {
      return keyTemplate
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
    }
    return [keyTemplate];
  }

  const levelFrom = (row.level_from ?? '').trim();
  if (levelFrom && levelFrom !== 'aggregation_level') {
    return [levelFrom];
  }

  return [];
}

/**
 * Converts one counter row to OpenAPI `CounterSpecSchema` (write payload only).
 *
 * @param row - Normalized form row; preserves `width` when loaded from API.
 */
export function counterRowToApiSpec(row: CounterSpecFormRow): ApiCounterSpec {
  const name = (row.name ?? '').trim();
  if (typeof row.width === 'number' && Number.isFinite(row.width) && row.width > 0) {
    return {
      name,
      width: row.width,
      key_fields: row.key_fields ?? [],
      min: typeof row.min === 'number' ? row.min : 1,
      max: typeof row.max === 'number' ? row.max : 0,
    };
  }

  const initial =
    typeof row.initial_value === 'number' && !Number.isNaN(row.initial_value)
      ? row.initial_value
      : 1;

  return {
    name,
    width: widthFromLegacyFormat(row.format),
    key_fields: keyFieldsFromLegacyRow(row),
    min: initial,
    max: 0,
  };
}

/**
 * Maps form `counter_config` to PATCH/POST body (`CounterSpecSchema` only).
 *
 * @param rows - Named counters from the form (legacy shape).
 */
export function counterConfigToApiPayload(
  rows: CounterSpecFormRow[] | undefined,
): ApiCounterSpec[] {
  const result: ApiCounterSpec[] = [];
  for (const row of rows ?? []) {
    const name = (row.name ?? '').trim();
    if (!name) {
      continue;
    }
    result.push(counterRowToApiSpec({ ...row, name }));
  }
  return result;
}

/**
 * Fills legacy form fields when detail returns API counter shape.
 *
 * @param row - Counter from GET/list.
 */
export function mapApiCounterRowToForm(row: CounterSpecFormRow): CounterSpecFormRow {
  const width = row.width;
  const format =
    (row.format ?? '').trim() ||
    (typeof width === 'number' && width > 0
      ? `${String(width).padStart(2, '0')}d`
      : '');
  const key_template =
    (row.key_template ?? '').trim() ||
    (row.key_fields ?? []).join(', ');
  const initial_value =
    typeof row.min === 'number'
      ? row.min
      : typeof row.initial_value === 'number'
        ? row.initial_value
        : 0;

  return {
    ...row,
    format,
    key_template,
    initial_value,
  };
}