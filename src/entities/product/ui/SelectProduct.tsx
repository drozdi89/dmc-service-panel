import {
  AsyncLookupSelect,
  type AsyncLookupSelectProps,
} from '@/shared/ui/AsyncLookupSelect';
import { fetchProductsLookup } from '../api/api';
import type { Product } from '../model/types';
import { productQueries } from '../queries';

/**
 * Server-searchable product select (`AsyncLookupSelect` → `/api/v2/products/lookup`).
 *
 * Uses canonical query keys from {@link productQueries}
 * (`['products', 'lookup', …]`). Pass `extraParams` for `archived` / `product_groups`.
 */
export function SelectProduct(
  props: Omit<
    AsyncLookupSelectProps<Product>,
    'queryKey' | 'fetchFn' | 'mapOption'
  >,
) {
  return (
    <AsyncLookupSelect<Product>
      queryKey={productQueries.keys.all()}
      fetchFn={fetchProductsLookup}
      mapOption={(item) => ({
        value: item.gtin,
        label: `[${item.gtin}] ${item.name}`,
      })}
      {...props}
    />
  );
}
