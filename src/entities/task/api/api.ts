import { apiRequestData, getApiBaseUrl } from '@/shared/api';
import type { TaskListResponse, TasksListQuery } from '../model/types';

const TASKS_LIST_PATH = '/api/v2/tasks/list';

type ScalarParam = string | number | boolean | undefined | null;

const SCALAR_KEYS: Array<keyof TasksListQuery> = [
  'filter_type',
  'start',
  'end',
  'gtin',
  'size',
  'number',
  'view',
];

const ARRAY_KEYS: Array<keyof TasksListQuery> = [
  'lines',
  'statuses',
  'tasks',
  'origin_tasks',
];

/**
 * Builds query path for GET /api/v2/tasks/list with FilterData and pagination.
 *
 * @param path - Base API path.
 * @param params - Tasks list query parameters.
 */
export function buildTasksListPath(path: string, params: TasksListQuery): string {
  const base = getApiBaseUrl();
  const url = new URL(`${base}${path}`, window.location.origin);

  for (const key of SCALAR_KEYS) {
    const value = params[key] as ScalarParam;
    if (value === undefined || value === null || value === '') {
      continue;
    }
    url.searchParams.set(key, String(value));
  }

  for (const key of ARRAY_KEYS) {
    const values = params[key] as number[] | null | undefined;
    if (!values) {
      continue;
    }
    for (const item of values) {
      url.searchParams.append(key, String(item));
    }
  }

  return url.pathname + url.search;
}

/**
 * Fetches paginated task cards for Web Manager list/grid.
 *
 * @param params - FilterData filters, pagination and view (default card).
 */
export async function fetchTaskList(params: TasksListQuery): Promise<TaskListResponse> {
  const path = buildTasksListPath(TASKS_LIST_PATH, {
    view: 'card',
    ...params,
  });
  return apiRequestData<TaskListResponse>(path);
}
