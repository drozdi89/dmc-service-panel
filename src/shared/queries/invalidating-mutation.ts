import {
	useMutation,
	useQueryClient,
	type QueryKey,
	type UseMutationOptions,
	type UseMutationResult,
} from '@tanstack/react-query';

/** Caller options for an entity mutation hook (toasts, close, …). */
export type EntityMutationOptions<TData, TVariables> = Omit<
	UseMutationOptions<TData, Error, TVariables>,
	'mutationFn'
>;

/** Config for {@link useInvalidatingMutation}. */
export interface InvalidatingMutationConfig<TData, TVariables>
	extends EntityMutationOptions<TData, TVariables> {
	mutationFn: (variables: TVariables) => Promise<TData>;
	/** Query keys invalidated after a successful mutation. */
	invalidate: readonly QueryKey[];
}

/**
 * Mutation for resources that do not fit {@link factoryMutation}
 * (singleton settings, batch saves, delete by list).
 *
 * Success invalidates `invalidate` keys, then calls the caller `onSuccess`.
 * Errors are left to the caller.
 */
export function useInvalidatingMutation<TData, TVariables = void>({
	invalidate,
	onSuccess,
	...options
}: InvalidatingMutationConfig<TData, TVariables>): UseMutationResult<TData, Error, TVariables> {
	const queryClient = useQueryClient();

	return useMutation({
		...options,
		onSuccess: (result, variables, onMutateResult, context) => {
			for (const queryKey of invalidate) {
				void queryClient.invalidateQueries({ queryKey });
			}
			return onSuccess?.(result, variables, onMutateResult, context);
		},
	});
}
