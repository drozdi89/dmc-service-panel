import { fetchProductsList, updateProduct, type Product } from '@/entities/product';

/**
 * Fetches all non-archived products for integration drawers (templates, autosend names).
 *
 * @returns Flat list of products across all pages.
 */
export async function fetchIntegrationProducts(): Promise<Product[]> {
  const pageSize = 200;
  const first = await fetchProductsList({
    size: pageSize,
    number: 0,
    archived: false,
  });
  const items = [...first.response];
  if (first.total_records > pageSize) {
    const pages = Math.ceil(first.total_records / pageSize);
    const rest = await Promise.all(
      Array.from({ length: pages - 1 }, (_, index) =>
        fetchProductsList({
          size: pageSize,
          number: index + 1,
          archived: false,
        }),
      ),
    );
    for (const page of rest) {
      items.push(...page.response);
    }
  }
  return items;
}

/**
 * Updates product CRPT template index with idempotent PATCH.
 *
 * @param gtin - Product GTIN.
 * @param crptTemplateIdx - Template index (0 long, 1 short).
 * @param idempotencyKey - Idempotency key for PATCH.
 */
export async function updateProductCrptTemplate(
  gtin: string,
  crptTemplateIdx: number,
  idempotencyKey: string,
): Promise<Product> {
  return updateProduct(gtin, { crpt_template_idx: crptTemplateIdx }, idempotencyKey);
}
