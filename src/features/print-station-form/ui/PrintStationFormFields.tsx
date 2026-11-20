import { DeviceResourcePicker } from '@/entities/device';
import {
  DEFAULT_PRINT_STATION_FORM_VALUES,
  type CreatePrintStationPayload,
  type PrintStationResourceLabels,
} from '@/entities/print-station';
import { PrintTemplateResourcePicker } from '@/entities/print-template';
import { Divider, Form, Input, InputNumber, Typography } from 'antd';
import type { FormInstance } from 'antd';

export interface PrintStationFormFieldsProps {
  form: FormInstance<CreatePrintStationPayload>;
  fieldsDisabled: boolean;
  resourceLabels: PrintStationResourceLabels;
  onResourceLabelsChange: React.Dispatch<React.SetStateAction<PrintStationResourceLabels>>;
}

/**
 * Print station form body. `useWatch` runs here (under `<Form>`) to avoid antd
 * “useForm not connected” warnings in the always-mounted Host modal.
 */
function PrintStationFormFieldsInner({
  fieldsDisabled,
  resourceLabels,
  onResourceLabelsChange,
}: Omit<PrintStationFormFieldsProps, 'form'>) {
  const form = Form.useFormInstance<CreatePrintStationPayload>();
  const printerId = Form.useWatch('printer', form) as number | null | undefined;
  const cameraId = Form.useWatch('camera', form) as number | null | undefined;
  const templateId = Form.useWatch('template_id', form) as number | null | undefined;

  return (
    <>
      <Form.Item
        name="name"
        label="Наименование станции"
        rules={[{ required: true, message: 'Укажите наименование станции печати' }]}
        style={{ marginBottom: 0 }}
      >
        <Input />
      </Form.Item>

      <Divider titlePlacement="start" style={{ margin: 0 }}>
        <Typography.Text strong>Печать</Typography.Text>
      </Divider>

      <Form.Item label="Принтер" name="printer" style={{ marginBottom: 4 }}>
        <DeviceResourcePicker
          types={['printer']}
          deviceType="printer"
          lockDeviceType
          value={printerId ?? undefined}
          valueLabel={resourceLabels.printerName}
          disabled={fieldsDisabled}
          allowClear
          placeholder="Не используется"
          onChange={(nextValue, option) => {
            const id =
              nextValue === null || nextValue === undefined
                ? null
                : Number(nextValue);
            form.setFieldValue('printer', id);
            onResourceLabelsChange((prev) => ({
              ...prev,
              printerName: option?.label,
            }));
          }}
        />
      </Form.Item>

      <Form.Item label="Шаблон этикетки" name="template_id" style={{ marginBottom: 4 }}>
        <PrintTemplateResourcePicker
          value={templateId ?? undefined}
          valueLabel={resourceLabels.templateName}
          disabled={fieldsDisabled}
          allowClear
          placeholder="Не используется"
          onChange={(nextValue, option) => {
            const id =
              nextValue === null || nextValue === undefined
                ? null
                : Number(nextValue);
            form.setFieldValue('template_id', id);
            onResourceLabelsChange((prev) => ({
              ...prev,
              templateName: option?.label,
            }));
          }}
        />
      </Form.Item>

      <Divider style={{ margin: 0 }}>
        <Typography.Text strong>Контроль</Typography.Text>
      </Divider>

      <Form.Item
        label="Камера"
        tooltip="Камера, считывающая нанесённые на продукцию коды маркировки"
        style={{ marginBottom: 4 }}
      >
        <DeviceResourcePicker
          types={['camera']}
          deviceType="camera"
          lockDeviceType
          value={cameraId ?? undefined}
          valueLabel={resourceLabels.cameraName}
          disabled={fieldsDisabled}
          allowClear
          placeholder="Не используется"
          onChange={(nextValue, option) => {
            const id =
              nextValue === null || nextValue === undefined
                ? null
                : Number(nextValue);
            form.setFieldValue('camera', id);
            onResourceLabelsChange((prev) => ({
              ...prev,
              cameraName: option?.label,
            }));
          }}
        />
      </Form.Item>
      <Form.Item name="camera" hidden>
        <InputNumber />
      </Form.Item>

      <Form.Item
        name="max_failures"
        label="Останавливаться после ошибок подряд"
        rules={[{ required: true, message: 'Укажите число ошибок' }]}
        style={{ marginBottom: 4 }}
      >
        <InputNumber min={1} max={99999} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name="grade_percent"
        label="Останавливаться после штук брака"
        rules={[{ required: true, message: 'Укажите число штук брака' }]}
        style={{ marginBottom: 4 }}
      >
        <InputNumber min={0} max={99999} style={{ width: '100%' }} />
      </Form.Item>
    </>
  );
}

export function PrintStationFormFields(props: PrintStationFormFieldsProps) {
  const { form, fieldsDisabled } = props;

  return (
    <Form
      form={form}
      layout="horizontal"
      disabled={fieldsDisabled}
      initialValues={DEFAULT_PRINT_STATION_FORM_VALUES}
    >
      <PrintStationFormFieldsInner
        fieldsDisabled={fieldsDisabled}
        resourceLabels={props.resourceLabels}
        onResourceLabelsChange={props.onResourceLabelsChange}
      />
    </Form>
  );
}