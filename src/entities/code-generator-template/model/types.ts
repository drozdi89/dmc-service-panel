import type { components } from '@/shared/api';

/** Counter definition from template `counter_config` (OpenAPI `CounterSpec`). */
export type CounterSpec = components['schemas']['CounterSpec'];

/** Allowed counter type discriminator values. */
export type CounterSpecType = CounterSpec['type'];

/**
 * Code generator template row from list/detail API.
 *
 * Local type: OpenAPI has no `GetCodeGeneratorTemplateSchema` export;
 * fields mirror backend response (`id`, counters, system flags).
 */
export interface CodeGeneratorTemplate {
  id: number;
  name: string;
  description?: string | null;
  template: string;
  counter_config?: CounterSpec[];
  validation_regex?: string | null;
  /** Read-only legacy builtin type (0–9) for seeded system rows. */
  legacy_type?: number | null;
  /** Read-only; system templates cannot be edited/deleted via API. */
  is_system?: boolean;
}

/** Lightweight lookup row (`GET …/lookup`, user templates only). */
export interface CodeGeneratorTemplateLookup {
  id: number;
  name: string;
}

/** Variable catalog group from `GET …/variables`. */
export type CodeGeneratorVariableGroup =
  | 'task'
  | 'product'
  | 'dates'
  | 'weight'
  | 'special';

/** Catalog row describing one allowed template placeholder. */
export interface CodeGeneratorTemplateVariable {
  name: string;
  description: string;
  example: string;
  group: CodeGeneratorVariableGroup;
}

/** Payload for creating a code generator template. */
export type CreateCodeGeneratorTemplatePayload =
  components['schemas']['CodeGeneratorTemplateSchema'];

/** Payload for updating a code generator template. */
export type UpdateCodeGeneratorTemplatePayload =
  components['schemas']['UpdateCodeGeneratorTemplateSchema'];

/** Payload for deleting code generator templates. */
export type DeleteCodeGeneratorTemplatesPayload =
  components['schemas']['DeleteCodeGeneratorTemplatesSchema'];

/**
 * Query params for `POST …/{id}/preview`.
 *
 * Service layer requires `task_id`; OpenAPI requires `aggregation_level`.
 */
export interface CodeGeneratorTemplatePreviewQuery {
  task_id: number;
  aggregation_level: number;
  weight?: number;
  package_size?: number;
  aggregate_number?: number;
  factory_number?: string;
  cell?: string;
  ignore_leap_year?: boolean;
}

/** Preview response payload (`data.code`). */
export interface CodeGeneratorTemplatePreviewResult {
  code: string;
}
