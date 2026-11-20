import { factoryQuery } from '@/shared/lib/factory-query';
import type { ListQueryParams } from '@/shared/types/listQuery';
import {
  fetchCodeGeneratorTemplateById,
  fetchCodeGeneratorTemplates,
  fetchCodeGeneratorTemplatesLookup,
} from '../api/api';
import type { CodeGeneratorTemplate } from '../model/types';

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
