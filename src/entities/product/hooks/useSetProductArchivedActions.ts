import { App } from 'antd';
import { useSetProductArchivedMutation } from '../queries/product-mutations';

/** Archive / restore product with success and error toasts. */
export function useSetProductArchivedActions() {
  const { message } = App.useApp();

  return useSetProductArchivedMutation({
    onSuccess: (product) => {
      message.success(
        product.archived ? 'Продукция архивирована' : 'Продукция восстановлена',
      );
    },
    onError: (error) => {
      message.error(error.message);
    },
  });
}