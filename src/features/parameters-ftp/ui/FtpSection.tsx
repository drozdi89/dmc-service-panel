import { App, Button, Checkbox, Col, Form, Input, InputNumber, Row } from 'antd';
import { useCallback, useEffect } from 'react';
import {
  normalizeFtpConfig,
  useFtpSettings,
  type FtpConfiguration,
} from '@/entities/parameters';
import { ButtonLoading, QueryStateBoundary } from '@/shared/ui/loading';

function FtpFields({ isSaving }: { isSaving: boolean }) {
  const { modal } = App.useApp();
  const form = Form.useFormInstance<FtpConfiguration>();
  const enabled = Form.useWatch('enabled', form);
  const host = Form.useWatch(['connection', 'host'], form);
  const port = Form.useWatch(['connection', 'port'], form);

  const handleCheckConnection = useCallback(() => {
    modal.info({
      title: 'Host',
      content: (
        <>
          Пока над этим думаем (думает бекенд)
          <br />
          {host}: {port}
        </>
      ),
    });
  }, [host, modal, port]);

  return (
    <>
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

      <Form.Item>
        <Button block disabled={!enabled} onClick={handleCheckConnection}>
          Проверить подключение
        </Button>
      </Form.Item>

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
        <ButtonLoading type="primary" htmlType="submit" loading={isSaving}>
          Сохранить настройки FTP
        </ButtonLoading>
      </Form.Item>
    </>
  );
}

/**
 * FTP exchange settings — parity with Qt `gbFtpExchange` + `FtpIntegrationUI`.
 * Loads and saves its own data; toasts come from the entity hook.
 */
export function FtpSection() {
  const [form] = Form.useForm<FtpConfiguration>();
  const { config, isLoading, error, save, isSaving } = useFtpSettings();

  useEffect(() => {
    if (!isLoading && config) {
      form.setFieldsValue(normalizeFtpConfig(config));
    }
  }, [form, isLoading, config]);

  return (
    <QueryStateBoundary
      loading={isLoading}
      error={error}
      errorTitle="Не удалось загрузить настройки FTP"
    >
      <Form form={form} layout="vertical" onFinish={save}>
        <FtpFields isSaving={isSaving} />
      </Form>
    </QueryStateBoundary>
  );
}
