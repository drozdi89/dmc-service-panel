import { useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useCallback, useState } from 'react';
import type { Product, ProductFormSubmitValues } from '../model/types';
import {
  invalidateProductQueries,
  invalidateProductRelatedQueries,
} from '../queries/product-mutations';
import { persistProductFormValues } from '../queries/product-persist';
import { productQueries } from '../queries/product-queries';

/**
 * Nested picker / list save: full multi-step persist + invalidate, returns saved {@link Product}.
 *
 * @param options.showSuccessMessage - When true, show create/edit success after full save.
 */
export function useProductFormSave(options?: { showSuccessMessage?: boolean }) {
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const showSuccessMessage = options?.showSuccessMessage ?? false;
  const [isPipelinePending, setIsPipelinePending] = useState(false);

  const saveProduct = useCallback(
    async (values: ProductFormSubmitValues, editGtin?: string): Promise<Product> => {
      setIsPipelinePending(true);
      try {
        const cached =
          editGtin !== undefined
            ? queryClient.getQueryData<Product>(productQueries.keys.detail(editGtin))
            : undefined;

        const saved = await persistProductFormValues(values, editGtin, cached);

        const gtin = saved.gtin || editGtin || values.gtin;
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
    [message, queryClient, showSuccessMessage],
  );

  return {
    saveProduct,
    isPending: isPipelinePending,
  };
}