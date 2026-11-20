/** Maximum aggregation levels per line (Qt parity). */
export const MAX_AGGREGATION_LEVELS = 9;

/** Line type string values from backend. */
export const LINE_TYPE = {
  DEFAULT: 'DEFAULT',
  DOYPACK: 'DOYPACK',
  PRINT_NO_VERIFY: 'PRINTNOVERIFY',
} as const;

/** Human-readable line kind labels. */
export const LINE_KIND_LABELS = {
  automated: 'Автоматизированная',
  manual: 'Ручная (ТСД)',
} as const;

/** CodeGeneratorType.SSCC — requires system GLN (Qt check_gln). */
export const CODE_GENERATOR_SSCC = 2;

/** Code generator options (CodeGeneratorType enum). */
export const CODE_GENERATOR_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'Стандартный генератор DMC' },
  { value: 1, label: 'Генератор по формату ЮКМП' },
  { value: 2, label: 'Генератор в формате SSCC' },
  { value: 3, label: 'Генератор по формату ББ/ОА' },
  { value: 4, label: 'Генератор по формату 7 Утра' },
  { value: 5, label: 'Генератор в формате SSCC (GLN орг.)' },
  { value: 6, label: 'Генератор КИТУ (01)(21)(11)(93)' },
  { value: 7, label: 'Генератор КИТУ (01)(11)(17)(21)' },
  { value: 8, label: 'Генератор КИТУ (01)(11)(21)' },
];

/** Lines options checkbox labels (Qt parity). */
export const LINE_OPTIONS_FIELDS: Array<{
  key: keyof import('./types').LineOptionsFormState;
  label: string;
  disabledWhenManual?: boolean;
  disabledWhenScale?: boolean;
}> = [
  { key: 'can_add_task', label: 'Разрешить создание задания на линии' },
  { key: 'must_scan_before_start', label: 'Контроль сканирования продукции перед стартом' },
  { key: 'ask_befor_task', label: 'Запрашивать подтверждение перед запуском задания' },
  { key: 'control_task_date', label: 'Контроль даты производства в задании' },
  { key: 'cam_hide', label: 'Скрывать камеру при отключении' },
  { key: 'cam_disable', label: 'Отключать камеру при остановке линии' },
  { key: 'reserve_disabled', label: 'Задание по умолчанию: типография или свои' },
  { key: 'validate_ean', label: 'Проверять EAN при сканировании' },
];

/** Marking option key for per-line printed DM allowance. */
export const LINE_PRINTED_DM_OPTION = 'line_printed_dm_use';
