import { createIdempotencyKey } from '@/shared/api';
import { factoryMutation, factoryQuery } from '@/shared/queries';
import type { ListQueryParams } from '@/shared/types/listQuery';
import {
  createFactoryNumber,
  deleteFactoryNumbers,
  fetchFactoryNumbers,
  updateFactoryNumber,
} from '../api/api';
import type { FactoryNumberRow } from '../model/types';
import { FACTORY_NUMBERS_QUERY_KEY } from './keys';

const queryApi = factoryQuery<FactoryNumberRow, ListQueryParams, number>({
  entry: FACTORY_NUMBERS_QUERY_KEY,
  fetchList: fetchFactoryNumbers,
  fetchLookup: fetchFactoryNumbers,
});

const mutationApi = factoryMutation<FactoryNumberRow, number>({
  entry: FACTORY_NUMBERS_QUERY_KEY,
  fetchCreate: ({ factory_number = '', is_default = false }) =>
    createFactoryNumber({ factory_number, is_default }, createIdempotencyKey()),
  fetchUpdate: (id, { factory_number, is_default }) =>
    updateFactoryNumber(id, { factory_number, is_default }, createIdempotencyKey()),
  fetchDelete: async (id) => {
    await deleteFactoryNumbers([id], createIdempotencyKey());
    return null;
  },
});

/**
 * List / lookup / create / update / delete for factory numbers.
 *
 * Keys: {@link FACTORY_NUMBERS_QUERY_KEY}.
 */
export const factoryNumbersQueries = {
  ...queryApi,
  ...mutationApi,
};

/** @see factoryNumbersQueries.useListQuery */
export const useFactoryNumbersListQuery = factoryNumbersQueries.useListQuery;

/** @see factoryNumbersQueries.useLookupQuery */
export const useFactoryNumbersLookupQuery = factoryNumbersQueries.useLookupQuery;