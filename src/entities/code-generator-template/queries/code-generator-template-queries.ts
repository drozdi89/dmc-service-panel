import { factoryQuery } from '@/shared/queries';
import type { ListQueryParams } from '@/shared/types/listQuery';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import {
  fetchCodeGeneratorTemplateById,
  fetchCodeGeneratorTemplates,
  fetchCodeGeneratorTemplatesLookup,
  fetchCodeGeneratorTemplateVariables,
} from '../api/api';
import type { CodeGeneratorTemplate, CodeGeneratorTemplateVariable } from '../model/types';

/**
 * Canonical TanStack Query helpers for code generator templates.
 *
 * Keys (entry `['code-generator-templates']`):
 * - list: `['code-generator-templates', 'list', params?]`
 * - lookup: `['code-generator-templates', 'lookup', params?]`
 * - detail: `['code-generator-templates', 'detail', id]`
 *
 * Invalidate after mutations via `codeGeneratorTemplateQueries.keys.all()`.
 * Pass `codeGeneratorTemplateQueries.keys.all()` as `queryKey` to AsyncLookupSelect
 * (factory appends `'lookup'` + params).
 */
export const codeGeneratorTemplateQueries = factoryQuery<
  CodeGeneratorTemplate,
  ListQueryParams,
  number
>({
  entry: ['code-generator-templates'],
  fetchList: fetchCodeGeneratorTemplates,
  fetchLookup: fetchCodeGeneratorTemplatesLookup,
  fetchDetail: fetchCodeGeneratorTemplateById,
});

/** Stable query key for the template variables catalog. */
export const CODE_GENERATOR_TEMPLATE_VARIABLES_QUERY_KEY = [
  ...codeGeneratorTemplateQueries.keys.all(),
  'variables',
] as const;

/**
 * Allowed template placeholders (`GET …/variables`); rarely changes, cached 5 min.
 *
 * @param enabled - Load only while the catalog is shown.
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
