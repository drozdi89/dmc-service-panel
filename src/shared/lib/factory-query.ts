import {
	useQuery,
	type UseQueryOptions,
	type UseQueryResult,
} from '@tanstack/react-query';
import {
	useServerListQuery,
	type UseServerListQueryOptions,
} from '../hooks/useServerListQuery';
import type {
	ApiEnvelope,
	ListQueryParams,
	PaginatedResponse,
} from '../types/listQuery';

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
 * Extracts `response` items from a List Query Contract page.
 *
 * @param page - Paginated list payload (`PaginatedResponse`).
 */
export function selectListItems<T>(page: PaginatedResponse<T>): T[] {
	return page.response;
}

/**
 * Extracts `data` from a standard v2 {@link ApiEnvelope}.
 *
 * @param envelope - API envelope returned by raw `apiRequest` (not `apiRequestData`).
 */
export function selectEnvelopeData<T>(envelope: ApiEnvelope<T>): T {
	return envelope.data;
}

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

/** Config for {@link factoryQuery} (queries only — no mutations). */
export interface FactoryQueryConfig<
	TItem,
	TListParams extends ListQueryParams = ListQueryParams,
	TId = string | number,
> {
	/**
	 * Base query key for the entity, e.g. `['products']`.
	 * Scopes `list` / `lookup` / `detail` are appended by the factory.
	 */
	entry: readonly unknown[];
	/** Admin / table list fetcher (`PaginatedResponse.response`). */
	fetchList?: (params: TListParams) => Promise<PaginatedResponse<TItem>>;
	/** Lookup / select fetcher (`PaginatedResponse.response`). */
	fetchLookup?: (params: TListParams) => Promise<PaginatedResponse<TItem>>;
	/**
	 * Detail fetcher. Prefer unwrapped entity (`apiRequestData`), matching real entity APIs.
	 * If the fetcher returns {@link ApiEnvelope}, pass `select: selectEnvelopeData` in detail options.
	 */
	fetchDetail?: (id: TId, signal?: AbortSignal) => Promise<TItem>;
}

/** Options for list / lookup hooks built by the factory. */
export type FactoryListQueryHookOptions = Pick<
	UseServerListQueryOptions<unknown>,
	'enabled'
>;

/** Options for the detail hook (TanStack `useQuery`, minus fixed key/fn). */
export type FactoryDetailQueryHookOptions<TItem, TSelected = TItem> = Omit<
	UseQueryOptions<TItem, Error, TSelected, readonly unknown[]>,
	'queryKey' | 'queryFn'
>;

/**
 * Query-options object for list / lookup / detail (usable with `useQuery` / prefetch).
 */
export interface FactoryQueryOptionsResult<TData> {
	queryKey: readonly unknown[];
	queryFn: (context: { signal: AbortSignal }) => Promise<TData>;
}

/**
 * Named hooks and query options produced by {@link factoryQuery}.
 *
 * List tables may keep using `useServerListQuery` / `ServerDataTable` directly;
 * this factory supplies entity wrappers with stable keys for list / lookup / detail.
 */
export interface FactoryQueryApi<
	TItem,
	TListParams extends ListQueryParams = ListQueryParams,
	TId = string | number,
> {
	keys: FactoryQueryKeys<TId>;
	/** @see selectListItems */
	selectListItems: typeof selectListItems;
	/** @see selectEnvelopeData */
	selectEnvelopeData: typeof selectEnvelopeData;
	/**
	 * Query options for a list page (`queryKey` + `queryFn`).
	 * @throws If `fetchList` was not configured.
	 */
	listQueryOptions: (
		params: TListParams,
	) => FactoryQueryOptionsResult<PaginatedResponse<TItem>>;
	/**
	 * Query options for a lookup page (`queryKey` + `queryFn`).
	 * @throws If `fetchLookup` was not configured.
	 */
	lookupQueryOptions: (
		params: TListParams,
	) => FactoryQueryOptionsResult<PaginatedResponse<TItem>>;
	/**
	 * Query options for a detail read (`queryKey` + `queryFn`).
	 * @throws If `fetchDetail` was not configured.
	 */
	detailQueryOptions: (id: TId) => FactoryQueryOptionsResult<TItem>;
	/**
	 * List query via `useServerListQuery` with key `[...entry, 'list', params]`.
	 * @throws If `fetchList` was not configured.
	 */
	useListQuery: (
		params: TListParams,
		options?: FactoryListQueryHookOptions,
	) => UseQueryResult<PaginatedResponse<TItem>, Error>;
	/**
	 * Lookup query with key `[...entry, 'lookup', params]`.
	 * @throws If `fetchLookup` was not configured.
	 */
	useLookupQuery: (
		params: TListParams,
		options?: FactoryListQueryHookOptions,
	) => UseQueryResult<PaginatedResponse<TItem>, Error>;
	/**
	 * Detail / read query with key `[...entry, 'detail', id]`.
	 * Supports TanStack `select` (e.g. {@link selectEnvelopeData}).
	 * @throws If `fetchDetail` was not configured.
	 */
	useDetailQuery: <TSelected = TItem>(
		id: TId,
		options?: FactoryDetailQueryHookOptions<TItem, TSelected>,
	) => UseQueryResult<TSelected, Error>;
}

