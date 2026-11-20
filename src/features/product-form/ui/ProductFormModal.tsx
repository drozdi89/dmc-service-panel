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
  visibilityFormControl,
  type ProductFormRemovedIds,
  type ProductFormSubmitValues,
  type ProductFormValues,
} from '@/entities/product';
import type { ResourceFormSubmitOptions } from '@/shared/model/resourceFormUiBridge';
import { resourceFormModalFooter } from '@/shared/ui/ResourceFormModalFooter';
import { LoadingOverlay } from '@/shared/ui/loading';
import { Alert, Form, Modal, Tabs } from 'antd';
import { useEffect, useState } from 'react';
import {
  ProductAdditionalTab,
  ProductAggregatesTab,
  ProductArticlesTab,
  ProductCertificatesTab,
  ProductCompoundTab,
  ProductControllerParamsTab,
  ProductLicencesTab,
  ProductMainTab
} from './productFormTabs';

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
  const [activeTab, setActiveTab] = useState('main');
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

  const visibility = visibilityFormControl(form.getFieldsValue());

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setActiveTab('main');
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
    if (aggregatesQuery.data !== undefined) {
      form.setFieldValue('aggregates', [...aggregatesQuery.data]);
    }
  }, [aggregatesQuery.data, form]);
  useEffect(() => {
    if (certsQuery.data !== undefined) {
      form.setFieldValue('certificates', [...certsQuery.data]);
    }
  }, [certsQuery.data, form]);
  useEffect(() => {
    if (licencesQuery.data !== undefined) {
      form.setFieldValue('licences', [...licencesQuery.data]);
    }
  }, [licencesQuery.data, form]);
  useEffect(() => {
    if (articlesQuery.data !== undefined) {
      form.setFieldValue('articles', [...articlesQuery.data]);
    }
  }, [articlesQuery.data, form]);

  const resolvedTitle =
    title ?? (isEdit ? `Продукция ${gtin ?? ''}` : 'Новая продукция');

  const detailLoading = canLoad && (productLoading || productFetching);
  const submitDisabled =
    submitting ||
    (canLoad && (productLoading || isLoadError || !product));



  return (
    <Modal
      open={open}
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
        <Form form={form} labelCol={{ span: 8 }}>
          <Form.Item name="pg" hidden></Form.Item>
          <Form.Item name="type" hidden></Form.Item>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'main',
                label: 'Основное',
                forceRender: true,
                children: (
                  <ProductMainTab form={form} isEdit={isEdit} product={product} visibility={visibility} />
                ),
              },
              {
                key: 'additional',
                label: 'Дополнительные',
                forceRender: true,
                children: (
                  <ProductAdditionalTab
                    form={form}
                    isEdit={isEdit}
                    product={product}
                    visibility={visibility}
                  />
                ),
              },
              visibility.showCompound ? {
                key: 'compound',
                label: 'Состав',
                forceRender: true,
                children: (
                  <ProductCompoundTab
                    contents={contentsQuery.data ?? []}
                    loading={contentsQuery.isFetching}
                  />
                ),
              } : {},
              {
                key: 'aggregates',
                label: 'Фасовка',
                forceRender: true,
                children: (
                  <ProductAggregatesTab
                    gtin={gtin}
                    form={form}
                    isEdit={isEdit}
                    loading={aggregatesQuery.isFetching}
                    visibility={visibility}
                    itemsRemoved={removedIds.aggregates_removed}
                    onItemsRemovedChange={(next) =>
                      setRemovedIds((prev) => ({
                        ...prev,
                        aggregates_removed: next,
                      }))
                    }
                  />
                ),
              },
              {
                key: 'certs',
                label: 'Разреш. док.',
                forceRender: true,
                children: (
                  <ProductCertificatesTab
                    form={form}
                    gtin={gtin}
                    isEdit={isEdit}
                    loading={certsQuery.isFetching}
                    visibility={visibility}
                    itemsRemoved={removedIds.certificates_removed}
                    onItemsRemovedChange={(next) =>
                      setRemovedIds((prev) => ({
                        ...prev,
                        certificates_removed: next,
                      }))
                    }
                  />
                ),
              },
              {
                key: 'licences',
                label: 'Лицензии',
                forceRender: true,
                children: (
                  <ProductLicencesTab
                    form={form}
                    gtin={gtin}
                    isEdit={isEdit}
                    loading={licencesQuery.isFetching}
                    visibility={visibility}
                    itemsRemoved={removedIds.licences_removed}
                    onItemsRemovedChange={(next) =>
                      setRemovedIds((prev) => ({
                        ...prev,
                        licences_removed: next,
                      }))
                    }
                  />
                ),
              },
              {
                key: 'controllers',
                label: 'Параметры',
                forceRender: true,
                children: (
                  <ProductControllerParamsTab
                    form={form}
                    gtin={gtin}
                    isEdit={!productLoading}
                    loading={productLoading}
                    visibility={visibility}
                    aggregatesRemoved={removedIds.aggregates_removed}
                    itemsRemoved={removedIds.controller_params_removed}
                    onItemsRemovedChange={(next) =>
                      setRemovedIds((prev) => ({
                        ...prev,
                        controller_params_removed: next,
                      }))
                    }
                  />
                ),
              },
              {
                key: 'articles',
                label: 'Артикулы',
                forceRender: true,
                children: (
                  <ProductArticlesTab
                    form={form}
                    gtin={gtin}
                    isEdit={!productLoading}
                    loading={articlesQuery.isFetching}
                    visibility={visibility}
                    itemsRemoved={removedIds.articles_removed}
                    onItemsRemovedChange={(next) =>
                      setRemovedIds((prev) => ({
                        ...prev,
                        articles_removed: next,
                      }))
                    }
                  />
                ),
              },
            ]}
          />
        </Form>
      </LoadingOverlay>
    </Modal>
  );
}
