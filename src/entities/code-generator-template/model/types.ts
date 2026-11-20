import type { components } from '@/shared/api';

/**
 * Counter definition from template `counter_config`.
 *
 * `src/openapi.json` (b0962) describes `CounterSpecSchema` as
 * `name / width / key_fields / min / max`; the counter editor still works with the
 * previous contract (`CounterSpec` in b0428: `type / format / key_template /
 * level_from / initial_value`). Kept until the counter editor moves to the new schema.
 */
export interface CounterSpec {
  name: string;
  type: CounterSpecType;
  format: string;
  key_template: string;
  level_from: string;
  initial_value: number;
}

/** Allowed counter type discriminator values (previous `CounterSpec` contract). */
export type CounterSpecType = 'sscc_level' | 'gln_sscc' | 'date_serial' | 'task_pack' | 'none';

/** Code generator template row from list/detail API. */
export type CodeGeneratorTemplate = Omit<
  components['schemas']['GetCodeGeneratorTemplateSchema'],
  'counter_config'
> & {
  counter_config?: CounterSpec[];
};

/** Lightweight lookup row (`GET …/lookup`, user templates only). */
export type CodeGeneratorTemplateLookup = components['schemas']['CodeGeneratorTemplateLookupSchema'];

/** Catalog row describing one allowed template placeholder. */
export type CodeGeneratorTemplateVariable = components['schemas']['CodeGeneratorVariableSchema'];

/** Variable catalog group from `GET …/variables`. */
export type CodeGeneratorVariableGroup = CodeGeneratorTemplateVariable['group'];

/** Payload for creating a code generator template. */
export type CreateCodeGeneratorTemplatePayload = Omit<
  components['schemas']['CodeGeneratorTemplateSchema'],
  'counter_config'
> & {
  counter_config?: CounterSpec[];
};

/** Payload for updating a code generator template. */
export type UpdateCodeGeneratorTemplatePayload = Omit<
  components['schemas']['UpdateCodeGeneratorTemplateSchema'],
  'counter_config'
> & {
  counter_config?: CounterSpec[] | null;
};

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
