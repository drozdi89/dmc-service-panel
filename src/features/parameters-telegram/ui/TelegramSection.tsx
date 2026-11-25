import { Checkbox, Form, Input, Space } from 'antd';
import { useEffect } from 'react';
import { useTelegramSettings, type TeleBotSettingRow } from '@/entities/parameters';
import { ButtonLoading, QueryStateBoundary } from '@/shared/ui/loading';

function TelegramFields({ isSaving }: { isSaving: boolean }) {
  const form = Form.useFormInstance<TeleBotSettingRow>();
  const isActive = Form.useWatch('is_activ', form);

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <Form.Item name="is_activ" valuePropName="checked" noStyle>
        <Checkbox>Включить Telegram-уведомления</Checkbox>
      </Form.Item>
      <Form.Item
        name="api_token"
        label="Токен бота"
        rules={
          isActive
            ? [{ required: true, message: 'Заполните токен бота' }]
            : undefined
        }
      >
        <Input.Password autoComplete="off" disabled={!isActive} />
      </Form.Item>
      <Form.Item>
        <ButtonLoading type="primary" htmlType="submit" loading={isSaving}>
          Сохранить настройки Telegram
        </ButtonLoading>
      </Form.Item>
    </Space>
  );
}

/**
 * Telegram bot notification settings — parity with Qt Service Panel.
 * Loads and saves its own data; toasts come from the entity hook.
 */
export function TelegramSection() {
  const [form] = Form.useForm<TeleBotSettingRow>();
  const { setting, isLoading, error, save, isSaving } = useTelegramSettings();

  useEffect(() => {
    if (isLoading) return;
    form.setFieldsValue({
      ...setting,
      is_activ: setting?.is_activ ?? false,
      api_token: setting?.api_token ?? '',
    });
  }, [form, isLoading, setting]);

  return (
    <QueryStateBoundary
      loading={isLoading}
      error={error}
      errorTitle="Не удалось загрузить настройки Telegram"
    >
      <Form form={form} layout="vertical" onFinish={save}>
        <TelegramFields isSaving={isSaving} />
      </Form>
    </QueryStateBoundary>
  );
}
