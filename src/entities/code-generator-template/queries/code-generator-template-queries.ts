import { createIdempotencyKey } from '@/shared/api';
import { factoryMutation, factoryQuery } from '@/shared/queries';
import type { ListQueryParams } from '@/shared/types/listQuery';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import {
  createCodeGeneratorTemplate,
  deleteCodeGeneratorTemplates,
  fetchCodeGeneratorTemplateById,
  fetchCodeGeneratorTemplates,
  fetchCodeGeneratorTemplatesLookup,
  fetchCodeGeneratorTemplateVariables,
  updateCodeGeneratorTemplate,
} from '../api/api';
import type {
  CodeGeneratorTemplate,
  CodeGeneratorTemplateVariable,
  CreateCodeGeneratorTemplatePayload,
  UpdateCodeGeneratorTemplatePayload,
} from '../model/types';

/** Shared TanStack Query root for list / lookup / detail and CRUD mutations. */
export const CODE_GENERATOR_TEMPLATE_QUERY_ENTRY = ['code-generator-templates'] as const;

const queryApi = factoryQuery<CodeGeneratorTemplate, ListQueryParams, number>({
  entry: CODE_GENERATOR_TEMPLATE_QUERY_ENTRY,
  fetchList: fetchCodeGeneratorTemplates,
  fetchLookup: fetchCodeGeneratorTemplatesLookup,
  fetchDetail: fetchCodeGeneratorTemplateById,
});

const mutationApi = factoryMutation<CodeGeneratorTemplate, number>({
  entry: CODE_GENERATOR_TEMPLATE_QUERY_ENTRY,
  fetchCreate: (data) =>
    createCodeGeneratorTemplate(
      data as CreateCodeGeneratorTemplatePayload,
      createIdempotencyKey(),
    ),
  fetchUpdate: (id, data) =>
    updateCodeGeneratorTemplate(
      id,
      data as UpdateCodeGeneratorTemplatePayload,
      createIdempotencyKey(),
    ),
  fetchDelete: async (id) => {
    await deleteCodeGeneratorTemplates([id], createIdempotencyKey());
    return null;
  },
});

/**
 * Canonical TanStack Query API for code generator templates (read + create / update / delete).
 */
export const codeGeneratorTemplateQueries = {
  ...queryApi,
  ...mutationApi,
};

/** Stable query key for the template variables catalog. */
export const CODE_GENERATOR_TEMPLATE_VARIABLES_QUERY_KEY = [
  ...CODE_GENERATOR_TEMPLATE_QUERY_ENTRY,
  'variables',
] as const;

/**
 * Allowed template placeholders (`GET …/variables`); rarely changes, cached 5 min.
 */
export function useCodeGeneratorTemplateVariablesQuery(
  enabled: boolean,
): UseQueryResult<CodeGeneratorTemplateVariable[], Error> {
  return useQuery({
    queryKey: CODE_GENERATOR_TEMPLATE_VARIABLES_QUERY_KEY,
    queryFn: ({ signal }) => fetchCodeGeneratorTemplateVariables(signal),
    enabled,
    staleTime: 5 * 60_000,
  });
}