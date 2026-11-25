import type { components } from '@/shared/api';

/** OpenAPI counter row (`name`, `width`, `key_fields`, `min`, `max`). */
export type CounterSpecSchema = components['schemas']['CounterSpecSchema'];

/** Read-only counter series status from template detail. */
export type CounterStatusSchema = components['schemas']['CounterStatusSchema'];

/** Code generator template row from list/detail API. */
export type CodeGeneratorTemplate = Omit<
  components['schemas']['GetCodeGeneratorTemplateSchema'],
  'counter_config'
> & {
  counter_config?: CounterSpecSchema[];
};

/** Lightweight lookup row (`GET …/lookup`, user templates only). */
export type CodeGeneratorTemplateLookup =
  components['schemas']['CodeGeneratorTemplateLookupSchema'];

/** Catalog row describing one allowed template placeholder. */
export type CodeGeneratorTemplateVariable =
  components['schemas']['CodeGeneratorVariableSchema'];

/** Variable catalog group from `GET …/variables`. */
export type CodeGeneratorVariableGroup = CodeGeneratorTemplateVariable['group'];

/** Payload for creating a code generator template. */
export type CreateCodeGeneratorTemplatePayload = Omit<
  components['schemas']['CodeGeneratorTemplateSchema'],
  'counter_config'
> & {
  counter_config?: CounterSpecSchema[];
};

/** Payload for updating a code generator template. */
export type UpdateCodeGeneratorTemplatePayload = Omit<
  components['schemas']['UpdateCodeGeneratorTemplateSchema'],
  'counter_config'
> & {
  counter_config?: CounterSpecSchema[] | null;
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