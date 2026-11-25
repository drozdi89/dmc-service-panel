import type { CounterSpecSchema, CounterStatusSchema } from '../model/types';

/**
 * Russian plural for «ряд» (Qt `russian_row_count_label`).
 *
 * @param count - Non-negative row count.
 */
export function russianRowCountLabel(count: number): string {
  const n = Math.abs(Math.trunc(count));
  const mod100 = n % 100;
  const mod10 = n % 10;
  let word: string;
  if (mod100 >= 11 && mod100 <= 14) {
    word = 'рядов';
  } else if (mod10 === 1) {
    word = 'ряд';
  } else if (mod10 >= 2 && mod10 <= 4) {
    word = 'ряда';
  } else {
    word = 'рядов';
  }
  return `${n} ${word}`;
}

/**
 * Formats one counter status line (Qt `format_single_counter_status`).
 *
 * @param spec - Counter definition from `counter_config`.
 * @param status - Optional runtime status from detail `counters`.
 */
export function formatSingleCounterStatus(
  spec: CounterSpecSchema,
  status: CounterStatusSchema | undefined,
): string {
  const minValue = status?.min ?? spec.min;
  const maxValue =
    status?.max !== undefined && status.max !== 0 ? status.max : spec.max;
  const resolvedMax = maxValue === 0 ? counterTheoreticalMax(spec.width) : maxValue;
  const series = status?.series ?? null;
  const rowCount = status?.row_count ?? 0;

  if (series === null || series === undefined) {
    return `не начинали (${minValue}–${resolvedMax})`;
  }

  const padded = `${Math.trunc(series)}`.padStart(spec.width, '0');
  return `${padded} / ${minValue}–${resolvedMax} · ${russianRowCountLabel(rowCount)}`;
}

function counterTheoreticalMax(width: number): number {
  const w = Math.max(1, Math.trunc(width));
  return 10 ** w - 1;
}