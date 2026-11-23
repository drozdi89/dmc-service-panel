import {
  DEFAULT_COUNTER_ROW,
  type CodeGeneratorTemplate,
  type CounterSpec,
  type CounterSpecFormRow,
} from '@/entities/code-generator-template';
import type { CodeGeneratorTemplateFormFieldError } from './types';

/**
 * Whether a counter row has non-default content without a name
 * (Desktop `_validate_counter_table` «has_content»).
 *
 * @param row - Counter row from the form table.
 */
export function isCounterRowFilledWithoutName(row: CounterSpec): boolean {
  const name = (row.name ?? '').trim();
  if (name) {
    return false;
  }

  const defaults = DEFAULT_COUNTER_ROW;
  const keyTemplate = (row.key_template ?? '').trim();
  const formatStr = (row.format ?? '').trim();
  const levelFrom = (row.level_from ?? '').trim();
  const initialValue = row.initial_value ?? 0;

  return (
    row.type !== defaults.type ||
    Boolean(keyTemplate) ||
    (Boolean(formatStr) && formatStr !== defaults.format) ||
    (Boolean(levelFrom) && levelFrom !== defaults.level_from) ||
    initialValue !== 0
  );
}

/**
 * Drops unnamed empty rows and normalizes named counters for submit.
 *
 * @param rows - Form counter table rows.
 */
export function normalizeCounterConfig(
  rows: CounterSpecFormRow[] | undefined,
): CounterSpecFormRow[] {
  const result: CounterSpecFormRow[] = [];
  for (const row of rows ?? []) {
    const name = (row.name ?? '').trim();
    if (!name) {
      continue;
    }
    result.push({
      name,
      type: row.type ?? DEFAULT_COUNTER_ROW.type,
      key_template: (row.key_template ?? '').trim(),
      format: (row.format ?? '').trim() || DEFAULT_COUNTER_ROW.format,
      level_from:
        (row.level_from ?? '').trim() || DEFAULT_COUNTER_ROW.level_from,
      initial_value:
        typeof row.initial_value === 'number' && !Number.isNaN(row.initial_value)
          ? row.initial_value
          : 0,
      ...(typeof row.width === 'number'
        ? {
            width: row.width,
            key_fields: row.key_fields,
            min: row.min,
            max: row.max,
          }
        : {}),
    });
  }
  return result;
}

/**
 * Client-side form validation (Desktop `_validate_form` without engine parse).
 *
 * Rules:
 * - name required (trimmed);
 * - template required (trimmed);
 * - filled counter rows must have a name;
 * - counter names must be unique.
 *
 * @param values - Current form values.
 * @returns Field errors (empty when valid).
 */
export function validateCodeGeneratorTemplateForm(
  values: Pick<
    CodeGeneratorTemplate,
    'name' | 'template' | 'counter_config'
  >,
): CodeGeneratorTemplateFormFieldError[] {
  const errors: CodeGeneratorTemplateFormFieldError[] = [];

  if (!(values.name ?? '').trim()) {
    errors.push({ name: 'name', message: 'Укажите имя шаблона' });
  }

  if (!(values.template ?? '').trim()) {
    errors.push({ name: 'template', message: 'Заполните строку шаблона' });
  }

  const rows = values.counter_config ?? [];
  const seenNames = new Map<string, number>();

  rows.forEach((row, index) => {
    const name = (row.name ?? '').trim();

    if (!name) {
      if (isCounterRowFilledWithoutName(row)) {
        errors.push({
          name: ['counter_config', index, 'name'],
          message: `Счётчик в строке ${index + 1}: укажите имя или очистите строку`,
        });
      }
      return;
    }

    const previousIndex = seenNames.get(name);
    if (previousIndex !== undefined) {
      errors.push({
        name: ['counter_config', index, 'name'],
        message: `Дублирующееся имя счётчика «${name}» (строки ${previousIndex + 1} и ${index + 1})`,
      });
      return;
    }
    seenNames.set(name, index);
  });

  return errors;
}
