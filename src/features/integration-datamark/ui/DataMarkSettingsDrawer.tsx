import {
  DATAMARK_QUERY_KEY,
  createDataMarkCredentials,
  deleteDataMarkCredentials,
  saveDataMarkCredentials,
  useDataMarkCredentialsQuery,
  type DataMarkCredentials,
} from '@/entities/integration';
import { ApiError } from '@/shared/api';
import { createIdempotencyKey } from '@/shared/api/headers';
import { PageSpinner } from '@/shared/ui/loading';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Button, Checkbox, Drawer, Form, Input, Popconfirm, Space } from 'antd';
import { useCallback, useEffect } from 'react';

/** Form values for DataMark credentials drawer. */
interface DataMarkFormValues {
  unp: string;
  name: string;
  demo: boolean;
  username: string;
  password: string;
}

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
  const queryClient = useQueryClient();
  const [form] = Form.useForm<DataMarkFormValues>();

  const settingsQuery = useDataMarkCredentialsQuery({ enabled: open });

  useEffect(() => {
    if (!open || !settingsQuery.isSuccess) {
      return;
    }
    const data = settingsQuery.data;
    if (data?.unp) {
      form.setFieldsValue({
        unp: data.unp,
        name: data.name ?? '',
        demo: data.demo ?? false,
        username: data.username ?? '',
        password: data.password ?? '',
      });
      return;
    }
    form.setFieldsValue({
      unp: '',
      name: '',
      demo: false,
      username: '',
      password: undefined,
    });
  }, [form, open, settingsQuery.data, settingsQuery.isSuccess]);

  const saveMutation = useMutation({
    mutationFn: async (values: DataMarkFormValues) => {
      console.log(values)
      const payload: DataMarkCredentials = {
        unp: values.unp.trim(),
        name: values.name.trim(),
        demo: values.demo,
        username: values.username.trim(),
        password: values.password,
      };
      console.log(payload)
      const key = createIdempotencyKey();
      if (settingsQuery.data?.unp) {
        return saveDataMarkCredentials(settingsQuery.data.unp, payload, key);
      }
      return createDataMarkCredentials(payload, key);
    },
    onSuccess: () => {
      message.success('Настройки DataMark сохранены');
      void queryClient.invalidateQueries({ queryKey: DATAMARK_QUERY_KEY });
      onClose();
    },
    onError: (error: Error) => {
      message.error(error instanceof ApiError ? error.message : error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const unp = settingsQuery.data?.unp;
      if (!unp) {
        return;
      }
      return deleteDataMarkCredentials([unp], createIdempotencyKey());
    },
    onSuccess: () => {
      message.success('Настройки DataMark удалены');
      void queryClient.invalidateQueries({ queryKey: DATAMARK_QUERY_KEY });
      onClose();
    },
    onError: (error: Error) => {
      message.error(error instanceof ApiError ? error.message : error.message);
    },
  });

  const handleSave = useCallback(async () => {
    const values = await form.validateFields();
    saveMutation.mutate(values);
  }, [form, saveMutation]);

  return (
    <Drawer
      title="Настройки интеграции DataMark (Электронный Знак)"
      open={open}
      onClose={onClose}
      width={520}
      destroyOnClose
      extra={
        <Space>
          {settingsQuery.data?.unp ? (
            <Popconfirm
              title="Удалить настройки DataMark?"
              onConfirm={() => deleteMutation.mutate()}
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
            <Input disabled={Boolean(settingsQuery.data?.unp)} />
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
