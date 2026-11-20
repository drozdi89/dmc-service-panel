import { describe, expect, it } from 'vitest';
import { FACTORY_QUERY_SCOPES } from '@/shared/queries';
import { DEFAULT_TASKS_LIST_PARAMS } from '../model/types';
import { TASK_QUERY_ENTRY, taskQueryKeys } from './task-queries';

describe('taskQueryKeys', () => {
  it('uses entry tasks with list scope', () => {
    expect(TASK_QUERY_ENTRY).toEqual(['tasks']);
    expect(taskQueryKeys.all()).toEqual(['tasks']);
    expect(taskQueryKeys.list()).toEqual(['tasks', FACTORY_QUERY_SCOPES.list]);
    expect(taskQueryKeys.list(DEFAULT_TASKS_LIST_PARAMS)).toEqual([
      'tasks',
      FACTORY_QUERY_SCOPES.list,
      DEFAULT_TASKS_LIST_PARAMS,
    ]);
  });
});
