/** Sort direction for List Query Contract. */
export type SortDirection = 'asc' | 'desc';

/** Query parameters for server-side lists (List Query Contract). */
export interface ListQueryParams {
  size?: number;
  number?: number;
  q?: string;
  sort_by?: string;
  sort_dir?: SortDirection;
}

/** Paginated list response compatible with backend PaginateSchema. */
export interface PaginatedResponse<T> {
  page: number;
  next_page: number;
  previous_page: number;
  size: number;
  total_records: number;
  response: T[];
}

/** Standard v2 API envelope. */
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

/** Default page size for admin tables. */
export const DEFAULT_LIST_SIZE = 50;

/** Default page size for lookup selects. */
export const LOOKUP_LIST_SIZE = 50;

/** Debounce delay for search inputs (ms). */
export const SEARCH_DEBOUNCE_MS = 300;

/** Delay before showing loading indicators (ms). */
export const LOADING_VISIBLE_DELAY_MS = 300;
