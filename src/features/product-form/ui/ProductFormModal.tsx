import {
  DEFAULT_PRODUCT_FORM_VALUES,
  EMPTY_PRODUCT_FORM_REMOVED_IDS,
  mapProductToFormValues,
  useProductAggregatesQuery,
  useProductArticlesQuery,
  useProductCertificatesQuery,
  useProductContentsQuery,
  useProductDetailQuery,
  useProductLicencesQuery,
  type ProductFormRemovedIds,
  type ProductFormSubmitValues,
  type ProductFormValues,
} from '@/entities/product';
import type { ResourceFormSubmitOptions } from '@/shared/model/resourceFormUiBridge';
import { resourceFormModalFooter } from '@/shared/ui/ResourceFormModalFooter';
import { LoadingOverlay } from '@/shared/ui/loading';
import { Alert, Form, Modal } from 'antd';
import { useEffect, useState } from 'react';
import { ProductFormModalTabs } from './ProductFormModalTabs';

/**
 * Props for product create/edit modal (ResourcePicker-ready).
 *
 * Preferred contract:
 * - `mode` + `gtin` (edit loads detail via {@link useProductDetailQuery})
 * - stable `onSubmit` / `submitting` / `onCancel`
 * Save orchestration lives in the product FormModalHost (widgets/product).
 */
export interface ProductFormModalProps {
  open: boolean;
  title?: string;
  mode: 'create' | 'edit';
  /** Product GTIN for `mode='edit'` when the modal loads detail itself. */
  gtin?: string;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (
    values: ProductFormSubmitValues,
    options: ResourceFormSubmitOptions,
  ) => void;
}



/**
 * Product detail/edit modal with tabs for main data, certificates, licences and aggregates.
 *
 * Validates and calls `onSubmit` with form values; does not persist — Host owns save.
 */
export function ProductFormModal({
  open,
  title,
  mode,
  gtin,
  submitting = false,
  onCancel,
  onSubmit,
}: ProductFormModalProps) {
  const isEdit = mode === 'edit';
  const [form] = Form.useForm<ProductFormValues>();
  const [removedIds, setRemovedIds] = useState<ProductFormRemovedIds>(
    EMPTY_PRODUCT_FORM_REMOVED_IDS,
  );
  const detailGtin = gtin ?? '';

  const canLoad = open && isEdit && Boolean(detailGtin);

  const {
    data: product,
    isLoading: productLoading,
    isFetching: productFetching,
    isError: isLoadError,
  } = useProductDetailQuery(detailGtin, {
    enabled: canLoad,
  });

  const certsQuery = useProductCertificatesQuery(detailGtin, {
    enabled: canLoad,
  });
  const licencesQuery = useProductLicencesQuery(detailGtin, {
    enabled: canLoad,
  });
  const aggregatesQuery = useProductAggregatesQuery(detailGtin, {
    enabled: canLoad,
  });
  const contentsQuery = useProductContentsQuery(detailGtin, {
		enabled: canLoad,
	});
  const articlesQuery = useProductArticlesQuery(detailGtin, {
    enabled: canLoad,
  });

  useEffect(() => {
    if (!open) {
      setRemovedIds(EMPTY_PRODUCT_FORM_REMOVED_IDS);
      return;
    }
    if (canLoad) {
      if (product) {
        form.setFieldsValue(mapProductToFormValues(product));
        setRemovedIds(EMPTY_PRODUCT_FORM_REMOVED_IDS);
        // Re-apply nested lists after product hydrate — product refetch must not
        // leave packaging/certs empty when related queries already have data.
        if (aggregatesQuery.data) {
          form.setFieldValue('aggregates', [...aggregatesQuery.data]);
        }
        if (certsQuery.data) {
          form.setFieldValue('certificates', [...certsQuery.data]);
        }
        if (licencesQuery.data) {
          form.setFieldValue('licences', [...licencesQuery.data]);
        }
        if (articlesQuery.data) {
          form.setFieldValue('articles', [...articlesQuery.data]);
        }
      }
      return;
    }
    form.setFieldsValue(DEFAULT_PRODUCT_FORM_VALUES);
    setRemovedIds(EMPTY_PRODUCT_FORM_REMOVED_IDS);
  }, [
    open,
    product,
    canLoad,
    form,
    aggregatesQuery.data,
    certsQuery.data,
    licencesQuery.data,
    articlesQuery.data,
  ]);

  useEffect(() => {
    if (!open || aggregatesQuery.data === undefined) {
      return;
    }
    form.setFieldValue('aggregates', [...aggregatesQuery.data]);
  }, [aggregatesQuery.data, form, open]);
  useEffect(() => {
    if (!open || certsQuery.data === undefined) {
      return;
    }
    form.setFieldValue('certificates', [...certsQuery.data]);
  }, [certsQuery.data, form, open]);
  useEffect(() => {
    if (!open || licencesQuery.data === undefined) {
      return;
    }
    form.setFieldValue('licences', [...licencesQuery.data]);
  }, [licencesQuery.data, form, open]);
  useEffect(() => {
    if (!open || articlesQuery.data === undefined) {
      return;
    }
    form.setFieldValue('articles', [...articlesQuery.data]);
  }, [articlesQuery.data, form, open]);

  const resolvedTitle =
    title ?? (isEdit ? `Продукция ${gtin ?? ''}` : 'Новая продукция');

  const detailLoading = canLoad && (productLoading || productFetching);
  const submitDisabled =
    submitting ||
    (canLoad && (productLoading || isLoadError || !product));



  return (
    <Modal
      open={open}
      forceRender
      destroyOnHidden={false}
      title={resolvedTitle}
      width='calc(100vw - 2rem)'
      onCancel={onCancel}
      keyboard={!submitting}
      style={{ top: '1rem' }}
      styles={{
        body: {
          height: 'calc(100vh - 10rem)',
          overflowY: 'auto',
          overflowX: 'hidden',
        },
      }}
      footer={resourceFormModalFooter({
        submitting,
        submitDisabled,
        onCancel,
        onSubmit: (options) => {
          void (async () => {
            try {
              await form.validateFields();
              /** Prefer full store: `validateFields()` can omit nested/noStyle fields. */
              const values = form.getFieldsValue(true) as ProductFormValues;
              onSubmit({ ...values, ...removedIds }, options);
            } catch {
              // Validation errors are shown on form fields.
            }
          })();
        },
      })}
    >
      <LoadingOverlay loading={detailLoading}>
        {isLoadError && canLoad ? (
          <Alert
            type="error"
            showIcon
            message="Не удалось загрузить данные продукции"
            description="Сохранение недоступно. Закройте окно и попробуйте снова."
            style={{ marginBottom: 16 }}
          />
        ) : null}
        <ProductFormModalTabs
          form={form}
          isEdit={isEdit}
          product={product}
          gtin={gtin}
          contents={contentsQuery.data}
          contentsLoading={contentsQuery.isFetching}
          aggregatesLoading={aggregatesQuery.isFetching}
          certsLoading={certsQuery.isFetching}
          licencesLoading={licencesQuery.isFetching}
          productLoading={productLoading}
          articlesLoading={articlesQuery.isFetching}
          removedIds={removedIds}
          onRemovedIdsChange={setRemovedIds}
        />
      </LoadingOverlay>
    </Modal>
  );
}
