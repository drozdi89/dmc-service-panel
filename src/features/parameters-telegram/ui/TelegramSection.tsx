import { Checkbox, Form, Input, Space } from 'antd';
import type { FormInstance } from 'antd';
import { useEffect } from 'react';
import type { TeleBotSettingRow } from '@/entities/parameters';
import { ButtonLoading } from '@/shared/ui/loading';

/** Props for Telegram bot settings section. */
export interface TelegramSectionProps {
  form: FormInstance<TeleBotSettingRow>;
  initialSetting: TeleBotSettingRow | null | undefined;
  saving: boolean;
  onSave: (values: TeleBotSettingRow) => void;
}

/**
 * Telegram bot notification settings — parity with Qt Service Panel.
 */
export function TelegramSection({
  form,
  initialSetting,
  saving,
  onSave,
}: TelegramSectionProps) {
  useEffect(() => {
    form.setFieldsValue({
      ...initialSetting,
      is_activ: initialSetting?.is_activ ?? false,
      api_token: initialSetting?.api_token ?? '',
    });
  }, [form, initialSetting]);

  const isActive = Form.useWatch('is_activ', form);

  return (
    <Form form={form} layout="vertical" onFinish={onSave}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
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
          <ButtonLoading type="primary" htmlType="submit" loading={saving}>
            Сохранить настройки Telegram
          </ButtonLoading>
        </Form.Item>
      </Space>
    </Form>
  );
}
