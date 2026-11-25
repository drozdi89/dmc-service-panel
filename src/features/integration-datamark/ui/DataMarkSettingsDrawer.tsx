import {
  useDataMarkCredentialsQuery,
  useDataMarkSettingsActions,
  type DataMarkCredentials,
} from '@/entities/integration';
import { PageSpinner } from '@/shared/ui/loading';
import { Button, Checkbox, Drawer, Form, Input, Popconfirm, Space } from 'antd';
import { useCallback, useEffect } from 'react';

const EMPTY_CREDENTIALS: DataMarkCredentials = {
  unp: '',
  name: '',
  demo: false,
  username: '',
  password: '',
};

/** Props for DataMark integration settings drawer. */
export interface DataMarkSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Drawer for DataMark (Electronic Mark) integration credentials.
 */
export function DataMarkSettingsDrawer({ open, onClose }: DataMarkSettingsDrawerProps) {
  const [form] = Form.useForm<DataMarkCredentials>();

  const settingsQuery = useDataMarkCredentialsQuery({ enabled: open });
  const currentUnp = settingsQuery.data?.unp;

  useEffect(() => {
    if (!open || !settingsQuery.isSuccess) {
      return;
    }
    form.setFieldsValue({ ...EMPTY_CREDENTIALS, ...settingsQuery.data });
  }, [form, open, settingsQuery.data, settingsQuery.isSuccess]);

  const { save, remove, isSaving, isDeleting } = useDataMarkSettingsActions({ onDone: onClose });

  const handleSave = useCallback(async () => {
    const values = await form.validateFields();
    save({
      currentUnp,
      credentials: {
        ...values,
        unp: values.unp.trim(),
        name: values.name.trim(),
        username: values.username?.trim() ?? '',
      },
    });
  }, [currentUnp, form, save]);

  return (
    <Drawer
      title="Настройки интеграции DataMark (Электронный Знак)"
      open={open}
      onClose={onClose}
      size={520}
      forceRender
      extra={
        <Space>
          {currentUnp ? (
            <Popconfirm
              title="Удалить настройки DataMark?"
              onConfirm={() => remove(currentUnp)}
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
        <PageSpinner tip="Загрузка настроек DataMark…" />
      ) : null}
      {/* Keep Form mounted while open so useForm stays connected during load/setFieldsValue. */}
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ span: 8 }}
        disabled={isSaving || settingsQuery.isLoading}
        style={settingsQuery.isLoading ? { display: 'none' } : undefined}
      >
        <Form.Item
          name="unp"
          label="УНП"
          rules={[{ required: true, message: 'Укажите УНП' }]}
          style={{ marginBottom: 4 }}
        >
          <Input disabled={Boolean(currentUnp)} />
        </Form.Item>
        <Form.Item
          name="name"
          label="Наименование организации"
          rules={[{ required: true, message: 'Укажите наименование' }]}
          style={{ marginBottom: 4 }}
        >
          <Input />
        </Form.Item>
        <Form.Item label="Тестовый контур" name="demo" valuePropName="checked" style={{ marginBottom: 4 }}>
          <Checkbox />
        </Form.Item>
        <Form.Item
          name="username"
          label="Логин"
          rules={[{ required: true, message: 'Укажите логин' }]}
          style={{ marginBottom: 4 }}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="password"
          label="Пароль"
          style={{ marginBottom: 4 }}
        >
          <Input.Password />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
