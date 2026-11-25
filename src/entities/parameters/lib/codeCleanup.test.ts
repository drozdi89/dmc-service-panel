import { describe, expect, it } from 'vitest';
import {
  codeCleanupToBatchEntries,
  parseCodeCleanupDays,
  parseCodeCleanupEnabled,
  parseCodeCleanupIntervalHours,
  parseCodeCleanupSettings,
  parseCodeCleanupStartTime,
} from './codeCleanup';

describe('code cleanup parsers', () => {
  it('enabled: only "true" turns it on', () => {
    expect(parseCodeCleanupEnabled('TRUE')).toBe(true);
    expect(parseCodeCleanupEnabled('1')).toBe(false);
    expect(parseCodeCleanupEnabled('')).toBe(false);
    expect(parseCodeCleanupEnabled(undefined)).toBe(false);
  });

  it('days: default 180 and clamp 1..3650', () => {
    expect(parseCodeCleanupDays('')).toBe(180);
    expect(parseCodeCleanupDays('abc')).toBe(180);
    expect(parseCodeCleanupDays('0')).toBe(1);
    expect(parseCodeCleanupDays('99999')).toBe(3650);
    expect(parseCodeCleanupDays('30')).toBe(30);
  });

  it('start time: HH:MM or default 03:00', () => {
    expect(parseCodeCleanupStartTime('')).toBe('03:00');
    expect(parseCodeCleanupStartTime('25:00')).toBe('03:00');
    expect(parseCodeCleanupStartTime('7:05')).toBe('07:05');
    expect(parseCodeCleanupStartTime('23:59')).toBe('23:59');
  });

  it('interval hours: default 24 and clamp 1..168', () => {
    expect(parseCodeCleanupIntervalHours(undefined)).toBe(24);
    expect(parseCodeCleanupIntervalHours('0')).toBe(1);
    expect(parseCodeCleanupIntervalHours('1000')).toBe(168);
  });

  it('settings: missing keys give defaults', () => {
    expect(parseCodeCleanupSettings({})).toEqual({
      enabled: false,
      days: 180,
      start_time: '03:00',
      interval_hours: 24,
    });
  });
});

describe('codeCleanupToBatchEntries', () => {
  it('serializes boolean as text, clamps numbers and keeps HH:MM', () => {
    expect(
      codeCleanupToBatchEntries({
        enabled: true,
        days: 99999,
        start_time: '04:30',
        interval_hours: 0,
      }),
    ).toEqual([
      { name: 'code_cleanup_enabled', value: 'true' },
      { name: 'code_cleanup_days', value: 3650 },
      { name: 'code_cleanup_start_time', value: '04:30' },
      { name: 'code_cleanup_interval_hours', value: 1 },
    ]);
  });

  it('writes "false" when disabled', () => {
    const [enabled] = codeCleanupToBatchEntries({
      enabled: false,
      days: 10,
      start_time: '03:00',
      interval_hours: 24,
    });
    expect(enabled).toEqual({ name: 'code_cleanup_enabled', value: 'false' });
  });
});
