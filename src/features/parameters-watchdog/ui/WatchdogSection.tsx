import { Checkbox, Form, InputNumber } from 'antd';
import { useEffect } from 'react';
import { useWatchdogSettings, type WatchdogConfiguration } from '@/entities/parameters';
import { ButtonLoading, QueryStateBoundary } from '@/shared/ui/loading';

function WatchdogFields({ isSaving }: { isSaving: boolean }) {
  const form = Form.useFormInstance<WatchdogConfiguration>();
  const enabled = Form.useWatch('enabled', form);

  return (
    <>
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
        <ButtonLoading type="primary" htmlType="submit" loading={isSaving}>
          Сохранить настройки Watchdog
        </ButtonLoading>
      </Form.Item>
    </>
  );
}

/**
 * Watchdog service settings from srv_cfg.ini [WATCHDOG] section.
 * Loads and saves its own data; toasts come from the entity hook.
 */
export function WatchdogSection() {
  const [form] = Form.useForm<WatchdogConfiguration>();
  const { config, isLoading, error, save, isSaving } = useWatchdogSettings();

  useEffect(() => {
    if (!isLoading && config) {
      form.setFieldsValue(config);
    }
  }, [form, isLoading, config]);

  return (
    <QueryStateBoundary
      loading={isLoading}
      error={error}
      errorTitle="Не удалось загрузить настройки Watchdog"
    >
      <Form form={form} layout="vertical" onFinish={save}>
        <WatchdogFields isSaving={isSaving} />
      </Form>
    </QueryStateBoundary>
  );
}
