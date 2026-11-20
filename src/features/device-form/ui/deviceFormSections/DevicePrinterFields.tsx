import { SelectDevicePrinterType } from '@/entities/device';
import { Col, Form, InputNumber, Row } from 'antd';

/**
 * Printer-specific form fields (model, DPI, buffers).
 */
export function DevicePrinterFields() {
  return (
    <>
      <Form.Item
        name="type"
        label="Модель принтера"
        rules={[{ required: true, message: 'Выберите модель' }]}
      >
        <SelectDevicePrinterType />
      </Form.Item>
      <Row gutter={12}>
        <Col span={8}>
          <Form.Item name="dpi" label="DPI">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="buffer" label="Буфер">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="preprint_buffer" label="Preprint буфер">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
}
