/**
 * Formats per-product autoorder amount for table display (Qt parity).
 *
 * @param amount - Stored amount: -1 disabled, 0 default, positive custom.
 */
export function formatAutoorderAmount(amount: number): string {
  if (amount < 0) {
    return 'Отключить';
  }
  if (amount === 0) {
    return 'По умолчанию';
  }
  return String(amount);
}

/**
 * Parses autoorder amount label back to stored integer.
 *
 * @param label - Display label from table or select.
 */
export function parseAutoorderAmount(label: string): number {
  if (label === 'Отключить' || label === 'Отключен') {
    return -1;
  }
  if (label === 'По умолчанию') {
    return 0;
  }
  const parsed = Number.parseInt(label, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Returns human-readable CRPT KM template index label.
 *
 * @param idx - Template index (0 long, 1 short).
 */
export function formatCrptTemplateIdx(idx: number): string {
  return idx === 1 ? 'Короткий' : 'Длинный';
}

/**
 * Returns human-readable line task KM type label.
 *
 * @param reserveDisabled - Line option `reserve_disabled`.
 */
export function formatLineTaskType(reserveDisabled: boolean): string {
  return reserveDisabled ? 'Напечатанные КМ' : 'Собственные КМ';
}
