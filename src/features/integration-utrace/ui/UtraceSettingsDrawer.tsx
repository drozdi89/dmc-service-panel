import {
  useUtraceSettingsActions,
  useUtraceSettingsQuery,
  type UtraceSettings,
} from '@/entities/integration';
import { PageSpinner } from '@/shared/ui/loading';
import { Button, Drawer, Form, Input, Popconfirm, Space } from 'antd';
import { useCallback, useEffect } from 'react';

const EMPTY_SETTINGS: UtraceSettings = {
  inn: '',
  login: '',
  password: '',
  base_url: '',
  production_site: '',
};

/** Props for Utrace integration settings drawer. */
export interface UtraceSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Drawer for Utrace integration credentials (Qt UtraceSettingWidget parity).
 */
export function UtraceSettingsDrawer({ open, onClose }: UtraceSettingsDrawerProps) {
  const [form] = Form.useForm<UtraceSettings>();

  const settingsQuery = useUtraceSettingsQuery({ enabled: open });
  const currentInn = settingsQuery.data?.inn;

  useEffect(() => {
    if (!open || !settingsQuery.isSuccess) {
      return;
    }
    form.setFieldsValue({ ...EMPTY_SETTINGS, ...settingsQuery.data });
  }, [form, open, settingsQuery.data, settingsQuery.isSuccess]);

  const { save, remove, isSaving, isDeleting } = useUtraceSettingsActions({ onDone: onClose });

  const handleSave = useCallback(async () => {
    const values = await form.validateFields();
    save({
      currentInn,
      settings: {
        inn: values.inn.trim(),
        login: values.login.trim(),
        password: values.password,
        base_url: values.base_url.trim(),
        production_site: values.production_site.trim(),
      },
    });
  }, [currentInn, form, save]);

  const isEditMode = Boolean(currentInn);

  return (
    <Drawer
      title="Настройки интеграции UTrace"
      open={open}
      onClose={onClose}
      size={768}
      forceRender
      extra={
        <Space>
          {isEditMode ? (
            <Popconfirm
              title="Удалить настройки Utrace?"
              onConfirm={remove}
            >
              <Button danger loading={isDeleting}>
                Удалить
              </Button>
            </Popconfirm>
          ) : null}
          <Button onClick={onClose}>Отмена</Button>
          <Button
            type="primary"
            loading={isSaving}
            onClick={() => void handleSave()}
          >
            Сохранить
          </Button>
        </Space>
      }
    >
      {settingsQuery.isLoading ? (
        <PageSpinner tip="Загрузка настроек Utrace…" />
      ) : null}
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ span: 6 }}
        disabled={isSaving || settingsQuery.isLoading}
        style={settingsQuery.isLoading ? { display: 'none' } : undefined}
      >
        <Form.Item
          name="inn"
          label="ИНН"
          rules={[{ required: true, message: 'Укажите ИНН' }]}
          style={{ marginBottom: 4 }}
        >
          <Input disabled={isEditMode} />
        </Form.Item>
        <Form.Item
          name="production_site"
          label="Номер площадки"
          rules={[{ required: true, message: 'Укажите номер площадки' }]}
          style={{ marginBottom: 4 }}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="base_url"
          label="Базовый URL"
          rules={[{ required: true, message: 'Укажите базовый URL' }]}
          style={{ marginBottom: 4 }}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="login"
          label="Логин"
          rules={[{ required: true, message: 'Укажите логин' }]}
          style={{ marginBottom: 4 }}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="password"
          label="Пароль"
          rules={[{ required: true, message: 'Укажите пароль' }]}
          style={{ marginBottom: 4 }}
        >
          <Input.Password />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
