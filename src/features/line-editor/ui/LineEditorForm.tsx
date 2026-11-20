import {
  computeLineEditorVisibility,
  type LineEditorFormState,
  type LineEditorResourceLabels,
} from '@/entities/line';
import type { FormInstance, TabsProps } from 'antd';
import { Form, Tabs } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { LineAggregationTab } from './LineAggregationTab';
import { LineFavouriteProductsTab } from './LineFavouriteProductsTab';
import { LineMainTab } from './LineMainTab';
import { LineIdentityFields } from './lineFormSections/LineIdentityFields';

/**
 * Registers a Form field without UI so `preserve` / `getFieldsValue(true)`
 * keep list values across tab switches (and future `destroyInactiveTabPane`).
 */
function FormStoreField(_props: {
  value?: unknown;
  onChange?: (value: unknown) => void;
}): null {
  return null;
}

type LineEditorFormBodyProps = Omit<LineEditorFormProps, 'onFormReady'>;

function LineEditorFormBody({
  isNew,
  initialValues,
  initialResourceLabels,
}: LineEditorFormBodyProps) {
  const form = Form.useFormInstance<LineEditorFormState>();
  const [activeTab, setActiveTab] = useState('main');
  const [resourceLabels, setResourceLabels] =
    useState<LineEditorResourceLabels>(initialResourceLabels);

  useEffect(() => {
    setResourceLabels(initialResourceLabels);
  }, [initialResourceLabels]);

  const watchedValues = Form.useWatch([], form) as LineEditorFormState | undefined;
  const visibility = useMemo(
    () =>
      computeLineEditorVisibility(
        {
          ...initialValues,
          ...(watchedValues ?? {}),
        },
        isNew,
      ),
    [initialValues, isNew, watchedValues],
  );

  const tabItems = useMemo((): NonNullable<TabsProps['items']> => {
    return [
      {
        key: 'main',
        label: 'Основные',
        children: (
          <LineMainTab
            isNew={isNew}
            visibility={visibility}
            resourceLabels={resourceLabels}
            onResourceLabelsChange={setResourceLabels}
          />
        ),
      },
      {
        key: 'aggregation',
        label: 'Агрегация',
        children: (
          <LineAggregationTab
            visibility={visibility}
            resourceLabels={resourceLabels}
            onResourceLabelsChange={setResourceLabels}
          />
        ),
      },
      {
        key: 'products',
        label: 'Продукция',
        children: <LineFavouriteProductsTab visibility={visibility} />,
      },
    ];
  }, [isNew, resourceLabels, visibility]);

  return (
    <>
      <LineIdentityFields visibility={visibility} />
      <Form.Item name="aggregation_levels" hidden preserve noStyle>
        <FormStoreField />
      </Form.Item>
      <Form.Item name="deleted_aggregation_level_ids" hidden preserve noStyle>
        <FormStoreField />
      </Form.Item>
      <Form.Item name="favourite_gtins" hidden preserve noStyle>
        <FormStoreField />
      </Form.Item>
      {visibility.showExtendedTabs && (
        <Tabs
          size="small"
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          styles={{
            header: {
              marginBottom: 4,
            },
          }}
        />
      )}
    </>
  );
}

/** Props for the full-screen line editor Form shell (tabs + visibility). */
export interface LineEditorFormProps {
  disabled?: boolean;
  /** Whether the editor is creating a new line. */
  isNew: boolean;
  /**
   * Defaults applied once on mount via Form `initialValues`.
   * Remount with a new `key` (line id / `'new'`) to load another line;
   * do not pass a fresh object on every query refetch.
   */
  initialValues: LineEditorFormState;
  /**
   * Resource display labels parallel to {@link initialValues} (not stored in Form).
   */
  initialResourceLabels: LineEditorResourceLabels;
  /**
   * Receives the Form instance so the page can `getFieldsValue(true)` on save
   * and `Form.useWatch('name', form)` for the title.
   * Called with `null` on unmount so the page clears a detached handle.
   */
  onFormReady?: (form: FormInstance<LineEditorFormState> | null) => void;
}

/**
 * Line editor Form shell: owns `Form.useForm`, Tabs, and active-tab reset when
 * aggregation/products tabs hide. Tab bodies read/write via Form instance.
 *
 * Mount with `key={lineId}` (or `'new'`) so create→edit remounts cleanly.
 * Used inside {@link LineFormModal}; device/template Hosts stay app-mounted.
 */
export function LineEditorForm({
  isNew,
  disabled,
  initialValues,
  initialResourceLabels,
  onFormReady,
}: LineEditorFormProps) {
  const [form] = Form.useForm<LineEditorFormState>();

  useEffect(() => {
    onFormReady?.(form);
    return () => {
      onFormReady?.(null);
    };
  }, [form, onFormReady]);

  return (
    <Form
      form={form}
      component={false}
      layout="horizontal"
      initialValues={initialValues}
      disabled={disabled}
    >
      <LineEditorFormBody
        isNew={isNew}
        disabled={disabled}
        initialValues={initialValues}
        initialResourceLabels={initialResourceLabels}
      />
    </Form>
  );
}