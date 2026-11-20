import { describe, expect, it } from 'vitest';
import { defineQueryOptions, QUERY_DEFAULTS } from '../options';

describe('defineQueryOptions', () => {
	it('applies shared cache defaults', () => {
		const options = defineQueryOptions({
			queryKey: ['demo'],
			queryFn: async () => 'ok',
		});
		expect(options.staleTime).toBe(QUERY_DEFAULTS.staleTime);
		expect(options.gcTime).toBe(QUERY_DEFAULTS.gcTime);
		expect(options.retry).toBe(false);
		expect(options.queryKey).toEqual(['demo']);
	});

	it('lets the caller override a default', () => {
		const options = defineQueryOptions({
			queryKey: ['demo'],
			queryFn: async () => 'ok',
			staleTime: 5,
		});
		expect(options.staleTime).toBe(5);
		expect(options.gcTime).toBe(QUERY_DEFAULTS.gcTime);
	});
});
