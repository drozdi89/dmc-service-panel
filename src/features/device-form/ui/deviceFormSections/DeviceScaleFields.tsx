import {
  DEFAULT_SERIAL_SCALE_PORT,
  DEFAULT_TCP_SCALE_PORT,
  hostFormRule,
  isSerialScale,
  SelectDeviceScaleType,
  type DeviceFormValues,
} from '@/entities/device';
import { portFormRule } from '@/shared/validation/network';
import { Col, Collapse, Form, Input, InputNumber, Row } from 'antd';
import type { FormInstance } from 'antd/es/form';

/** Props for scale device fields. */
export interface DeviceScaleFieldsProps {
  form: FormInstance<DeviceFormValues>;
  scaleType: number | undefined;
  showCheckweir: boolean;
}

/**
 * Scale model fields and optional Checkweir SQL connection panel.
 */
export function DeviceScaleFields({
  form,
  scaleType,
  showCheckweir,
}: DeviceScaleFieldsProps) {
  return (
    <>
      <Form.Item
        name="scale_type"
        label="Модель весов"
        rules={[{ required: true, message: 'Выберите модель' }]}
      >
        <SelectDeviceScaleType
          onChange={(nextScaleType: number) => {
            const host = form.getFieldValue('host');
            const wasSerial = isSerialScale(scaleType, host);
            const willBeSerial = isSerialScale(nextScaleType, host);
            const updates: Partial<DeviceFormValues> = { scale_type: nextScaleType };
            if (wasSerial !== willBeSerial) {
              updates.port = willBeSerial
                ? DEFAULT_SERIAL_SCALE_PORT
                : DEFAULT_TCP_SCALE_PORT;
            }
            form.setFieldsValue(updates);
          }}
        />
      </Form.Item>
      {showCheckweir ? (
        <Collapse
          items={[
            {
              key: 'sql',
              label: 'Подключение к SQL Чеквейра',
              children: (
                <>
                  <Row gutter={12}>
                    <Col span={16}>
                      <Form.Item
                        name="sql_host"
                        label="SQL host"
                        rules={[hostFormRule('sql_host')]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        name="sql_port"
                        label="SQL port"
                        rules={[portFormRule(false)]}
                      >
                        <InputNumber min={1} max={65535} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="sql_db" label="База данных">
                    <Input />
                  </Form.Item>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item name="sql_user" label="Пользователь">
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="sql_pass" label="Пароль">
                        <Input.Password />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item name="unit_template_id" label="Шаблон единицы (id)">
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="pack_template_id" label="Шаблон упаковки (id)">
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              ),
            },
          ]}
        />
      ) : null}
    </>
  );
}
