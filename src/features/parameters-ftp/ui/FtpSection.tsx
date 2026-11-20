import { Checkbox, Col, Form, Input, InputNumber, Row } from 'antd';
import type { FormInstance } from 'antd';
import { useEffect } from 'react';
import type { FtpConfiguration } from '@/entities/parameters';
import { ButtonLoading } from '@/shared/ui/loading';

/** FTP settings form values. */
export type FtpFormValues = FtpConfiguration;

/** Props for FTP configuration section. */
export interface FtpSectionProps {
  form: FormInstance<FtpFormValues>;
  initialConfig: FtpConfiguration | undefined;
  saving: boolean;
  onSave: (values: FtpFormValues) => void;
}

const DEFAULT_CONNECTION = {
  host: '',
  port: 21,
  username: '',
  password: '',
  home_dir: '',
  import_dir: '',
  export_dir: '',
};

/**
 * Normalizes FTP API payload for form fields.
 *
 * @param config - FTP configuration from API.
 */
export function normalizeFtpConfig(config: FtpConfiguration): FtpFormValues {
  return {
    enabled: config.enabled,
    processed_file: config.processed_file || 'processed.txt',
    connection: { ...DEFAULT_CONNECTION, ...config.connection },
  };
}

/**
 * FTP exchange settings — parity with Qt `gbFtpExchange` + `FtpIntegrationUI`.
 */
export function FtpSection({ form, initialConfig, saving, onSave }: FtpSectionProps) {
  useEffect(() => {
    if (initialConfig) {
      form.setFieldsValue(normalizeFtpConfig(initialConfig));
    }
  }, [form, initialConfig]);

  const enabled = Form.useWatch('enabled', form);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onSave}
      initialValues={initialConfig ? normalizeFtpConfig(initialConfig) : undefined}
    >
      <Form.Item name="enabled" valuePropName="checked">
        <Checkbox>Включить FTP-обмен</Checkbox>
      </Form.Item>

      <Form.Item name="processed_file" label="Файл-маркер обработки">
        <Input disabled={!enabled} />
      </Form.Item>

      <Row gutter={[16, 0]}>
        <Col xs={24} md={12}>
          <Form.Item name={['connection', 'host']} label="Хост">
            <Input disabled={!enabled} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name={['connection', 'port']} label="Порт">
            <InputNumber min={1} max={65535} disabled={!enabled} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 0]}>
        <Col xs={24} md={12}>
          <Form.Item name={['connection', 'username']} label="Пользователь">
            <Input disabled={!enabled} autoComplete="off" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name={['connection', 'password']} label="Пароль">
            <Input.Password disabled={!enabled} autoComplete="off" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name={['connection', 'home_dir']} label="Домашний каталог">
        <Input disabled={!enabled} />
      </Form.Item>
      <Row gutter={[16, 0]}>
        <Col xs={24} md={12}>
          <Form.Item name={['connection', 'import_dir']} label="Каталог импорта">
            <Input disabled={!enabled} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name={['connection', 'export_dir']} label="Каталог экспорта">
            <Input disabled={!enabled} />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item>
        <ButtonLoading type="primary" htmlType="submit" loading={saving}>
          Сохранить настройки FTP
        </ButtonLoading>
      </Form.Item>
    </Form>
  );
}
