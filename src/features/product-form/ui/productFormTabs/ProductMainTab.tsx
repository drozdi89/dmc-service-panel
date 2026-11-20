import {
  amountFieldLabel,
  isVsdRequired,
  resolveCommissioningType,
  type CommissioningType,
  type Product,
  type ProductFormValues,
  SelectCrptTemplateIdx,
  SelectLifeTimeUnit,
  SelectMeasureUnit,
  SelectProductGroups,
  SelectProductGroupsDm,
  showsVetControl,
  vetControlLabel,
  visibilityFormControl,
} from '@/entities/product';
import { NumberInput } from '@/shared/ui/input';
import { Divider, Form, Input, InputNumber, Segmented, Space, Switch, Typography } from 'antd';
import type { FormInstance } from 'antd/es/form';
import { useEffect, useMemo, useRef, useState } from 'react';

/** Props for the main product fields tab. */
export interface ProductMainTabProps {
  form: FormInstance<ProductFormValues>;
  isEdit: boolean;
  product?: Product;
  visibility?: ReturnType<typeof visibilityFormControl>;
}

/**
 * Main product attributes form (GTIN, names, group, lifetime) — desktop dialog parity.
 */
export function ProductMainTab({
  form,
  isEdit,
  product,
  visibility,
}: ProductMainTabProps) {
  const values = form.getFieldsValue();
  const pg = Form.useWatch('pg', form) as string | undefined;
  const [commissioningType, setCommissioningType] = useState<CommissioningType>(
    product ? resolveCommissioningType(product) : 'owner',
  );

  useEffect(() => {
    if (product) {
      setCommissioningType(resolveCommissioningType(product));
    } else {
      setCommissioningType('owner');
    }
  }, [product]);

  const {
    showCrptTemplateIdx,
    showVet,
    showMrpAlcohol,
    showMrpPrice,
    assortmentRequired,
    volumeRequired,
    showWeightBounds,
  } = useMemo(() => visibility ?? visibilityFormControl(values), [visibility, values]);

  const measureUnit = Form.useWatch('measure_unit', form) as string | undefined;
  const contractCommissioning = Form.useWatch(
    'contract_commissioning',
    form,
  ) as boolean;


  const prevPgRef = useRef<string | undefined>(undefined);

  /** Reset PG-change tracking when another product is loaded into the form. */
  useEffect(() => {
    prevPgRef.current = undefined;
  }, [product?.gtin, isEdit]);

  /**
   * Desktop `pg_changed` → `show_hide_vsd_control`: force checkbox to
   * `vsd_required` when the user changes ТГ (not on initial load).
   */
  useEffect(() => {
    if (prevPgRef.current === undefined) {
      prevPgRef.current = pg;
      return;
    }
    if (prevPgRef.current === pg) {
      return;
    }
    prevPgRef.current = pg;
    form.setFieldValue(
      'vet_control',
      showsVetControl(pg) ? isVsdRequired(pg) : false,
    );
  }, [pg, form]);

  return (
    <>
      <Form.Item
        name="assortment_number"
        label="Артикул"
        rules={[
          {
            required: assortmentRequired,
            message: 'Укажите КОД продукта в поле "Номер"!',
          },
          { pattern: /^\d*$/, message: 'Артикул: содержит только цифры' },
        ]}
        style={{ marginBottom: 4 }}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="name"
        label="Наименование"
        rules={[{ required: true, message: 'Укажите наименование' }]}
        style={{ marginBottom: 4 }}
      >
        <Input />
      </Form.Item>
      <Form.Item name="short_name" label="Описание" style={{ marginBottom: 4 }}>
        <Input.TextArea rows={5} />
      </Form.Item>
      <Divider titlePlacement="start" style={{ margin: 0 }}>
        <Typography.Text strong>Маркировка</Typography.Text>
      </Divider>

      {showCrptTemplateIdx ? (
        <Form.Item
          name="crpt_template_idx"
          label="Формат КМ"
          style={{ marginBottom: 4 }}
        >
          <SelectCrptTemplateIdx />
        </Form.Item>
      ) : null}
      <Form.Item name="pg" label="Честный знак" style={{ marginBottom: 4 }}>
        <SelectProductGroups />
      </Form.Item>
      <Form.Item name="pg_ez" label="Электронный знак" style={{ marginBottom: 4 }}>
        <SelectProductGroupsDm />
      </Form.Item>
      <Divider titlePlacement="start" style={{ margin: '4px 0' }} />

      {showVet ? (
        <Form.Item
          label={vetControlLabel(pg)}
          name="vet_control"
          valuePropName="checked"
          style={{ marginBottom: 4 }}
        >
          <Switch />
        </Form.Item>
      ) : null}
      <Form.Item label="Срок годности" style={{ marginBottom: 4 }}>
        <Space.Compact block>
          <Form.Item noStyle name="lifetime">
            <NumberInput min={0} />
          </Form.Item>
          <Form.Item noStyle name="lifetime_unit">
            <SelectLifeTimeUnit />
          </Form.Item>
        </Space.Compact>
      </Form.Item>
      <Form.Item
        label={amountFieldLabel(measureUnit)}
        style={{ marginBottom: 4 }}
        required={volumeRequired}
      >
        <Space.Compact block>
          <Form.Item
            noStyle
            name="beer_volume_ml"
            rules={[
              {
                validator: async (_, value: number | null | undefined) => {
                  if (volumeRequired && (!value || value === 0)) {
                    throw new Error('Укажите объём производимой продукции!');
                  }
                },
              },
            ]}
          >
            <NumberInput min={0} step={250} round={1000} />
          </Form.Item>
          <Form.Item noStyle name="measure_unit">
            <SelectMeasureUnit />
          </Form.Item>
        </Space.Compact>
      </Form.Item>
      {/**
       * Keep weight bound fields mounted (hide when not weight unit) so values
       * stay in the Form store and are included on create save.
       */}
      <Form.Item
        label="Границы веса"
        style={{
          marginBottom: 4,
          display: measureUnit === 'W' ? undefined : 'none',
        }}
      >
        <Space.Compact block>
          <Form.Item
            noStyle
            name="weight_min_g"
            dependencies={['weight_max_g', 'measure_unit']}
            rules={[
              ({ getFieldValue }) => ({
                validator: async (_, minG: number | null | undefined) => {
                  if (getFieldValue('measure_unit') !== 'W') {
                    return;
                  }
                  const maxG = getFieldValue('weight_max_g') as
                    | number
                    | null
                    | undefined;
                  if (
                    minG != null &&
                    maxG != null &&
                    minG > 0 &&
                    maxG > 0 &&
                    minG > maxG
                  ) {
                    throw new Error(
                      'Минимальный вес не может быть больше максимального',
                    );
                  }
                },
              }),
            ]}
          >
            <NumberInput
              min={0}
              step={250}
              round={1000}
              addonBefore="Мин."
              addonAfter="кг"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            noStyle
            name="weight_max_g"
            dependencies={['weight_min_g', 'measure_unit']}
            rules={[
              ({ getFieldValue }) => ({
                validator: async (_, maxG: number | null | undefined) => {
                  if (getFieldValue('measure_unit') !== 'W') {
                    return;
                  }
                  const minG = getFieldValue('weight_min_g') as
                    | number
                    | null
                    | undefined;
                  if (
                    minG != null &&
                    maxG != null &&
                    minG > 0 &&
                    maxG > 0 &&
                    minG > maxG
                  ) {
                    throw new Error(
                      'Минимальный вес не может быть больше максимального',
                    );
                  }
                },
              }),
            ]}
          >
            <NumberInput
              min={0}
              step={250}
              round={1000}
              addonBefore="Макс."
              addonAfter="кг"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Space.Compact>
      </Form.Item>
      <Form.Item
        label="Вес упаковки"
        name="package_weight"
        style={{ marginBottom: 4 }}
      >
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>

      {showMrpAlcohol ? (
        <Form.Item name="mrp" label="Процент спирта" style={{ marginBottom: 4 }}>
          <NumberInput
            min={0}
            step={1}
            round={10}
            suffix=" %"
            decimalSeparator=","
            style={{ width: '100%' }}
          />
        </Form.Item>
      ) : null}
      {showMrpPrice ? (
        <Form.Item
          name="mrp"
          label="МРЦ"
          rules={[
            {
              validator: async (_, value: number | null | undefined) => {
                if (!value || value === 0) {
                  throw new Error('Укажите МРЦ производимой продукции!');
                }
              },
            },
          ]}
          style={{ marginBottom: 4 }}
        >
          <NumberInput
            min={0}
            step={10}
            round={100}
            suffix=" руб."
            decimalSeparator=","
            style={{ width: '100%' }}
          />
        </Form.Item>
      ) : null}

      <Form.Item
        name="gtin"
        label="GTIN"
        rules={[
          { required: true, message: 'Укажите GTIN' },
          { pattern: /^0\d{13}$/, message: 'GTIN: 14 цифр, начинается с 0' },
        ]}
        style={{ marginBottom: 4 }}
      >
        <Input disabled={isEdit} maxLength={14} />
      </Form.Item>
      <Form.Item name="tnved" label="Код ТН ВЭД" style={{ marginBottom: 4 }}>
        <Input />
      </Form.Item>
      <Form.Item name="barcode" label="Штрихкод" style={{ marginBottom: 4 }}>
        <Input />
      </Form.Item>
      <Form.Item
        name="is_imported"
        label="Импортируемая продукция"
        valuePropName="checked"
        style={{ marginBottom: 4 }}
      >
        <Switch />
      </Form.Item>
      <Divider titlePlacement="start" style={{ margin: 0 }}>
        <Form.Item
          name="contract_commissioning"
          label="Контрактное производство"
          valuePropName="checked"
          style={{ marginBottom: 0 }}
           labelCol={{}}
        >
          <Switch />
        </Form.Item>
      </Divider>
      <Form.Item label="ИНН">
        <Space.Compact block>
          <Segmented
            disabled={!contractCommissioning}
            value={commissioningType}
            options={[
              { value: 'owner', label: 'владельца' },
              { value: 'producer', label: 'производителя' },
            ]}
            onChange={(next) => {
              const nextType = next as CommissioningType;
              const currentInn =
                (form.getFieldValue(
                  commissioningType === 'owner' ? 'owner_inn' : 'producer_inn',
                ) as string | null | undefined) ?? '';
              setCommissioningType(nextType);
              if (nextType === 'owner') {
                form.setFieldsValue({
                  owner_inn: currentInn,
                  producer_inn: null,
                });
              } else {
                form.setFieldsValue({
                  producer_inn: currentInn,
                  owner_inn: null,
                });
              }
            }}
          />
          <Form.Item
            noStyle
            name={commissioningType === 'owner' ? 'owner_inn' : 'producer_inn'}
            rules={[
              {
                pattern: /^[0-9]{10,12}/,
                message: 'Укажите корректный ИНН владельца продукта!',
              },
            ]}
          >
            <Input disabled={!contractCommissioning} />
          </Form.Item>
        </Space.Compact>
      </Form.Item>
    </>
  );
}
