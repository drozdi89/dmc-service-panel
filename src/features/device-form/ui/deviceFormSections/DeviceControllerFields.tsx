import { SelectDeviceControllerType, hostFormRule } from '@/entities/device';
import { Checkbox, Col, Collapse, Form, Input, InputNumber, Row } from 'antd';

const CONTROLLER_PARAM_FIELDS = [
  ['queue_size', 'Размер очереди'],
  ['failed_count', 'Число сбоев'],
  ['pusher_delay', 'Задержка толкателя'],
  ['pusher_time', 'Время толкателя'],
  ['long_siren_time', 'Длинная сирена'],
  ['short_siren_time', 'Короткая сирена'],
  ['trigger_filter_delay', 'Фильтр триггера'],
  ['tact_to_serve', 'Такт serve'],
  ['tact_to_read', 'Такт read'],
  ['queue_one', 'Очередь +1'],
  ['queue_two', 'Очередь +2'],
  ['rst_print', 'Rst print'],
  ['print_job', 'Print job'],
  ['print_delay', 'Print delay'],
  ['queue_step', 'Queue step'],
  ['coil_step', 'Coil step'],
] as const;

/**
 * Controller connection and parameter fields.
 */
export function DeviceControllerFields() {
  return (
    <Collapse
      defaultActiveKey={['main', 'params']}
      items={[
        {
          key: 'main',
          label: 'Подключение',
          children: (
            <>
              <Form.Item
                name="controller_type"
                label="Тип контроллера"
                rules={[{ required: true, message: 'Выберите тип' }]}
              >
                <SelectDeviceControllerType />
              </Form.Item>
              <Row gutter={12}>
                <Col span={16}>
                  <Form.Item
                    name="controller_port"
                    label="Адрес (COM/IP:port)"
                    rules={[hostFormRule('controller_port', true)]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="slave_id" label="Slave ID">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="use_queue" valuePropName="checked">
                <Checkbox>Использовать очередь</Checkbox>
              </Form.Item>
            </>
          ),
        },
        {
          key: 'params',
          label: 'Параметры',
          children: (
            <Row gutter={[12, 0]}>
              {CONTROLLER_PARAM_FIELDS.map(([name, label]) => (
                <Col key={name} span={8}>
                  <Form.Item name={name} label={label}>
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              ))}
              <Col span={12}>
                <Form.Item name="use_single_sensor" valuePropName="checked">
                  <Checkbox>Один датчик</Checkbox>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="using_encoder" valuePropName="checked">
                  <Checkbox>Энкодер</Checkbox>
                </Form.Item>
              </Col>
            </Row>
          ),
        },
      ]}
    />
  );
}
