import { SelectCrptOrganizations } from '@/entities/integration';
import { SelectFactoryNumbers } from '@/entities/parameters';
import { SelectPrintTemplate } from '@/entities/print-template';
import { CHARACTERISTIC_BOUNDS, SelectCharacteristic, visibilityFormControl, type Product, type ProductFormValues } from '@/entities/product';
import { NumberInput } from '@/shared/ui/input';
import { Divider, Flex, Form, Input, InputNumber, Switch } from 'antd';
import type { FormInstance } from 'antd/es/form';
import { useMemo } from 'react';

/** Props for the additional product fields tab. */
export interface ProductAdditionalTabProps {
  form: FormInstance<ProductFormValues>;
  isEdit: boolean;
  product?: Product;
  visibility?: ReturnType<typeof visibilityFormControl>;
}

/**
 * Additional product attributes (templates, auto-actions, export flags).
 */
export function ProductAdditionalTab({
  form,
  isEdit: _isEdit,
  product: _product,
  visibility
}: ProductAdditionalTabProps) {
  const { showAutoorder, showVaribleChar } = useMemo(() => visibility ?? visibilityFormControl(form.getFieldsValue()), [visibility, form.getFieldsValue()]);



  const variableCharType = Form.useWatch('variable_char_type', form)
  const variableCharMin = Form.useWatch('variable_char_min', form)
  
  const { min, max, step } = useMemo(() => {
    let min = 0, max = 999_999_999, step = 1;

    if (CHARACTERISTIC_BOUNDS[variableCharType]) {
      min = CHARACTERISTIC_BOUNDS[variableCharType][0]
      max = CHARACTERISTIC_BOUNDS[variableCharType][1]
      const decimals = CHARACTERISTIC_BOUNDS[variableCharType][2]
      step = decimals > 0 ? 10 ** (-decimals): 1;
    }

    return {
      min,
      max,
      step
    }
  }, [variableCharType])


  return (
    <>
      <Form.Item
        name="additional_text"
        label="Дополнительная информация для печати"
        dependencies={['pg']}
        rules={[
          ({ getFieldValue }) => ({
            validator: (_, value: string | undefined) => {
              if (
                ['ncp', 'tobacco', 'otp'].includes(getFieldValue('pg')) &&
                !value?.trim()
              ) {
                return Promise.reject(
                  new Error(
                    'Укажите краткое описание товара в поле «Дополнительная информация для печати»!',
                  ),
                );
              }
              return Promise.resolve();
            },
          }),
        ]}
        style={{ marginBottom: 4 }}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="template_id"
        label="Шаблон кода маркировки"
        style={{ marginBottom: 4 }}
      >
        <SelectPrintTemplate allowClear placeholder="Системный шаблон" />
      </Form.Item>
      <Form.Item
        name="plain_template_id"
        label="Шаблон без кода маркировки"
        style={{ marginBottom: 4 }}
      >
        <SelectPrintTemplate allowClear placeholder="Системный шаблон" />
      </Form.Item>
      <Form.Item
        name="crpt_inn"
        label="Передача данных в ЧЗ"
        style={{ marginBottom: 4 }}
      >
        <SelectCrptOrganizations defaultValue='' />
      </Form.Item>
      <Form.Item
        name="factory_number_id"
        label="Номер завода для печати"
        style={{ marginBottom: 4 }}
      >
        <SelectFactoryNumbers defaultValue='' />
      </Form.Item>
      {showVaribleChar && <>
       <Divider titlePlacement='left' style={{ marginBottom: 4, marginTop: 0 }}>Переменная характеристика</Divider>
       <Form.Item name="variable_char_type" style={{ marginBottom: 4 }}>
        <SelectCharacteristic />
       </Form.Item>
       <Flex justify="space-between" style={{ width: '100%' }}>
        <Form.Item label="Минимум" name="variable_char_min" style={{ flex: 1, marginBottom: 0 }}>
          <InputNumber min={min} max={max} step={step} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="Максимум" name="variable_char_max" style={{ flex: 1, marginBottom: 0 }}>
          <InputNumber min={variableCharMin? (variableCharMin+step): min} max={max} step={step} style={{ width: '100%' }} />
        </Form.Item>
       </Flex>
       <Divider style={{ marginBottom: 4, marginTop: 4 }} />
      </>}

      {showAutoorder ? (
        <Form.Item
          name="autoorder_amount"
          label="Автозаказ КМ за 1 день"
          style={{ marginBottom: 4 }}
        >
          <NumberInput min={-1} max={999999} style={{ width: '100%' }} />
        </Form.Item>
      ) : null}
      <Form.Item
        name="auto_skip_serialization"
        label="Пропуск сериализации"
        valuePropName="checked"
        style={{ marginBottom: 4 }}
      >
        <Switch />
      </Form.Item>
      <Form.Item
        name="auto_send_apply"
        label="Автоматически передавать отчёт о нанесении"
        valuePropName="checked"
        style={{ marginBottom: 4 }}
      >
        <Switch />
      </Form.Item>
      <Form.Item
        name="auto_send_introduce"
        label="Автоматически передавать ввод в оборот"
        valuePropName="checked"
        style={{ marginBottom: 4 }}
      >
        <Switch />
      </Form.Item>
      <Form.Item
        name="auto_send_aggregate"
        label="Автоматически передавать агрегацию"
        valuePropName="checked"
        style={{ marginBottom: 4 }}
      >
        <Switch />
      </Form.Item>
      <Form.Item
        name="auto_export_to_1c"
        label="Автоматически выгружать в 1С"
        valuePropName="checked"
        tooltip="При включенной опции и активной глобальной интеграции с 1С коды агрегации последнего уровня по заданиям с этой продукцией будут выгружаться автоматически."
        style={{ marginBottom: 4 }}
      >
        <Switch />
      </Form.Item>
      <Form.Item
        name="use_data_export"
        label="Пропускать работу с маркировкой и выгружать данные в файл"
        valuePropName="checked"
        style={{ marginBottom: 4 }}
      >
        <Switch />
      </Form.Item>
    </>
  );
}
