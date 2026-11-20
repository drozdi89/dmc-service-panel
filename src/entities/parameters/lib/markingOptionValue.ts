/** Marking option key for licensed CRPT organization count. */
export const MARKING_OPTION_DMC_COMP_SIZE = 'dmc_comp_size';

/**
 * Parses a marking option string value as integer.
 *
 * @param raw - Raw `options_value` from API.
 * @returns Parsed integer or `null` when empty or invalid.
 */
export function parseMarkingOptionInt(raw: string | null | undefined): number | null {
  if (raw == null || raw.trim() === '') {
    return null;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? null : parsed;
}
