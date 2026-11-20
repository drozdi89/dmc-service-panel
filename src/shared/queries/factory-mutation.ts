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
 * Builds create / update / delete mutations for one entity entry.
 *
 * Success invalidates `keys.all()` (list, lookup, detail and extra scopes
 * under the entry) and writes the saved record into the detail cache.
 * Errors are left to the caller: this panel shows toasts in the feature,
 * and a nested picker save stays silent.
 */
export function factoryMutation<
	TItem extends FactoryMutationItem<TId>,
	TId extends string | number = TItem['id'],
>(
	config: FactoryMutationConfig<TItem, TId>,
): FactoryMutationApi<TItem, TId> {
	const { entry, fetchCreate, fetchUpdate, fetchDelete } = config;
	const keys = queriesOptionsKeys<TId>(entry);

	async function reload(client: QueryClient, id?: TId): Promise<void> {
		await client.invalidateQueries({ queryKey: keys.all() });
		if (id !== undefined) {
			await client.invalidateQueries({ queryKey: keys.detail(id) });
		}
	}

	function useCreateMutation(
		options?: FactoryMutationHookOptions<TItem, Partial<TItem>>,
	): UseMutationResult<TItem, Error, Partial<TItem>> {
		const queryClient = useQueryClient();
		assertFetcher(fetchCreate, 'fetchCreate');

		return useMutation({
			...options,
			mutationFn: async (data) => await fetchCreate(data),
			onSuccess: (result, variables, onMutateResult, context) => {
				void reload(queryClient, result.id);
				queryClient.setQueryData(keys.detail(result.id), result);
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
				void reload(queryClient, id);
				queryClient.setQueryData(keys.detail(id), result);
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
				void reload(queryClient, id);
				queryClient.removeQueries({ queryKey: keys.detail(id) });
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
