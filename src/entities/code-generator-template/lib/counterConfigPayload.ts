import type { CounterSpecSchema } from '../model/types';
import { normalizeCounterConfig } from './counterValidation';

/**
 * Maps form `counter_config` to PATCH/POST body (thin normalization).
 *
 * @param rows - Counter rows from the form.
 */
export function counterConfigToApiPayload(
  rows: CounterSpecSchema[] | undefined,
): CounterSpecSchema[] {
  return normalizeCounterConfig(rows);
}