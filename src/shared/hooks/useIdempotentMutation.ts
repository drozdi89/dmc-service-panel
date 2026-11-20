import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from '@tanstack/react-query';
import { apiRequestData, type ApiRequestOptions } from '../api';
import { createIdempotencyKey } from '../api/headers';

/** Variables for an idempotent API mutation. */
export interface IdempotentMutationVariables {
  path: string;
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Reuse the same key for retries; auto-generated on first call. */
  idempotencyKey?: string;
  params?: ApiRequestOptions['params'];
}

/**
 * TanStack Query mutation wrapper that sends Idempotency-Key on WEB mutations.
 *
 * @param options - Optional TanStack Query mutation options.
 * @returns Mutation result with idempotent POST/PATCH/DELETE support.
 */
export function useIdempotentMutation<TData = unknown>(
  options?: Omit<
    UseMutationOptions<TData, Error, IdempotentMutationVariables>,
    'mutationFn'
  >,
): UseMutationResult<TData, Error, IdempotentMutationVariables> {
  return useMutation<TData, Error, IdempotentMutationVariables>({
    mutationFn: async (variables) => {
      const key = variables.idempotencyKey ?? createIdempotencyKey();
      return apiRequestData<TData>(variables.path, {
        method: variables.method ?? 'POST',
        body: variables.body,
        params: variables.params,
        idempotencyKey: key,
      });
    },
    ...options,
  });
}
