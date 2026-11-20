import {
  useIdempotentMutation,
} from '@/shared/hooks/useIdempotentMutation';
import { useInvalidatingMutation, type EntityMutationOptions } from '@/shared/queries';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useCallback, useState } from 'react';
import { setProductArchived } from '../api/api';
import type { Product, ProductFormSubmitValues } from '../model/types';
import { persistProductFormValues } from './product-persist';
import { productQueries, productRelatedQueryKeys } from './product-queries';

/**
 * Invalidates product list / lookup / detail under {@link productQueries.keys.all()}.
 *
 * @param queryClient - TanStack Query client.
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
 *
 * @param queryClient - TanStack Query client.
 * @param gtin - Product GTIN whose related caches should refresh.
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
 * Nested picker / list save: full multi-step persist + invalidate, returns saved {@link Product}.
 *
 * Success toast is off by default (inline create should not spam); errors are toasted once.
 * `isPending` covers the entire pipeline (product → aggregates → controller → nested), not
 * only the idempotent mutate calls.
 *
 * @param options.showSuccessMessage - When true, show create/edit success after full save.
 */
export function useProductFormSave(options?: { showSuccessMessage?: boolean }) {
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const showSuccessMessage = options?.showSuccessMessage ?? false;
  const [isPipelinePending, setIsPipelinePending] = useState(false);

  const saveMutation = useIdempotentMutation<Product>();

  const saveProduct = useCallback(
    async (values: ProductFormSubmitValues, editGtin?: string): Promise<Product> => {
      setIsPipelinePending(true);
      try {
        const cached =
          editGtin !== undefined
            ? queryClient.getQueryData<Product>(productQueries.keys.detail(editGtin))
            : undefined;

        const saved = await persistProductFormValues(
          (variables) => saveMutation.mutateAsync(variables),
          values,
          editGtin,
          cached,
        );

        const gtin = saved.gtin || editGtin || values.gtin;
        // Cache refresh must not fail an already-persisted save (toast / close).
        void invalidateProductQueries(queryClient).catch(() => undefined);
        if (gtin) {
          void invalidateProductRelatedQueries(queryClient, gtin).catch(() => undefined);
        }

        if (showSuccessMessage) {
          message.success(editGtin ? 'Продукция сохранена' : 'Продукция создана');
        }

        return saved;
      } catch (error) {
        message.error(
          error instanceof Error ? error.message : 'Не удалось сохранить продукцию',
        );
        throw error;
      } finally {
        setIsPipelinePending(false);
      }
    },
    [message, queryClient, saveMutation, showSuccessMessage],
  );

  return {
    saveProduct,
    isPending: isPipelinePending || saveMutation.isPending,
    saveMutation,
  };
}
