import {
	useMutation,
	useQueryClient,
	type QueryClient,
	type UseMutationOptions,
	type UseMutationResult,
} from '@tanstack/react-query';
import { queriesOptionsKeys, type FactoryQueryKeys } from './options';

/** Resource addressed by a single id (number or string, e.g. GTIN). */
export type FactoryMutationItem<TId = string | number> = {
	id: TId;
};

/** Update variables: persisted id plus a partial body. */
export type FactoryUpdateVariables<
	TItem extends FactoryMutationItem<TId>,
	TId = string | number,
> = Partial<TItem> & Pick<TItem, 'id'>;

/**
 * Config for a simple create / update / delete resource.
 * Multi-step saves (nested rows, idempotency, «Применить») stay in
 * `entities/<domain>/queries` and invalidate `keys.all()` themselves.
 */
export interface FactoryMutationConfig<
	TItem extends FactoryMutationItem<TId>,
	TId = string | number,
> {
	entry: readonly unknown[];
	fetchCreate?: (data: Partial<TItem>) => Promise<TItem>;
	fetchUpdate?: (id: TId, data: Partial<TItem>) => Promise<TItem>;
	fetchDelete?: (id: TId) => Promise<null>;
}

type FactoryMutationHookOptions<TData, TVariables> = Omit<
	UseMutationOptions<TData, Error, TVariables>,
	'mutationFn'
>;

/** Create / update / delete hooks that share the entity query keys. */
export interface FactoryMutationApi<
	TItem extends FactoryMutationItem<TId>,
	TId = string | number,
> {
	keys: FactoryQueryKeys<TId>;
	useCreateMutation: (
		options?: FactoryMutationHookOptions<TItem, Partial<TItem>>,
	) => UseMutationResult<TItem, Error, Partial<TItem>>;
	useUpdateMutation: (
		options?: FactoryMutationHookOptions<TItem, FactoryUpdateVariables<TItem, TId>>,
	) => UseMutationResult<TItem, Error, FactoryUpdateVariables<TItem, TId>>;
	useDeleteMutation: (
		options?: FactoryMutationHookOptions<null, TId | Pick<TItem, 'id'>>,
	) => UseMutationResult<null, Error, TId | Pick<TItem, 'id'>>;
}

function assertFetcher<T>(
	fetcher: T | undefined,
	name: string,
): asserts fetcher is T {
	if (!fetcher) {
		throw new Error(`factoryMutation: "${name}" is not configured for this entity`);
	}
}

function resolveId<TId>(variables: TId | { id: TId }): TId {
	return typeof variables === 'object' && variables !== null && 'id' in variables
		? variables.id
		: variables;
}

/**
 * Refreshes list / lookup caches after CRUD without refetching open detail modals.
 *
 * @param client - React Query client.
 * @param keys - Entity key builders from {@link queriesOptionsKeys}.
 */
export async function invalidateFactoryListAndLookup<TId = string | number>(
	client: QueryClient,
	keys: FactoryQueryKeys<TId>,
): Promise<void> {
	await Promise.all([
		client.invalidateQueries({ queryKey: keys.list() }),
		client.invalidateQueries({ queryKey: keys.lookup() }),
	]);
}

/**
 * Builds create / update / delete mutations for one entity entry.
 *
 * Success writes the mutation response into the detail cache, then invalidates
 * list / lookup only (not `keys.all()` — avoids redundant GET on nested Host save).
 * Errors are left to the caller: toasts and confirm live in entity hooks.
 */
export function factoryMutation<
	TItem extends FactoryMutationItem<TId>,
	TId extends string | number = TItem['id'],
>(
	config: FactoryMutationConfig<TItem, TId>,
): FactoryMutationApi<TItem, TId> {
	const { entry, fetchCreate, fetchUpdate, fetchDelete } = config;
	const keys = queriesOptionsKeys<TId>(entry);

	function useCreateMutation(
		options?: FactoryMutationHookOptions<TItem, Partial<TItem>>,
	): UseMutationResult<TItem, Error, Partial<TItem>> {
		const queryClient = useQueryClient();
		assertFetcher(fetchCreate, 'fetchCreate');

		return useMutation({
			...options,
			mutationFn: async (data) => await fetchCreate(data),
			onSuccess: (result, variables, onMutateResult, context) => {
				queryClient.setQueryData(keys.detail(result.id), result);
				void invalidateFactoryListAndLookup(queryClient, keys);
				options?.onSuccess?.(result, variables, onMutateResult, context);
			},
		});
	}

	function useUpdateMutation(
		options?: FactoryMutationHookOptions<TItem, FactoryUpdateVariables<TItem, TId>>,
	): UseMutationResult<TItem, Error, FactoryUpdateVariables<TItem, TId>> {
		const queryClient = useQueryClient();
		assertFetcher(fetchUpdate, 'fetchUpdate');

		return useMutation({
			...options,
			mutationFn: async ({ id, ...data }) =>
				await fetchUpdate(id, data as Partial<TItem>),
			onSuccess: (result, variables, onMutateResult, context) => {
				const id = resolveId(variables);
				queryClient.setQueryData(keys.detail(id), result);
				void invalidateFactoryListAndLookup(queryClient, keys);
				options?.onSuccess?.(result, variables, onMutateResult, context);
			},
		});
	}

	function useDeleteMutation(
		options?: FactoryMutationHookOptions<null, TId | Pick<TItem, 'id'>>,
	): UseMutationResult<null, Error, TId | Pick<TItem, 'id'>> {
		const queryClient = useQueryClient();
		assertFetcher(fetchDelete, 'fetchDelete');

		return useMutation({
			...options,
			mutationFn: async (variables) => await fetchDelete(resolveId(variables)),
			onSuccess: (result, variables, onMutateResult, context) => {
				const id = resolveId(variables);
				queryClient.removeQueries({ queryKey: keys.detail(id) });
				void invalidateFactoryListAndLookup(queryClient, keys);
				options?.onSuccess?.(result, variables, onMutateResult, context);
			},
		});
	}

	return {
		keys,
		useCreateMutation,
		useUpdateMutation,
		useDeleteMutation,
	};
}
