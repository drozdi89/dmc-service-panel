import { BATCH_TEMPLATE_FIELDS } from '../model/types';

const PLACEHOLDER_PATTERN = /\{[^}]+\}/g;

/**
 * Validates batch number template placeholders against allowed fields.
 *
 * @param template - Batch template string with `{field}` placeholders.
 * @returns Error message when invalid; `null` when valid.
 */
export function validateBatchTemplate(template: string): string | null {
  const placeholders = template.match(PLACEHOLDER_PATTERN) ?? [];
  for (const placeholder of placeholders) {
    const fieldName = placeholder.slice(1, -1);
    if (!BATCH_TEMPLATE_FIELDS.includes(fieldName as (typeof BATCH_TEMPLATE_FIELDS)[number])) {
      return `Указано некорректное поле в формате шаблона: ${placeholder}`;
    }
  }
  return null;
}
