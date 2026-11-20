import {
  buildDividerPort,
  parseDividerPort,
  validateHost,
} from '@/entities/device';
import { Col, Form, Input, InputNumber, Row } from 'antd';
import { useEffect, useState } from 'react';

/**
 * Divider device connection and delay fields.
 *
 * Form stores API fields `port` (`host:port`) and `delay` (ms).
 * Host / numeric port are local UI state synced into `port`.
 */
export function DeviceDividerFields() {
  const form = Form.useFormInstance();
  const portValue = Form.useWatch('port', form) as string | undefined;
  const [host, setHost] = useState('');
  const [portNum, setPortNum] = useState(502);

  useEffect(() => {
    const parsed = parseDividerPort(portValue ?? '');
    setHost(parsed.host);
    const numeric = Number(parsed.port);
    setPortNum(Number.isFinite(numeric) && numeric > 0 ? numeric : 502);
  }, [portValue]);

  const syncPort = (nextHost: string, nextPort: number) => {
    form.setFieldValue('port', buildDividerPort(nextHost, String(nextPort)));
  };

  return (
    <>
      <Row gutter={12}>
        <Col span={16}>
          <Form.Item
            label="Адрес (host/COM)"
            required
            validateStatus={
              host.trim() && validateHost('divider_host', host.trim())
                ? 'error'
                : undefined
            }
            help={
              host.trim()
                ? validateHost('divider_host', host.trim()) ?? undefined
                : undefined
            }
          >
            <Input
              value={host}
              onChange={(event) => {
                const next = event.target.value;
                setHost(next);
                syncPort(next, portNum);
              }}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Порт" required>
            <InputNumber
              min={1}
              max={65535}
              style={{ width: '100%' }}
              value={portNum}
              onChange={(next) => {
                const value =
                  typeof next === 'number' && Number.isFinite(next) ? next : 502;
                setPortNum(value);
                syncPort(host, value);
              }}
            />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item
        name="port"
        hidden
        rules={[
          {
            validator: async (_, value: string | undefined) => {
              const parsed = parseDividerPort(value ?? '');
              if (!parsed.host.trim()) {
                throw new Error('Укажите адрес делителя');
              }
              const message = validateHost('divider_host', parsed.host.trim());
              if (message) {
                throw new Error(message);
              }
            },
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="delay"
        label="Задержка (сек)"
        getValueProps={(ms: number | undefined) => ({
          value: (ms ?? 0) / 1000,
        })}
        normalize={(sec: number | null) => Math.round((sec ?? 0) * 1000)}
      >
        <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
      </Form.Item>
    </>
  );
}
