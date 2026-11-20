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
import { queriesOptionsKeys, type FactoryQueryKeys } from './options';

/**
 * Extracts `response` items from a List Query Contract page.
 * `apiRequestData` already unwraps the v2 envelope, so the page is
 * {@link PaginatedResponse} (`response`, not `data.response` and not `items`).
 *
 * @param page - Paginated list payload.
 */
export function selectListItems<T>(page: PaginatedResponse<T>): T[] {
	return page.response;
}

/**
 * Extracts `data` from a standard v2 {@link ApiEnvelope}.
 * Use as `select` when the detail fetcher returns the raw envelope
 * (`apiRequest`) instead of `apiRequestData`.
 *
 * @param envelope - API envelope.
 */
export function selectEnvelopeData<T>(envelope: ApiEnvelope<T>): T {
	return envelope.data;
}

/** Config for {@link factoryQuery} (queries only — mutations are {@link import('./factory-mutation').factoryMutation}). */
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
	/**
	 * Lookup / select fetcher. Separate from `fetchList`: lookup hits its own
	 * endpoint (or the same function passed explicitly when the endpoint is shared).
	 */
	fetchLookup?: (params: TListParams) => Promise<PaginatedResponse<TItem>>;
	/**
	 * Detail fetcher. Prefer the unwrapped entity (`apiRequestData`).
	 * If the fetcher returns {@link ApiEnvelope}, pass `select: selectEnvelopeData`.
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
	 * Keeps the previous page while the next page loads.
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
		throw new Error(`factoryQuery: "${name}" is not configured for this entity`);
	}
}

/**
 * Builds typed list / lookup / detail query helpers for an entity.
 *
 * **Public API**
 * - `keys` — stable prefixes: `entry` + `'list' | 'lookup' | 'detail'`
 * - `useListQuery` / `listQueryOptions` — `PaginatedResponse` (field `response`)
 * - `useLookupQuery` / `lookupQueryOptions` — own fetcher; keys match AsyncLookupSelect
 * - `useDetailQuery` / `detailQueryOptions` — unwrapped entity (or envelope + `select`)
 * - `selectListItems` / `selectEnvelopeData` — shared select mappers
 *
 * @example
 * ```ts
 * const productQueries = factoryQuery({
 *   entry: ['products'],
 *   fetchList: fetchProductsList,
 *   fetchLookup: fetchProductsLookup,
 *   fetchDetail: fetchProduct,
 * });
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
	const keys = queriesOptionsKeys<TId>(entry);

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
