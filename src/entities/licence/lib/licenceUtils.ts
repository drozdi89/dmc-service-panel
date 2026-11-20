import type { MactSubscription } from '../model/types';

/**
 * Decodes base64-encoded hardware info stored in `pc_data`.
 *
 * @param pcData - Base64 string from client record.
 * @returns Decoded text or fallback message.
 */
export function decodePcData(pcData: string | undefined | null): string {
  if (!pcData?.trim()) {
    return 'Данные об оборудовании отсутствуют.';
  }
  try {
    const binary = atob(pcData);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return pcData;
  }
}

/**
 * Formats ISO date-time for display in the admin table.
 *
 * @param value - ISO date-time string.
 */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('ru-RU');
}

/**
 * Formats ISO date for display.
 *
 * @param value - ISO date string.
 */
export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString('ru-RU');
}

/**
 * Returns whole days until the given date (negative if expired).
 *
 * @param value - ISO date string.
 */
export function daysUntil(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) {
    return null;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Builds human-readable subscription status text (Qt parity).
 *
 * @param subscription - MACT subscription snapshot.
 */
export function formatSubscriptionText(
  subscription: MactSubscription | null | undefined,
): string {
  if (!subscription) {
    return 'Данные о подписке недоступны..';
  }
  const { is_valid, valid_to, valid_days } = subscription;
  if (is_valid && valid_days > 0 && valid_to) {
    return `Подписка активна до ${formatDate(valid_to)} (${valid_days} дней осталось)`;
  }
  let expText = '';
  if (valid_days < 0) {
    expText = ` Истекла ${Math.abs(valid_days)}д. назад.`;
  }
  return `Отсутствует активная подписка.${expText}`;
}
