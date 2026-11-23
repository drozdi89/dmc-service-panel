import {
  DEFAULT_PRODUCT_FORM_VALUES,
  visibilityFormControl,
  type Product,
  type ProductContents,
  type ProductFormRemovedIds,
  type ProductFormValues,
} from '@/entities/product';
import type { FormInstance } from 'antd';
import { FormHiddenInput } from '@/shared/ui/form/FormHiddenInput';
import { Form, Tabs } from 'antd';
import { useMemo, useState } from 'react';
import {
  ProductAdditionalTab,
  ProductAggregatesTab,
  ProductArticlesTab,
  ProductCertificatesTab,
  ProductCompoundTab,
  ProductControllerParamsTab,
  ProductLicencesTab,
  ProductMainTab,
} from './productFormTabs';

export interface ProductFormModalTabsProps {
  form: FormInstance<ProductFormValues>;
  isEdit: boolean;
  product: Product | undefined;
  gtin: string | undefined;
  contents: ProductContents[] | undefined;
  contentsLoading: boolean;
  aggregatesLoading: boolean;
  certsLoading: boolean;
  licencesLoading: boolean;
  productLoading: boolean;
  articlesLoading: boolean;
  removedIds: ProductFormRemovedIds;
  onRemovedIdsChange: React.Dispatch<React.SetStateAction<ProductFormRemovedIds>>;
}

function ProductFormModalTabsInner({
  isEdit,
  product,
  gtin,
  contents,
  contentsLoading,
  aggregatesLoading,
  certsLoading,
  licencesLoading,
  productLoading,
  articlesLoading,
  removedIds,
  onRemovedIdsChange,
}: Omit<ProductFormModalTabsProps, 'form'>) {
  const form = Form.useFormInstance<ProductFormValues>();
  const watched = Form.useWatch([], form) as ProductFormValues | undefined;
  const visibility = useMemo(
    () =>
      visibilityFormControl({
        ...DEFAULT_PRODUCT_FORM_VALUES,
        ...(watched ?? {}),
      }),
    [watched],
  );
  const [activeTab, setActiveTab] = useState('main');

  return (
    <>
      <Form.Item name="pg" hidden>
        <FormHiddenInput />
      </Form.Item>
      <Form.Item name="type" hidden>
        <FormHiddenInput />
      </Form.Item>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'main',
            label: 'Основное',
            forceRender: true,
            children: (
              <ProductMainTab
                form={form}
                isEdit={isEdit}
                product={product}
                visibility={visibility}
              />
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
          visibility.showCompound
            ? {
                key: 'compound',
                label: 'Состав',
                forceRender: true,
                children: (
                  <ProductCompoundTab
                    contents={contents ?? []}
                    loading={contentsLoading}
                  />
                ),
              }
            : {},
          {
            key: 'aggregates',
            label: 'Фасовка',
            forceRender: true,
            children: (
              <ProductAggregatesTab
                gtin={gtin}
                form={form}
                isEdit={isEdit}
                loading={aggregatesLoading}
                visibility={visibility}
                itemsRemoved={removedIds.aggregates_removed}
                onItemsRemovedChange={(next) =>
                  onRemovedIdsChange((prev) => ({
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
                loading={certsLoading}
                visibility={visibility}
                itemsRemoved={removedIds.certificates_removed}
                onItemsRemovedChange={(next) =>
                  onRemovedIdsChange((prev) => ({
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
                loading={licencesLoading}
                visibility={visibility}
                itemsRemoved={removedIds.licences_removed}
                onItemsRemovedChange={(next) =>
                  onRemovedIdsChange((prev) => ({
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
                  onRemovedIdsChange((prev) => ({
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
                loading={articlesLoading}
                visibility={visibility}
                itemsRemoved={removedIds.articles_removed}
                onItemsRemovedChange={(next) =>
                  onRemovedIdsChange((prev) => ({
                    ...prev,
                    articles_removed: next,
                  }))
                }
              />
            ),
          },
        ]}
      />
    </>
  );
}

export function ProductFormModalTabs({
  form,
  ...tabsProps
}: ProductFormModalTabsProps) {
  return (
    <Form form={form} labelCol={{ span: 8 }}>
      <ProductFormModalTabsInner {...tabsProps} />
    </Form>
  );
}