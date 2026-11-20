import { hostFormRule } from '@/entities/device';
import { portFormRule } from '@/shared/validation/network';
import { Col, Form, Input, InputNumber, Row } from 'antd';

/**
 * Divider device connection and delay fields.
 */
export function DeviceDividerFields() {
  return (
    <>
      <Row gutter={12}>
        <Col span={16}>
          <Form.Item
            name="divider_host"
            label="Адрес (host/COM)"
            rules={[hostFormRule('divider_host', true)]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="divider_port" label="Порт" rules={[portFormRule(true)]}>
            <InputNumber min={1} max={65535} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="divider_delay_sec" label="Задержка (сек)">
        <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
      </Form.Item>
    </>
  );
}
