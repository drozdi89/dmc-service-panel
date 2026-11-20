import { createIdempotencyKey } from '@/shared/api';
import { factoryMutation, useInvalidatingMutation, type EntityMutationOptions } from '@/shared/queries';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { createProduct, setProductArchived, updateProduct } from '../api/api';
import type { Product, ProductCreatePayload, ProductUpdatePayload } from '../model/types';
import { productQueries, productRelatedQueryKeys } from './product-queries';

/** Product row with `id` (= gtin) for {@link factoryMutation} detail cache. */
export type ProductMutationItem = Product & { id: string };

function withMutationId(row: Product): ProductMutationItem {
  return { ...row, id: row.gtin };
}

/** Create / update mutations for the product resource (no list delete here). */
export const productFactory = factoryMutation<ProductMutationItem, string>({
  entry: ['products'],
  fetchCreate: (data) =>
    createProduct(data as ProductCreatePayload, createIdempotencyKey()).then(withMutationId),
  fetchUpdate: (id, data) =>
    updateProduct(id, data as ProductUpdatePayload, createIdempotencyKey()).then(withMutationId),
});

/**
 * Invalidates product list / lookup / detail under {@link productQueries.keys.all()}.
 */
export async function invalidateProductQueries(
  queryClient: QueryClient,
): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: productQueries.keys.all(),
  });
}

/**
 * Invalidates GTIN-scoped nested product lists after a full form save.
 */
export async function invalidateProductRelatedQueries(
  queryClient: QueryClient,
  gtin: string,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: productRelatedQueryKeys.aggregates(gtin),
    }),
    queryClient.invalidateQueries({
      queryKey: productRelatedQueryKeys.certificates(gtin),
    }),
    queryClient.invalidateQueries({
      queryKey: productRelatedQueryKeys.licences(gtin),
    }),
    queryClient.invalidateQueries({
      queryKey: productRelatedQueryKeys.articles(gtin),
    }),
  ]);
}

/** Variables for {@link useSetProductArchivedMutation}. */
export interface SetProductArchivedVariables {
  gtin: string;
  archived: boolean;
}

/** Archives or restores a product (PATCH `archived`). */
export function useSetProductArchivedMutation(
  options?: EntityMutationOptions<Product, SetProductArchivedVariables>,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [productQueries.keys.all()],
    mutationFn: ({ gtin, archived }: SetProductArchivedVariables) =>
      setProductArchived(gtin, archived),
  });
}