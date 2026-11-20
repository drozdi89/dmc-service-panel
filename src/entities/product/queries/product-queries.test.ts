import { describe, expect, it } from 'vitest';
import { FACTORY_QUERY_SCOPES } from '@/shared/queries';
import {
  PRODUCT_QUERY_ENTRY,
  productQueries,
  productRelatedQueryKeys,
} from './product-queries';

describe('productQueries keys', () => {
  it('uses entry products with list / lookup / detail scopes', () => {
    const params = { size: 20, number: 0, q: 'milk', archived: false };

    expect(productQueries.keys.all()).toEqual([...PRODUCT_QUERY_ENTRY]);
    expect(productQueries.keys.list()).toEqual([
      ...PRODUCT_QUERY_ENTRY,
      FACTORY_QUERY_SCOPES.list,
    ]);
    expect(productQueries.keys.list(params)).toEqual([
      ...PRODUCT_QUERY_ENTRY,
      FACTORY_QUERY_SCOPES.list,
      params,
    ]);
    expect(productQueries.keys.lookup()).toEqual([
      ...PRODUCT_QUERY_ENTRY,
      FACTORY_QUERY_SCOPES.lookup,
    ]);
    expect(productQueries.keys.lookup(params)).toEqual([
      ...PRODUCT_QUERY_ENTRY,
      FACTORY_QUERY_SCOPES.lookup,
      params,
    ]);
    expect(productQueries.keys.detail('04601234567890')).toEqual([
      ...PRODUCT_QUERY_ENTRY,
      FACTORY_QUERY_SCOPES.detail,
      '04601234567890',
    ]);
  });

  it('builds related keys for groups / certificates / licences / aggregates', () => {
    const gtin = '04601234567890';

    expect(productRelatedQueryKeys.groups()).toEqual(['products', 'groups']);
    expect(productRelatedQueryKeys.groupsSelect()).toEqual([
      'products',
      'groups',
      'select',
    ]);
    expect(productRelatedQueryKeys.certificates(gtin)).toEqual([
      'products',
      'certificates',
      gtin,
    ]);
    expect(productRelatedQueryKeys.licences(gtin)).toEqual([
      'products',
      'licences',
      gtin,
    ]);
    expect(productRelatedQueryKeys.aggregates(gtin)).toEqual([
      'products',
      'aggregates',
      gtin,
    ]);
  });
});
