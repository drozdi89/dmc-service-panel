import {
  DEFAULT_SERIAL_SCALE_PORT,
  DEFAULT_TCP_SCALE_PORT,
  isSerialScale,
  SCALE_TYPE_CHECKWEIR,
  scalePortFormRule,
  usesConnectionFields,
  type DeviceFormValues,
  type DeviceType,
} from '@/entities/device';
import { Form, Input, InputNumber, Typography } from 'antd';
import { useMemo } from 'react';
import {
  DeviceConnectionFields,
  DeviceControllerFields,
  DeviceDividerFields,
  DevicePrinterFields,
  DeviceScaleFields,
} from './deviceFormSections';

/** Props for type-aware device form fields (create / edit). */
export interface DeviceFormFieldsProps {
  /** Active device type (selected outside the form record). */
  deviceType: DeviceType;
}

/**
 * Type-aware device form body: common fields plus camera/printer/scale/controller/divider sections.
 *
 * Must be rendered inside an antd {@link Form} bound to {@link DeviceFormValues}.
 */
export function DeviceFormFields({ deviceType: activeType }: DeviceFormFieldsProps) {
  const form = Form.useFormInstance<DeviceFormValues>();
  const scaleType = Form.useWatch('type', form) as number | undefined;
  const scaleHost = Form.useWatch('host', form);

  const showConnection = usesConnectionFields(activeType);
  const showPrinterFields = activeType === 'printer';
  const showScaleFields = activeType === 'scale';
  const showCheckweir = showScaleFields && scaleType === SCALE_TYPE_CHECKWEIR;
  const showControllerFields = activeType === 'controller';
  const showDividerFields = activeType === 'divider';
  const scalePortSerial = showScaleFields && isSerialScale(scaleType, scaleHost);
  const scalePortPlaceholder = scalePortSerial ? DEFAULT_SERIAL_SCALE_PORT : DEFAULT_TCP_SCALE_PORT;
  const scalePortRules = useMemo(
    () => [scalePortFormRule(scaleType, scaleHost)],
    [scaleType, scaleHost],
  );

  return (
    <>
      <Form.Item name="id" hidden>
        <InputNumber />
      </Form.Item>

      <Form.Item
        name="name"
        label="Название"
        rules={[{ required: true, message: 'Укажите название' }]}
      >
        <Input />
      </Form.Item>

      {showConnection ? (
        <DeviceConnectionFields
          form={form}
          activeType={activeType}
          scalePortRules={scalePortRules}
          scalePortPlaceholder={scalePortPlaceholder}
        />
      ) : null}

      {showPrinterFields ? <DevicePrinterFields /> : null}

      {showScaleFields ? (
        <DeviceScaleFields form={form} scaleType={scaleType} showCheckweir={showCheckweir} />
      ) : null}

      {showControllerFields ? <DeviceControllerFields /> : null}

      {showDividerFields ? <DeviceDividerFields /> : null}

      <Typography.Text>
        Для камер Hikrobot используется порт 2000
        <br />
        Для камер COGNEX используется порт 23
        <br />
        Для камер Honeywell используется порт 55256
        <br />
        Для принтеров обычно используется порт 9100
        <br />
        Для WINPRINTER в Наименование указать название принтера в системе
      </Typography.Text>
    </>
  );
}
