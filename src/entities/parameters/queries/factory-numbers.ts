import { factoryQuery } from '@/shared/lib/factory-query';
import type { ListQueryParams } from '@/shared/types/listQuery';
import { fetchFactoryNumbers } from '../api/api';
import type { FactoryNumberRow } from '../model/types';
import { FACTORY_NUMBERS_QUERY_KEY } from './keys';

/**
 * List / lookup queries for factory numbers.
 *
 * Keys: `['parameters', 'factory-numbers', 'list'|'lookup', …]`.
 * Pass {@link factoryNumbersQueries.keys.all} as `queryKey` to AsyncLookupSelect
 * (factory appends `'lookup'` + params).
 *
 * No detail endpoint — only list/lookup. Invalidate via `keys.all()`.
 */
export const factoryNumbersQueries = factoryQuery<
  FactoryNumberRow,
  ListQueryParams,
  number
>({
  entry: FACTORY_NUMBERS_QUERY_KEY,
  fetchList: fetchFactoryNumbers,
  fetchLookup: fetchFactoryNumbers,
});

/** @see factoryNumbersQueries.useListQuery */
export const useFactoryNumbersListQuery = factoryNumbersQueries.useListQuery;

/** @see factoryNumbersQueries.useLookupQuery */
export const useFactoryNumbersLookupQuery = factoryNumbersQueries.useLookupQuery;
