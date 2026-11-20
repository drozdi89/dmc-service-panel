import { hostFormRule, type DeviceType } from '@/entities/device';
import { portFormRule } from '@/shared/validation/network';
import { App, Button, Col, Form, Input, InputNumber, Row, type FormInstance } from 'antd';
import type { Rule } from 'antd/es/form';
import { useCallback } from 'react';

/** Props for shared host/port connection fields. */
export interface DeviceConnectionFieldsProps {
  form: FormInstance;
  activeType: DeviceType;
  scalePortRules?: Rule[];
  scalePortPlaceholder?: string;
}

/**
 * Host/port fields for devices that use network or serial connection.
 */
export function DeviceConnectionFields({
  form,
  activeType,
  scalePortRules,
  scalePortPlaceholder,
}: DeviceConnectionFieldsProps) {
  const { modal } = App.useApp();
  const host = Form.useWatch('host', form);
  const port = Form.useWatch('port', form);
  
  const handleCheckConnection = useCallback(() => {
    modal.info({
      title: 'Host',
      content: <>Пока над этим думаем (думает бекенд)<br />{host}: {port}</>,
    })
  }, [host, port]);

  return (
    <Row gutter={12}>
      <Col span={16}>
        <Form.Item name="host" label="Адрес (host)" rules={[hostFormRule(activeType)]}>
          <Input
            placeholder={
              activeType === 'camera'
                ? 'IP'
                : activeType === 'printer'
                  ? 'IP'
                  : undefined
            }
          />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item
          name="port"
          label="Порт"
          dependencies={activeType === 'scale' ? ['type', 'host'] : undefined}
          rules={activeType === 'scale' ? scalePortRules : [portFormRule(true)]}
        >
          {activeType === 'scale' ? (
            <Input placeholder={scalePortPlaceholder} />
          ) : (
            <InputNumber min={1} max={65535} style={{ width: '100%' }} />
          )}
        </Form.Item>
      </Col>
      <Col span={24}>
        <Form.Item>
          <Button block onClick={handleCheckConnection}>
            Проверить подключение
          </Button>
        </Form.Item>
      </Col>
    </Row>
  );
}
