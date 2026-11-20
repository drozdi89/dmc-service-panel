import {
  DEFAULT_COUNTER_ROW,
  type CodeGeneratorTemplate,
  type CounterSpec,
} from '@/entities/code-generator-template';
import type {
  CodeGeneratorTemplateFormValues,
  CodeGeneratorTemplatePreviewFormValues,
} from './types';

/**
 * Empty create-form defaults (Desktop empty editor).
 */
export function createDefaultFormValues(): CodeGeneratorTemplateFormValues {
  return {
    name: '',
    description: '',
    template: '',
    counter_config: [],
    validation_regex: '',
    is_system: false,
  };
}

/**
 * Preview query defaults aligned with API (`aggregation_level` required; rest optional).
 *
 * Unit level is `-1` per OpenAPI; numeric/string optionals match service Query defaults.
 */
export function createDefaultPreviewFormValues(): CodeGeneratorTemplatePreviewFormValues {
  return {
    task_id: undefined,
    aggregation_level: 0,
    weight: 0,
    package_size: 0,
    aggregate_number: 0,
    factory_number: '',
    cell: '',
  };
}

/**
 * New counter row defaults (entity {@link DEFAULT_COUNTER_ROW}).
 */
export function createDefaultCounterRow(): CounterSpec {
  return { ...DEFAULT_COUNTER_ROW };
}

/**
 * Maps API/list detail into form values.
 *
 * @param template - Partial template from list or `fetchById`.
 */
export function mapTemplateToFormValues(
  template: Partial<CodeGeneratorTemplate>,
): CodeGeneratorTemplateFormValues {
  return {
    id: template.id,
    name: template.name ?? '',
    description: template.description ?? '',
    template: template.template ?? '',
    counter_config: (template.counter_config ?? []).map((row) => ({
      ...DEFAULT_COUNTER_ROW,
      ...row,
    })),
    validation_regex: template.validation_regex ?? '',
    is_system: Boolean(template.is_system),
  };
}
