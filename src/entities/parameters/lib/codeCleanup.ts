import {
  CODE_CLEANUP_DAYS_MAX,
  CODE_CLEANUP_DAYS_MIN,
  CODE_CLEANUP_INTERVAL_HOURS_MAX,
  CODE_CLEANUP_INTERVAL_HOURS_MIN,
  CODE_CLEANUP_KEYS,
  DEFAULT_CODE_CLEANUP_DAYS,
  DEFAULT_CODE_CLEANUP_ENABLED,
  DEFAULT_CODE_CLEANUP_INTERVAL_HOURS,
  DEFAULT_CODE_CLEANUP_START_TIME,
} from '../model/constants';
import type { CodeCleanupSettings, MarkingOptionEntry } from '../model/types';

const TIME_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)$/;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseClampedInt(
  raw: string | null | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  if (raw == null || raw.trim() === '') {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? fallback : clamp(parsed, min, max);
}

/** Only `"true"` (case-insensitive) enables cleanup; anything else is off. */
export function parseCodeCleanupEnabled(raw: string | null | undefined): boolean {
  if (raw == null || raw.trim() === '') {
    return DEFAULT_CODE_CLEANUP_ENABLED;
  }
  return raw.trim().toLowerCase() === 'true';
}

/** Retention in days, default 180, clamped to 1…3650. */
export function parseCodeCleanupDays(raw: string | null | undefined): number {
  return parseClampedInt(
    raw,
    DEFAULT_CODE_CLEANUP_DAYS,
    CODE_CLEANUP_DAYS_MIN,
    CODE_CLEANUP_DAYS_MAX,
  );
}

/** Start time `HH:MM` (24h), default 03:00 for empty or invalid values. */
export function parseCodeCleanupStartTime(raw: string | null | undefined): string {
  const match = raw ? TIME_PATTERN.exec(raw.trim()) : null;
  if (!match) {
    return DEFAULT_CODE_CLEANUP_START_TIME;
  }
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

/** Interval in hours, default 24, clamped to 1…168. */
export function parseCodeCleanupIntervalHours(raw: string | null | undefined): number {
  return parseClampedInt(
    raw,
    DEFAULT_CODE_CLEANUP_INTERVAL_HOURS,
    CODE_CLEANUP_INTERVAL_HOURS_MIN,
    CODE_CLEANUP_INTERVAL_HOURS_MAX,
  );
}

/**
 * Builds {@link CodeCleanupSettings} from raw `marking_options` values.
 *
 * @param raw - Raw option values keyed by `options_name`; missing keys use defaults.
 */
export function parseCodeCleanupSettings(
  raw: Partial<Record<string, string | null>>,
): CodeCleanupSettings {
  return {
    enabled: parseCodeCleanupEnabled(raw[CODE_CLEANUP_KEYS.enabled]),
    days: parseCodeCleanupDays(raw[CODE_CLEANUP_KEYS.days]),
    start_time: parseCodeCleanupStartTime(raw[CODE_CLEANUP_KEYS.startTime]),
    interval_hours: parseCodeCleanupIntervalHours(raw[CODE_CLEANUP_KEYS.intervalHours]),
  };
}

/**
 * Converts form values to batch entries (clamped numbers, `HH:MM`, boolean as text).
 *
 * @param settings - Cleanup settings from the form.
 */
export function codeCleanupToBatchEntries(settings: CodeCleanupSettings): MarkingOptionEntry[] {
  return [
    { name: CODE_CLEANUP_KEYS.enabled, value: settings.enabled ? 'true' : 'false' },
    {
      name: CODE_CLEANUP_KEYS.days,
      value: clamp(
        Math.trunc(settings.days),
        CODE_CLEANUP_DAYS_MIN,
        CODE_CLEANUP_DAYS_MAX,
      ),
    },
    {
      name: CODE_CLEANUP_KEYS.startTime,
      value: parseCodeCleanupStartTime(settings.start_time),
    },
    {
      name: CODE_CLEANUP_KEYS.intervalHours,
      value: clamp(
        Math.trunc(settings.interval_hours),
        CODE_CLEANUP_INTERVAL_HOURS_MIN,
        CODE_CLEANUP_INTERVAL_HOURS_MAX,
      ),
    },
  ];
}
