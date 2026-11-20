import {
  useDataMarkCredentialsQuery,
  useDeleteDataMarkCredentialsMutation,
  useSaveDataMarkCredentialsMutation,
  type DataMarkCredentials,
} from '@/entities/integration';
import { PageSpinner } from '@/shared/ui/loading';
import { App, Button, Checkbox, Drawer, Form, Input, Popconfirm, Space } from 'antd';
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
  const { message } = App.useApp();
  const [form] = Form.useForm<DataMarkCredentials>();

  const settingsQuery = useDataMarkCredentialsQuery({ enabled: open });
  const currentUnp = settingsQuery.data?.unp;

  useEffect(() => {
    if (!open || !settingsQuery.isSuccess) {
      return;
    }
    form.setFieldsValue({ ...EMPTY_CREDENTIALS, ...settingsQuery.data });
  }, [form, open, settingsQuery.data, settingsQuery.isSuccess]);

  const showError = (error: Error) => message.error(error.message);

  const saveMutation = useSaveDataMarkCredentialsMutation({
    onSuccess: () => {
      message.success('Настройки DataMark сохранены');
      onClose();
    },
    onError: showError,
  });

  const deleteMutation = useDeleteDataMarkCredentialsMutation({
    onSuccess: () => {
      message.success('Настройки DataMark удалены');
      onClose();
    },
    onError: showError,
  });

  const handleSave = useCallback(async () => {
    const values = await form.validateFields();
    saveMutation.mutate({
      currentUnp,
      credentials: {
        ...values,
        unp: values.unp.trim(),
        name: values.name.trim(),
        username: values.username?.trim() ?? '',
      },
    });
  }, [currentUnp, form, saveMutation]);

  return (
    <Drawer
      title="Настройки интеграции DataMark (Электронный Знак)"
      open={open}
      onClose={onClose}
      width={520}
      destroyOnClose
      extra={
        <Space>
          {currentUnp ? (
            <Popconfirm
              title="Удалить настройки DataMark?"
              onConfirm={() => deleteMutation.mutate(currentUnp)}
            >
              <Button danger loading={deleteMutation.isPending}>
                Удалить
              </Button>
            </Popconfirm>
          ) : null}
          <Button onClick={onClose}>Отмена</Button>
          <Button
            type="primary"
            loading={saveMutation.isPending}
            onClick={() => void handleSave()}
          >
            Сохранить
          </Button>
        </Space>
      }
    >
      {settingsQuery.isLoading ? (
        <PageSpinner tip="Загрузка настроек DataMark…" />
      ) : (
        <Form form={form} layout="horizontal" labelCol={{ span: 8 }} disabled={saveMutation.isPending}>
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
      )}
    </Drawer>
  );
}
