import {
  UTRACE_QUERY_KEY,
  createUtraceSettings,
  deleteUtraceSettings,
  saveUtraceSettings,
  useUtraceSettingsQuery,
  type UtraceSettings,
} from '@/entities/integration';
import { ApiError } from '@/shared/api';
import { createIdempotencyKey } from '@/shared/api/headers';
import { PageSpinner } from '@/shared/ui/loading';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Button, Drawer, Form, Input, Popconfirm, Space } from 'antd';
import { useCallback, useEffect } from 'react';

/** Form values for Utrace settings drawer. */
type UtraceFormValues = UtraceSettings;

/** Props for Utrace integration settings drawer. */
export interface UtraceSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Drawer for Utrace integration credentials (Qt UtraceSettingWidget parity).
 */
export function UtraceSettingsDrawer({ open, onClose }: UtraceSettingsDrawerProps) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<UtraceFormValues>();

  const settingsQuery = useUtraceSettingsQuery({ enabled: open });

  useEffect(() => {
    if (!open || !settingsQuery.isSuccess) {
      return;
    }
    const data = settingsQuery.data;
    if (data?.inn) {
      form.setFieldsValue({
        inn: data.inn,
        login: data.login ?? '',
        password: data.password ?? '',
        base_url: data.base_url ?? '',
        production_site: data.production_site ?? '',
      });
      return;
    }
    form.setFieldsValue({
      inn: '',
      login: '',
      password: '',
      base_url: '',
      production_site: '',
    });
  }, [form, open, settingsQuery.data, settingsQuery.isSuccess]);

  const saveMutation = useMutation({
    mutationFn: async (values: UtraceFormValues) => {
      const payload: UtraceSettings = {
        inn: values.inn.trim(),
        login: values.login.trim(),
        password: values.password,
        base_url: values.base_url.trim(),
        production_site: values.production_site.trim(),
      };
      const key = createIdempotencyKey();
      if (settingsQuery.data?.inn) {
        return saveUtraceSettings(settingsQuery.data.inn, payload, key);
      }
      return createUtraceSettings(payload, key);
    },
    onSuccess: () => {
      message.success('Настройки Utrace сохранены');
      void queryClient.invalidateQueries({ queryKey: UTRACE_QUERY_KEY });
      onClose();
    },
    onError: (error: Error) => {
      message.error(error instanceof ApiError ? error.message : error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteUtraceSettings(createIdempotencyKey()),
    onSuccess: () => {
      message.success('Настройки Utrace удалены');
      void queryClient.invalidateQueries({ queryKey: UTRACE_QUERY_KEY });
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

  const isEditMode = Boolean(settingsQuery.data?.inn);

  return (
    <Drawer
      title="Настройки интеграции UTrace"
      open={open}
      onClose={onClose}
      width={768}
      destroyOnClose
      extra={
        <Space>
          {settingsQuery.data?.inn ? (
            <Popconfirm
              title="Удалить настройки Utrace?"
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
        <PageSpinner tip="Загрузка настроек Utrace…" />
      ) : (
        <Form form={form} layout="horizontal" labelCol={{ span: 6 }} disabled={saveMutation.isPending}>
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
      )}
    </Drawer>
  );
}
