import {
  COUNTER_NAME_DIGIT_ONLY_ERROR,
  isCounterNameValidForCollect,
  isCounterRowFilledWithoutName,
  normalizeCounterConfig,
  type CodeGeneratorTemplate,
  type CounterSpecSchema,
} from '@/entities/code-generator-template';
import type { CodeGeneratorTemplateFormFieldError } from './types';

export { isCounterRowFilledWithoutName, normalizeCounterConfig };

/**
 * Client-side form validation (Desktop `_validate_form` without engine parse).
 *
 * @param values - Current form values.
 */
export function validateCodeGeneratorTemplateForm(
  values: Pick<CodeGeneratorTemplate, 'name' | 'template' | 'counter_config'>,
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

    if (!isCounterNameValidForCollect(name)) {
      errors.push({
        name: ['counter_config', index, 'name'],
        message: COUNTER_NAME_DIGIT_ONLY_ERROR,
      });
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

export type { CounterSpecSchema };