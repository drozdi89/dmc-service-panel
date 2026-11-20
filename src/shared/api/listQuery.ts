import { apiRequestData, type ApiRequestOptions } from './client';
import type { ListQueryParams, PaginatedResponse } from '../types/listQuery';

/**
 * Fetches a paginated list using the List Query Contract.
 *
 * @param path - API list endpoint path.
 * @param params - size, number, q, sort_by, sort_dir.
 */
export async function fetchPaginatedList<T>(
  path: string,
  params: ListQueryParams,
): Promise<PaginatedResponse<T>> {
  return apiRequestData<PaginatedResponse<T>>(path, {
    params: params as ApiRequestOptions['params'],
  });
}
