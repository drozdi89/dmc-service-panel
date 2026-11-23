import {
  DEFAULT_COUNTER_ROW,
  mapApiCounterRowToForm,
  type CodeGeneratorTemplate,
  type CounterSpec,
} from '@/entities/code-generator-template';
import type { CodeGeneratorTemplatePreviewFormValues } from './types';

/**
 * Empty create-form defaults (API object shape).
 */
export function createDefaultFormValues(): CodeGeneratorTemplate {
  return {
    id: 0,
    name: '',
    description: '',
    template: '',
    counter_config: [],
    validation_regex: '',
    is_system: false,
    legacy_type: null,
    counters: [],
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
 * Puts API/list detail into the form (same fields; empty counters get row defaults).
 *
 * @param template - Partial template from list or `fetchById`.
 */
export function mapTemplateToFormValues(
  template: Partial<CodeGeneratorTemplate>,
): CodeGeneratorTemplate {
  return {
    ...createDefaultFormValues(),
    ...template,
    name: template.name ?? '',
    description: template.description ?? '',
    template: template.template ?? '',
    counter_config: (template.counter_config ?? []).map((row) =>
      mapApiCounterRowToForm({
        ...DEFAULT_COUNTER_ROW,
        ...row,
      }),
    ),
    validation_regex: template.validation_regex ?? '',
    is_system: Boolean(template.is_system),
  };
}
