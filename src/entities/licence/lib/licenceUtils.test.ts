import { describe, expect, it } from 'vitest';
import {
  daysUntil,
  decodePcData,
  formatDate,
  formatSubscriptionText,
} from './licenceUtils';

describe('decodePcData', () => {
  it('decodes base64 hardware info', () => {
    const encoded = btoa('CPU: Intel\nRAM: 16GB');
    expect(decodePcData(encoded)).toBe('CPU: Intel\nRAM: 16GB');
  });

  it('decodes UTF-8 Cyrillic text', () => {
    const text = 'Процессор: Intel';
    const encoded = btoa(
      new TextEncoder().encode(text).reduce((acc, byte) => acc + String.fromCharCode(byte), ''),
    );
    expect(decodePcData(encoded)).toBe(text);
  });

  it('returns fallback for empty input', () => {
    expect(decodePcData('')).toBe('Данные об оборудовании отсутствуют.');
    expect(decodePcData(null)).toBe('Данные об оборудовании отсутствуют.');
  });
});

describe('daysUntil', () => {
  it('returns null for invalid date', () => {
    expect(daysUntil(null)).toBeNull();
    expect(daysUntil('not-a-date')).toBeNull();
  });

  it('computes whole days until target date', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const future = new Date(today);
    future.setDate(future.getDate() + 10);
    const iso = [
      future.getFullYear(),
      String(future.getMonth() + 1).padStart(2, '0'),
      String(future.getDate()).padStart(2, '0'),
    ].join('-');
    expect(daysUntil(iso)).toBe(10);
  });
});

describe('formatDate', () => {
  it('formats valid ISO date', () => {
    expect(formatDate('2026-12-31')).toMatch(/31\.12\.2026/);
  });

  it('returns em dash for empty value', () => {
    expect(formatDate(undefined)).toBe('—');
  });
});

describe('formatSubscriptionText', () => {
  it('describes active subscription', () => {
    const text = formatSubscriptionText({
      is_valid: true,
      valid_to: '2026-12-31',
      valid_days: 197,
    });
    expect(text).toContain('Подписка активна');
    expect(text).toContain('197');
  });

  it('describes expired subscription', () => {
    const text = formatSubscriptionText({
      is_valid: false,
      valid_to: '2025-01-01',
      valid_days: -5,
    });
    expect(text).toContain('Отсутствует активная подписка');
    expect(text).toContain('5д. назад');
  });

  it('handles missing data', () => {
    expect(formatSubscriptionText(null)).toBe('Данные о подписке недоступны..');
  });
});
