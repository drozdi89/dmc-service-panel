import { factoryQuery } from '@/shared/queries';
import type { ListQueryParams } from '@/shared/types/listQuery';
import {
  fetchPrintTemplateById,
  fetchPrintTemplates,
  fetchPrintTemplatesLookup,
} from '../api/api';
import type { PrintTemplate } from '../model/types';

/**
 * Canonical TanStack Query helpers for print templates.
 *
 * Keys (entry `['print-templates']`):
 * - list: `['print-templates', 'list', params?]`
 * - lookup: `['print-templates', 'lookup', params?]`
 * - detail: `['print-templates', 'detail', id]`
 *
 * Invalidate after mutations via `printTemplateQueries.keys.all()`.
 * Pass `printTemplateQueries.keys.all()` as `queryKey` to AsyncLookupSelect
 * (factory appends `'lookup'` + params).
 */
export const printTemplateQueries = factoryQuery<
  PrintTemplate,
  ListQueryParams,
  number
>({
  entry: ['print-templates'],
  fetchList: fetchPrintTemplates,
  fetchLookup: fetchPrintTemplatesLookup,
  fetchDetail: fetchPrintTemplateById,
});
