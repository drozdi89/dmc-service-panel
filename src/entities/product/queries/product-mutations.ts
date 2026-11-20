import { useIdempotentMutation } from '@/shared/hooks/useIdempotentMutation';
import { useInvalidatingMutation, type EntityMutationOptions } from '@/shared/queries';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { setProductArchived } from '../api/api';
import type { Product } from '../model/types';
import { productQueries, productRelatedQueryKeys } from './product-queries';

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

/**
 * Idempotent mutate helper used by {@link import('../hooks/useProductFormSave').useProductFormSave}.
 */
export function useProductSaveMutation() {
  return useIdempotentMutation<Product>();
}