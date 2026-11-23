import { apiRequestData, fetchPaginatedList } from '@/shared/api';
import type { ListQueryParams } from '@/shared/types/listQuery';
import { counterConfigToApiPayload } from '../lib/counterConfigPayload';
import type {
  CodeGeneratorTemplate,
  CodeGeneratorTemplatePreviewQuery,
  CodeGeneratorTemplatePreviewResult,
  CodeGeneratorTemplateVariable,
  CreateCodeGeneratorTemplatePayload,
  UpdateCodeGeneratorTemplatePayload,
} from '../model/types';

function withApiCounterConfig<
  T extends { counter_config?: CreateCodeGeneratorTemplatePayload['counter_config'] },
>(payload: T): T {
  if (payload.counter_config === undefined) {
    return payload;
  }
  return {
    ...payload,
    counter_config: counterConfigToApiPayload(
      payload.counter_config as Parameters<typeof counterConfigToApiPayload>[0],
    ),
  };
}

/** Collection path for code generator templates CRUD. */
export const CODE_GENERATOR_TEMPLATES_PATH = '/api/v2/code_generator_templates/';

/** Lookup-select path (user templates, `is_system=false`). */
export const CODE_GENERATOR_TEMPLATES_LOOKUP_PATH =
  '/api/v2/code_generator_templates/lookup';

/** Variables catalog path. */
export const CODE_GENERATOR_TEMPLATES_VARIABLES_PATH =
  '/api/v2/code_generator_templates/variables';

/**
 * Builds preview endpoint path for a template id.
 *
 * @param id - Template primary key.
 */
export function buildCodeGeneratorTemplatePreviewPath(id: number): string {
  return `${CODE_GENERATOR_TEMPLATES_PATH}${id}/preview`;
}

/**
 * Fetches paginated code generator templates (List Query Contract).
 *
 * @param params - size, number, q, sort_by, sort_dir.
 */
export function fetchCodeGeneratorTemplates(params: ListQueryParams) {
  return fetchPaginatedList<CodeGeneratorTemplate>(
    CODE_GENERATOR_TEMPLATES_PATH,
    params,
  );
}

/**
 * Lookup-select fetcher for user code generator templates.
 *
 * @param params - size, number, q (List Query Contract subset).
 */
export function fetchCodeGeneratorTemplatesLookup(params: ListQueryParams) {
  // Lookup payload is id+name only; typed as list row for factoryQuery TItem parity.
  return fetchPaginatedList<CodeGeneratorTemplate>(
    CODE_GENERATOR_TEMPLATES_LOOKUP_PATH,
    params,
  );
}

/**
 * Fetches a single code generator template by id.
 *
 * @param id - Template primary key.
 * @param signal - Optional abort signal to cancel an in-flight request.
 */
export function fetchCodeGeneratorTemplateById(
  id: number,
  signal?: AbortSignal,
): Promise<CodeGeneratorTemplate> {
  return apiRequestData<CodeGeneratorTemplate>(
    `${CODE_GENERATOR_TEMPLATES_PATH}${id}`,
    { signal },
  );
}

/**
 * Fetches the static template variables catalog.
 *
 * @param signal - Optional abort signal.
 */
export function fetchCodeGeneratorTemplateVariables(
  signal?: AbortSignal,
): Promise<CodeGeneratorTemplateVariable[]> {
  return apiRequestData<CodeGeneratorTemplateVariable[]>(
    CODE_GENERATOR_TEMPLATES_VARIABLES_PATH,
    { signal },
  );
}

/**
 * Dry-run preview for an existing template (`POST …/{id}/preview`).
 *
 * Does **not** call `/generate` (no counter increment).
 *
 * @param id - Template primary key.
 * @param query - Runtime context (`task_id` + `aggregation_level` required).
 * @param signal - Optional abort signal.
 */
/** Creates a code generator template. */
export async function createCodeGeneratorTemplate(
  payload: CreateCodeGeneratorTemplatePayload,
  idempotencyKey: string,
): Promise<CodeGeneratorTemplate> {
  return apiRequestData<CodeGeneratorTemplate>(CODE_GENERATOR_TEMPLATES_PATH, {
    method: 'POST',
    body: withApiCounterConfig(payload),
    idempotencyKey,
  });
}

/** Updates a code generator template. */
export async function updateCodeGeneratorTemplate(
  id: number,
  payload: UpdateCodeGeneratorTemplatePayload,
  idempotencyKey: string,
): Promise<CodeGeneratorTemplate> {
  return apiRequestData<CodeGeneratorTemplate>(
    `${CODE_GENERATOR_TEMPLATES_PATH}${id}`,
    {
      method: 'PATCH',
      body: withApiCounterConfig(payload),
      idempotencyKey,
    },
  );
}

/** Deletes code generator templates by id list. */
export async function deleteCodeGeneratorTemplates(
  ids: number[],
  idempotencyKey: string,
): Promise<string> {
  return apiRequestData<string>(CODE_GENERATOR_TEMPLATES_PATH, {
    method: 'DELETE',
    body: { id_code_generator_templates: ids },
    idempotencyKey,
  });
}

export function previewCodeGeneratorTemplate(
  id: number,
  query: CodeGeneratorTemplatePreviewQuery,
  signal?: AbortSignal,
): Promise<CodeGeneratorTemplatePreviewResult> {
  return apiRequestData<CodeGeneratorTemplatePreviewResult>(
    buildCodeGeneratorTemplatePreviewPath(id),
    {
      method: 'POST',
      params: {
        task_id: query.task_id,
        aggregation_level: query.aggregation_level,
        weight: query.weight,
        package_size: query.package_size,
        aggregate_number: query.aggregate_number,
        factory_number: query.factory_number,
        cell: query.cell,
        ignore_leap_year: query.ignore_leap_year,
      },
      signal,
    },
  );
}
