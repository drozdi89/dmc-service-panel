import { App, Typography } from 'antd';
import { useCallback } from 'react';
import type { Product } from '../model/types';
import { useSetProductArchivedMutation } from '../queries/product-mutations';

/** Archive / restore product with confirmation, success and error toasts. */
export function useSetProductArchivedActions() {
  const { message, modal } = App.useApp();

  const mutation = useSetProductArchivedMutation({
    onSuccess: (product) => {
      message.success(
        product.archived ? 'Продукция архивирована' : 'Продукция восстановлена',
      );
    },
    onError: (error) => {
      message.error(error.message);
    },
  });

  const confirmToggleArchived = useCallback(
    (product: Product) => {
      const nextArchived = !product.archived;

      modal.confirm({
        title: nextArchived ? 'Архивировать продукцию?' : 'Восстановить продукцию?',
        content: (
          <>
            {nextArchived ? 'Архивировать' : 'Восстановить'} карточку{' '}
            <Typography.Text strong>
              [{product.gtin}] {product.name}
            </Typography.Text>
            ?
          </>
        ),
        okText: nextArchived ? 'Архивировать' : 'Восстановить',
        cancelText: 'Отмена',
        onOk: async () => {
          try {
            await mutation.mutateAsync({
              gtin: product.gtin,
              archived: nextArchived,
            });
          } catch {
            // Error toast is shown by mutation onError.
          }
        },
      });
    },
    [modal, mutation],
  );

  return {
    confirmToggleArchived,
    isPending: mutation.isPending,
  };
}
