import { apiRequestData, fetchPaginatedList } from '@/shared/api';
import type { ListQueryParams } from '@/shared/types/listQuery';
import type { PrintTemplate } from '../model/types';

const PRINT_TEMPLATES_PATH = '/api/v2/print_templates/';
const PRINT_TEMPLATES_LOOKUP_PATH = '/api/v2/print_templates/lookup';

/**
 * Fetches paginated print templates (List Query Contract).
 *
 * @param params - size, number, q, sort_by, sort_dir.
 */
export function fetchPrintTemplates(params: ListQueryParams) {
  return fetchPaginatedList<PrintTemplate>(PRINT_TEMPLATES_PATH, params);
}

/**
 * Lookup-select fetcher for print templates (`/print_templates/lookup`).
 *
 * @param params - size, number, q (List Query Contract subset).
 */
export function fetchPrintTemplatesLookup(params: ListQueryParams) {
  return fetchPaginatedList<PrintTemplate>(PRINT_TEMPLATES_LOOKUP_PATH, params);
}

/**
 * Fetches a single print template by id.
 *
 * @param id - Template primary key.
 * @param signal - Optional abort signal to cancel an in-flight request.
 */
export function fetchPrintTemplateById(
  id: number,
  signal?: AbortSignal,
): Promise<PrintTemplate> {
  return apiRequestData<PrintTemplate>(`${PRINT_TEMPLATES_PATH}${id}`, { signal });
}
