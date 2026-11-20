import {
  factoryQuery,
  type FactoryDetailQueryHookOptions,
  type FactoryQueryOptionsResult,
} from '@/shared/lib/factory-query';
import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  fetchProduct,
  fetchProductAggregates,
  fetchProductArticles,
  fetchProductCertificates,
  fetchProductGroupOptions,
  fetchProductLicences,
  fetchProductSetContents,
  fetchProductsList,
  fetchProductsLookup,
  type ProductsListParams,
} from '../api/api';
import type {
  Product,
  ProductAggregate,
  ProductArticle,
  ProductCertificate,
  ProductContents,
  ProductGroupOption,
  ProductLicence
} from '../model/types';

/**
 * Canonical TanStack Query entry for the product entity.
 *
 * Keys (entry `['products']`):
 * - all: `['products']` — invalidate root
 * - list: `['products', 'list', params?]`
 * - lookup: `['products', 'lookup', params?]` (AsyncLookupSelect / SelectProduct)
 * - detail: `['products', 'detail', gtin]`
 * - groups: `['products', 'groups']` — prefix for SelectProductGroups
 *   (AsyncSelect / {@link useProductGroupsQuery} append `'select'`)
 * - certificates: `['products', 'certificates', gtin]`
 * - licences: `['products', 'licences', gtin]`
 * - aggregates: `['products', 'aggregates', gtin]`
 *
 * Invalidate after mutations via `productQueries.keys.all()` or related key builders.
 */
export const PRODUCT_QUERY_ENTRY = ['products'] as const;

/** Scope suffix AsyncSelect appends after the groups prefix. */
const PRODUCT_GROUPS_SELECT_SCOPE = 'select' as const;

/**
 * List / lookup / detail helpers via {@link factoryQuery}.
 */
export const productQueries = factoryQuery<Product, ProductsListParams, string>({
  entry: PRODUCT_QUERY_ENTRY,
  fetchList: fetchProductsList,
  fetchLookup: fetchProductsLookup,
  fetchDetail: fetchProduct,
});

/**
 * Extra query-key builders for product groups and GTIN-scoped related lists.
 */
export const productRelatedQueryKeys = {
  /**
   * Prefix for SelectProductGroups (`AsyncSelect` appends `'select'`).
   * Full cache key for the groups query: `['products', 'groups', 'select']`.
   */
  groups: (): readonly unknown[] => [...PRODUCT_QUERY_ENTRY, 'groups'],
  /**
   * Full key shared by {@link useProductGroupsQuery} and SelectProductGroups.
   */
  groupsSelect: (): readonly unknown[] => [
    ...PRODUCT_QUERY_ENTRY,
    'groups',
    PRODUCT_GROUPS_SELECT_SCOPE,
  ],
  /**
   * Certificates linked to a product.
   *
   * @param gtin - Product GTIN.
   */
  certificates: (gtin: string): readonly unknown[] => [
    ...PRODUCT_QUERY_ENTRY,
    'certificates',
    gtin,
  ],
  /**
   * Licences linked to a product.
   *
   * @param gtin - Product GTIN.
   */
  licences: (gtin: string): readonly unknown[] => [
    ...PRODUCT_QUERY_ENTRY,
    'licences',
    gtin,
  ],
  /**
   * Aggregates linked to a product.
   *
   * @param gtin - Product GTIN.
   */
  aggregates: (gtin: string): readonly unknown[] => [
    ...PRODUCT_QUERY_ENTRY,
    'aggregates',
    gtin,
  ],

  contents: (gtin: string): readonly unknown[] => [
    ...PRODUCT_QUERY_ENTRY,
    'contents',
    gtin,
  ],

  articles: (gtin: string): readonly unknown[] => [
    ...PRODUCT_QUERY_ENTRY,
    'articles',
    gtin,
  ],
} as const;

/**
 * Query options for supported product groups (`GET /info`).
 * Key matches SelectProductGroups / AsyncSelect: `['products', 'groups', 'select']`.
 */
export function productGroupsQueryOptions(): FactoryQueryOptionsResult<
  ProductGroupOption[]
