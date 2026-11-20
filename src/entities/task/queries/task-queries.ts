import {
  keepPreviousData,
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query';
import { FACTORY_QUERY_SCOPES } from '@/shared/queries';
import { fetchTaskList } from '../api/api';
import type { TaskListResponse, TasksListQuery } from '../model/types';

/**
 * Canonical TanStack Query entry for tasks.
 * Scopes: `list` (card/list views via `GET /api/v2/tasks/list`).
 * Detail is not exposed — tasks API has no single-task read in this entity yet.
 */
export const TASK_QUERY_ENTRY = ['tasks'] as const;

/** Canonical query-key builders for the task entity. */
export const taskQueryKeys = {
  /** Root prefix for `invalidateQueries({ queryKey: taskQueryKeys.all() })`. */
  all: (): typeof TASK_QUERY_ENTRY => TASK_QUERY_ENTRY,
  /**
   * List key. With params: `['tasks', 'list', params]`.
   * Without params (prefix): `['tasks', 'list']`.
   *
   * @param params - FilterData + pagination + view for `/tasks/list`.
   */
  list: (params?: TasksListQuery): readonly unknown[] =>
    params === undefined
      ? [...TASK_QUERY_ENTRY, FACTORY_QUERY_SCOPES.list]
      : [...TASK_QUERY_ENTRY, FACTORY_QUERY_SCOPES.list, params],
} as const;

/** Options for {@link useTaskListQuery}. */
export interface UseTaskListQueryOptions {
  /** FilterData + pagination + view params for GET /tasks/list. */
  params: TasksListQuery;
  /** When false, query is not executed. */
  enabled?: boolean;
}

/**
 * TanStack Query hook for Manager task card list (`GET /api/v2/tasks/list`).
 *
 * Key: `['tasks', 'list', params]`. Polls every 2s; keeps previous page while refetching.
 *
 * @param options - List parameters and enabled flag.
 * @returns Query result with paginated task cards.
 */
export function useTaskListQuery(
  options: UseTaskListQueryOptions,
): UseQueryResult<TaskListResponse, Error> {
  const { params, enabled = true } = options;

  return useQuery<TaskListResponse, Error>({
    queryKey: taskQueryKeys.list(params),
    queryFn: () => fetchTaskList(params),
    placeholderData: keepPreviousData,
    enabled,
    refetchInterval: 2000,
  });
}
