import { CRPT_TEMPLATES_QUERY_KEY } from '@/entities/integration';
import type { Product } from '@/entities/product';
import { createIdempotencyKey } from '@/shared/api';
import { useInvalidatingMutation, type EntityMutationOptions } from '@/shared/queries';
import { useQuery, type QueryKey, type UseQueryResult } from '@tanstack/react-query';
import { fetchIntegrationProducts, updateProductCrptTemplate } from './integration-service';

/**
 * All non-archived products for an integration drawer.
 *
 * @param queryKey - Drawer-scoped key (`AUTOSEND_PRODUCTS_QUERY_KEY`, `CRPT_TEMPLATES_QUERY_KEY`).
 * @param enabled - Load only while the drawer is open.
 */
export function useIntegrationProductsQuery(
  queryKey: QueryKey,
  enabled: boolean,
): UseQueryResult<Product[], Error> {
  return useQuery({ queryKey, queryFn: fetchIntegrationProducts, enabled });
}

/** Changed CRPT template index for one product. */
export interface ProductCrptTemplateChange {
  gtin: string;
  crpt_template_idx: number;
}

/**
 * PATCHes `crpt_template_idx` for each changed product.
 *
 * @returns Number of saved products.
 */
export function useSaveProductCrptTemplatesMutation(
  options?: EntityMutationOptions<number, ProductCrptTemplateChange[]>,
) {
  return useInvalidatingMutation({
    ...options,
    invalidate: [CRPT_TEMPLATES_QUERY_KEY],
    mutationFn: async (changed: ProductCrptTemplateChange[]) => {
      await Promise.all(
        changed.map((row) =>
          updateProductCrptTemplate(row.gtin, row.crpt_template_idx, createIdempotencyKey()),
        ),
      );
      return changed.length;
    },
  });
}
