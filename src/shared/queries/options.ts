import { queryOptions, type QueryKey } from '@tanstack/react-query';
import type { ListQueryParams } from '../types/listQuery';

/** Stable scopes appended after the entity `entry` key. */
export const FACTORY_QUERY_SCOPES = {
	list: 'list',
	lookup: 'lookup',
	detail: 'detail',
} as const;

/** Query key scope for list / lookup / detail. */
export type FactoryQueryScope =
	(typeof FACTORY_QUERY_SCOPES)[keyof typeof FACTORY_QUERY_SCOPES];

/**
 * Opt-in cache timings for {@link defineQueryOptions}.
 * `factoryQuery` does not apply them: list hooks follow `useServerListQuery`
 * and the app `QueryClient`.
 */
export const QUERY_DEFAULTS = {
	staleTime: 120_000,
	gcTime: 10 * 60 * 1000,
	retry: false,
} as const;

/** Canonical query-key builders for an entity entry. */
export interface FactoryQueryKeys<TId = string | number> {
	/** Root prefix for `invalidateQueries({ queryKey: keys.all() })`. */
	all: () => readonly unknown[];
	/**
	 * List key. With params: `[...entry, 'list', params]`.
	 * Without params (prefix for `useServerListQuery` / tables): `[...entry, 'list']`.
	 */
	list: (params?: ListQueryParams) => readonly unknown[];
	/**
	 * Lookup key. With params: `[...entry, 'lookup', params]`
	 * (same shape as AsyncLookupSelect: `[...queryKey, 'lookup', params]`).
	 */
	lookup: (params?: ListQueryParams) => readonly unknown[];
	/** Detail key: `[...entry, 'detail', id]`. */
	detail: (id: TId) => readonly unknown[];
}

/**
 * Builds list / lookup / detail keys for one entity entry.
 *
 * @param entry - Base query key, e.g. `['products']`.
 */
export function queriesOptionsKeys<TId = string | number>(
	entry: readonly unknown[],
): FactoryQueryKeys<TId> {
	return {
		all: () => entry,
		list: (params) =>
			params === undefined
				? [...entry, FACTORY_QUERY_SCOPES.list]
				: [...entry, FACTORY_QUERY_SCOPES.list, params],
		lookup: (params) =>
			params === undefined
				? [...entry, FACTORY_QUERY_SCOPES.lookup]
				: [...entry, FACTORY_QUERY_SCOPES.lookup, params],
		detail: (id) => [...entry, FACTORY_QUERY_SCOPES.detail, id],
	};
}

/**
 * Shared cache timings plus a concrete key and queryFn.
 * Callers may override any default. Use for one-off queries that are not
 * list / lookup / detail from {@link import('./factory-query').factoryQuery}.
 */
export function defineQueryOptions<
	TQueryFnData = unknown,
	TError = Error,
	TData = TQueryFnData,
	TQueryKey extends QueryKey = QueryKey,
>(
	options: Parameters<
		typeof queryOptions<TQueryFnData, TError, TData, TQueryKey>
	>[0],
) {
	return queryOptions<TQueryFnData, TError, TData, TQueryKey>({
		...QUERY_DEFAULTS,
		...options,
	});
}
