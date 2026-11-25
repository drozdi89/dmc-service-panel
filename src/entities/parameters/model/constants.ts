/** `marking_options` keys for scheduled code cleanup (Qt `gbxCodeCleanup`). */
export const CODE_CLEANUP_KEYS = {
  enabled: 'code_cleanup_enabled',
  days: 'code_cleanup_days',
  startTime: 'code_cleanup_start_time',
  intervalHours: 'code_cleanup_interval_hours',
} as const;

export const DEFAULT_CODE_CLEANUP_ENABLED = false;
export const DEFAULT_CODE_CLEANUP_DAYS = 180;
export const DEFAULT_CODE_CLEANUP_START_TIME = '03:00';
export const DEFAULT_CODE_CLEANUP_INTERVAL_HOURS = 24;

export const CODE_CLEANUP_DAYS_MIN = 1;
export const CODE_CLEANUP_DAYS_MAX = 3650;
export const CODE_CLEANUP_INTERVAL_HOURS_MIN = 1;
export const CODE_CLEANUP_INTERVAL_HOURS_MAX = 168;
