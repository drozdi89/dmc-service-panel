import { Checkbox, Form, InputNumber } from 'antd';
import type { FormInstance } from 'antd';
import { useEffect } from 'react';
import type { WatchdogConfiguration } from '@/entities/parameters';
import { ButtonLoading } from '@/shared/ui/loading';

/** Props for watchdog configuration section. */
export interface WatchdogSectionProps {
  form: FormInstance<WatchdogConfiguration>;
  initialConfig: WatchdogConfiguration | undefined;
  saving: boolean;
  onSave: (values: WatchdogConfiguration) => void;
}

/**
 * Watchdog service settings from srv_cfg.ini [WATCHDOG] section.
 */
export function WatchdogSection({
  form,
  initialConfig,
  saving,
  onSave,
}: WatchdogSectionProps) {
  useEffect(() => {
    if (initialConfig) {
      form.setFieldsValue(initialConfig);
    }
  }, [form, initialConfig]);

  const enabled = Form.useWatch('enabled', form);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onSave}
      initialValues={initialConfig}
    >
      <Form.Item name="enabled" valuePropName="checked">
        <Checkbox>Включить Watchdog</Checkbox>
      </Form.Item>
      <Form.Item name="port" label="Порт Watchdog">
        <InputNumber
          min={1}
          max={65535}
          disabled={!enabled}
          style={{ width: 160 }}
        />
      </Form.Item>
      <Form.Item>
        <ButtonLoading type="primary" htmlType="submit" loading={saving}>
          Сохранить настройки Watchdog
        </ButtonLoading>
      </Form.Item>
    </Form>
  );
}