> {
  return {
    queryKey: productRelatedQueryKeys.groupsSelect(),
    queryFn: () => fetchProductGroupOptions(),
  };
}

/**
 * Loads supported product groups for filters and SelectProductGroups cache sharing.
 *
 * @param options - TanStack options (without fixed key/fn).
 */
export function useProductGroupsQuery(
  options?: Omit<
    UseQueryOptions<ProductGroupOption[], Error, ProductGroupOption[], readonly unknown[]>,
    'queryKey' | 'queryFn'
  >,
): UseQueryResult<ProductGroupOption[], Error> {
  const { queryKey, queryFn } = productGroupsQueryOptions();
  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
}


export function productContentsQueryOptions(
  gtin: string,
): FactoryQueryOptionsResult<ProductContents[]> {
  return {
    queryKey: productRelatedQueryKeys.contents(gtin),
    queryFn: () => fetchProductSetContents(gtin),
  };
}
export function useProductContentsQuery(
  gtin: string,
  options?: Omit<
    UseQueryOptions<ProductContents[], Error, ProductContents[], readonly unknown[]>,
    'queryKey' | 'queryFn'
  >,
): UseQueryResult<ProductContents[], Error> {
  const { queryKey, queryFn } = productContentsQueryOptions(gtin);
  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
}

export function productAggregatesQueryOptions(
  gtin: string,
): FactoryQueryOptionsResult<ProductAggregate[]> {
  return {
    queryKey: productRelatedQueryKeys.aggregates(gtin),
    queryFn: () => fetchProductAggregates(gtin),
  };
}
export function useProductAggregatesQuery(
  gtin: string,
  options?: Omit<
    UseQueryOptions<ProductAggregate[], Error, ProductAggregate[], readonly unknown[]>,
    'queryKey' | 'queryFn'
  >,
): UseQueryResult<ProductAggregate[], Error> {
  const { queryKey, queryFn } = productAggregatesQueryOptions(gtin);
  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
}

export function productCertificatesQueryOptions(
  gtin: string,
): FactoryQueryOptionsResult<ProductCertificate[]> {
  return {
    queryKey: productRelatedQueryKeys.certificates(gtin),
    queryFn: () => fetchProductCertificates(gtin),
  };
}
export function useProductCertificatesQuery(
  gtin: string,
  options?: Omit<
    UseQueryOptions<ProductCertificate[], Error, ProductCertificate[], readonly unknown[]>,
    'queryKey' | 'queryFn'
  >,
): UseQueryResult<ProductCertificate[], Error> {
  const { queryKey, queryFn } = productCertificatesQueryOptions(gtin);
  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
}

export function productLicencesQueryOptions(
  gtin: string,
): FactoryQueryOptionsResult<ProductLicence[]> {
  return {
    queryKey: productRelatedQueryKeys.licences(gtin),
    queryFn: () => fetchProductLicences(gtin),
  };
}
export function useProductLicencesQuery(
  gtin: string,
  options?: Omit<
    UseQueryOptions<ProductLicence[], Error, ProductLicence[], readonly unknown[]>,
    'queryKey' | 'queryFn'
  >,
): UseQueryResult<ProductLicence[], Error> {
  const { queryKey, queryFn } = productLicencesQueryOptions(gtin);
  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
}



export function productArticlesQueryOptions(
  gtin: string,
): FactoryQueryOptionsResult<ProductArticle[]> {
  return {
    queryKey: productRelatedQueryKeys.articles(gtin),
    queryFn: () => fetchProductArticles(gtin),
  };
}
export function useProductArticlesQuery(
  gtin: string,
  options?: Omit<
    UseQueryOptions<ProductArticle[], Error, ProductArticle[], readonly unknown[]>,
    'queryKey' | 'queryFn'
  >,
): UseQueryResult<ProductArticle[], Error> {
  const { queryKey, queryFn } = productArticlesQueryOptions(gtin);
  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
}


export function useProductDetailQuery<TSelected = Product>(
  gtin: string,
  options?: FactoryDetailQueryHookOptions<Product, TSelected>,
): UseQueryResult<TSelected, Error> {
  return productQueries.useDetailQuery(gtin, options);
}


