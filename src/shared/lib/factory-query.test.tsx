import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type {
	ApiEnvelope,
	ListQueryParams,
	PaginatedResponse,
} from '../types/listQuery';
import {
	FACTORY_QUERY_SCOPES,
	factoryQuery,
	selectEnvelopeData,
	selectListItems,
} from './factory-query';

interface Item {
	id: number;
	name: string;
}

function createPage(items: Item[]): PaginatedResponse<Item> {
	return {
		page: 1,
		next_page: 1,
		previous_page: 1,
		size: 50,
		total_records: items.length,
		response: items,
	};
}

function createWrapper() {
	const client = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
		},
	});

	return function Wrapper({ children }: { children: ReactNode }) {
		return (
			<QueryClientProvider client={client}>{children}</QueryClientProvider>
		);
	};
}

describe('selectListItems / selectEnvelopeData', () => {
	it('maps PaginatedResponse.response (not items)', () => {
		const page = createPage([{ id: 1, name: 'a' }]);
		expect(selectListItems(page)).toEqual([{ id: 1, name: 'a' }]);
		expect(page).not.toHaveProperty('items');
	});

	it('maps ApiEnvelope.data', () => {
		const envelope: ApiEnvelope<Item> = {
			success: true,
			data: { id: 2, name: 'b' },
		};
		expect(selectEnvelopeData(envelope)).toEqual({ id: 2, name: 'b' });
	});
});

describe('factoryQuery keys', () => {
	it('builds stable list / lookup / detail keys from entry', () => {
		const { keys } = factoryQuery<Item>({
			entry: ['products'],
		});
		const params = { size: 20, number: 0, q: 'cam' };

		expect(keys.all()).toEqual(['products']);
		expect(keys.list()).toEqual(['products', FACTORY_QUERY_SCOPES.list]);
		expect(keys.list(params)).toEqual([
			'products',
			FACTORY_QUERY_SCOPES.list,
			params,
		]);
		expect(keys.lookup()).toEqual(['products', FACTORY_QUERY_SCOPES.lookup]);
		expect(keys.lookup(params)).toEqual([
			'products',
			FACTORY_QUERY_SCOPES.lookup,
			params,
		]);
		expect(keys.detail(42)).toEqual([
			'products',
			FACTORY_QUERY_SCOPES.detail,
			42,
		]);
	});
});

describe('factoryQuery hooks and queryOptions', () => {
	const items = [{ id: 1, name: 'cam-1' }];
	const page = createPage(items);

	it('useListQuery fetches PaginatedResponse and uses list key + params', async () => {
		const fetchList = vi.fn().mockResolvedValue(page);
		const params = { size: 50, number: 1 };
		const api = factoryQuery<Item>({
			entry: ['devices'],
			fetchList,
		});

		const { result } = renderHook(() => api.useListQuery(params), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(fetchList).toHaveBeenCalledWith(params);
		expect(result.current.data).toEqual(page);
		expect(selectListItems(result.current.data!)).toEqual(items);
		expect(api.listQueryOptions(params).queryKey).toEqual([
			'devices',
			'list',
			params,
		]);
	});

	it('useLookupQuery uses lookup scope matching AsyncLookupSelect shape', async () => {
		const fetchLookup = vi.fn().mockResolvedValue(page);
		const params = { size: 20, number: 0, q: 'x' };
		const api = factoryQuery<Item>({
			entry: ['devices'],
			fetchLookup,
		});

		const { result } = renderHook(() => api.useLookupQuery(params), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(fetchLookup).toHaveBeenCalledWith(params);
		expect(api.lookupQueryOptions(params).queryKey).toEqual([
			'devices',
			'lookup',
			params,
		]);
	});

	it('useDetailQuery returns entity and applies select mapping', async () => {
		const entity = { id: 7, name: 'detail' };
		const fetchDetail = vi.fn().mockResolvedValue(entity);
		const api = factoryQuery<Item, ListQueryParams, number>({
			entry: ['devices'],
			fetchDetail,
		});

		const { result } = renderHook(
			() =>
				api.useDetailQuery(7, {
					select: (data) => data.name,
				}),
			{ wrapper: createWrapper() },
		);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(fetchDetail).toHaveBeenCalledWith(7, expect.any(AbortSignal));
		expect(result.current.data).toBe('detail');
		expect(api.detailQueryOptions(7).queryKey).toEqual([
			'devices',
			'detail',
			7,
		]);
	});

	it('useDetailQuery can select ApiEnvelope.data via selectEnvelopeData', async () => {
		const envelope: ApiEnvelope<Item> = {
			success: true,
			data: { id: 3, name: 'env' },
		};
		const fetchDetail = vi
			.fn()
			.mockResolvedValue(envelope as unknown as Item);
		const api = factoryQuery<Item>({
			entry: ['products'],
			fetchDetail,
		});

		const { result } = renderHook(
			() =>
				api.useDetailQuery('gtin-1', {
					select: (raw) =>
						selectEnvelopeData(raw as unknown as ApiEnvelope<Item>),
				}),
			{ wrapper: createWrapper() },
		);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual({ id: 3, name: 'env' });
	});

	it('throws when calling a hook without the matching fetcher', () => {
		const api = factoryQuery<Item>({ entry: ['products'] });

		expect(() => api.listQueryOptions({ size: 10 })).toThrow(/fetchList/);
		expect(() => api.lookupQueryOptions({ size: 10 })).toThrow(/fetchLookup/);
		expect(() => api.detailQueryOptions('x')).toThrow(/fetchDetail/);
	});
});