function assertFetcher<T>(
	fetcher: T | undefined,
	name: string,
): asserts fetcher is T {
	if (!fetcher) {
		throw new Error(
			`factoryQuery: "${name}" is not configured for this entity`,
		);
	}
}

/**
 * Builds typed list / lookup / detail query helpers for an entity.
 *
 * **Public API**
 * - `keys` — stable prefixes: `entry` + `'list' | 'lookup' | 'detail'`
 * - `useListQuery` / `listQueryOptions` — `PaginatedResponse` (field `response`, not `items`)
 * - `useLookupQuery` / `lookupQueryOptions` — same contract; keys match AsyncLookupSelect
 * - `useDetailQuery` / `detailQueryOptions` — unwrapped entity (or envelope + `select`)
 * - `selectListItems` / `selectEnvelopeData` — shared select mappers
 *
 * Mutations are out of scope; invalidate via `keys.all()` / scope prefixes from features.
 *
 * @example
 * ```ts
 * const productQueries = factoryQuery({
 *   entry: ['products'],
 *   fetchList: fetchProductsList,
 *   fetchLookup: fetchProductsLookup,
 *   fetchDetail: fetchProduct,
 * });
 * // productQueries.useListQuery({ size: 50, number: 1 })
 * // productQueries.keys.detail(gtin)
 * ```
 */
export function factoryQuery<
	TItem,
	TListParams extends ListQueryParams = ListQueryParams,
	TId = string | number,
>(
	config: FactoryQueryConfig<TItem, TListParams, TId>,
): FactoryQueryApi<TItem, TListParams, TId> {
	const { entry, fetchList, fetchLookup, fetchDetail } = config;

	const keys: FactoryQueryKeys<TId> = {
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

	function listQueryOptions(
		params: TListParams,
	): FactoryQueryOptionsResult<PaginatedResponse<TItem>> {
		assertFetcher(fetchList, 'fetchList');
		return {
			queryKey: keys.list(params),
			queryFn: () => fetchList(params),
		};
	}

	function lookupQueryOptions(
		params: TListParams,
	): FactoryQueryOptionsResult<PaginatedResponse<TItem>> {
		assertFetcher(fetchLookup, 'fetchLookup');
		return {
			queryKey: keys.lookup(params),
			queryFn: () => fetchLookup(params),
		};
	}

	function detailQueryOptions(id: TId): FactoryQueryOptionsResult<TItem> {
		assertFetcher(fetchDetail, 'fetchDetail');
		return {
			queryKey: keys.detail(id),
			queryFn: ({ signal }) => fetchDetail(id, signal),
		};
	}
	function useListQuery(
		params: TListParams,
		options?: FactoryListQueryHookOptions,
	): UseQueryResult<PaginatedResponse<TItem>, Error> {
		assertFetcher(fetchList, 'fetchList');
		return useServerListQuery<TItem>({
			queryKey: keys.list(),
			fetchFn: (listParams) => fetchList(listParams as TListParams),
			params,
			enabled: options?.enabled,
		});
	}

	function useLookupQuery(
		params: TListParams,
		options?: FactoryListQueryHookOptions,
	): UseQueryResult<PaginatedResponse<TItem>, Error> {
		assertFetcher(fetchLookup, 'fetchLookup');
		return useServerListQuery<TItem>({
			queryKey: keys.lookup(),
			fetchFn: (listParams) => fetchLookup(listParams as TListParams),
			params,
			enabled: options?.enabled,
		});
	}

	function useDetailQuery<TSelected = TItem>(
		id: TId,
		options?: FactoryDetailQueryHookOptions<TItem, TSelected>,
	): UseQueryResult<TSelected, Error> {
		assertFetcher(fetchDetail, 'fetchDetail');
		return useQuery<TItem, Error, TSelected, readonly unknown[]>({
			queryKey: keys.detail(id),
			queryFn: ({ signal }) => fetchDetail(id, signal),
			...options,
		});
	}

	return {
		keys,
		selectListItems,
		selectEnvelopeData,
		listQueryOptions,
		lookupQueryOptions,
		detailQueryOptions,
		useListQuery,
		useLookupQuery,
		useDetailQuery,
	};
}
