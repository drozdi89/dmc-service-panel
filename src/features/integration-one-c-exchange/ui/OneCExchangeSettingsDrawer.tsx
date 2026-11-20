import {
  ONE_C_EXCHANGE_QUERY_KEY,
  fetchOneCExchangeServers,
  saveOneCExchangeSettings,
  useOneCExchangeSettingsQuery,
  type OneCExchangeServer,
  type OneCExchangeSettings,
  type OneCExchangeSettingsPayload,
} from '@/entities/integration';
import { ApiError } from '@/shared/api';
import { createIdempotencyKey } from '@/shared/api/headers';
import { PageSpinner } from '@/shared/ui/loading';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Button, Checkbox, Drawer, Form, Input, Select, Space } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const PASSWORD_PLACEHOLDER = 'Оставьте пустым, чтобы не менять';

/** Form values for 1C exchange settings drawer. */
interface OneCExchangeFormValues {
  enabled: boolean;
  base_url: string;
  username: string;
  password: string;
  srv_id: number | null;
}

/** Props for 1C exchange settings drawer. */
export interface OneCExchangeSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Format one DMC server entry for the srv_id select.
 *
 * @param server - Server row from GET /one_c_exchange/servers.
 */
function formatServerLabel(server: OneCExchangeServer): string {
  return `[${server.code}] ${server.name} (${server.ip}:${server.port})`;
}

/**
 * Resolve password for PUT: omit when empty and already configured.
 *
 * @param passwordText - Raw password field value.
 * @param passwordConfigured - Whether a password is stored on the server.
 * @param loadedPassword - Password from loaded settings snapshot.
 */
function resolvePasswordForPut(
  passwordText: string,
  passwordConfigured: boolean,
  loadedPassword: string | null | undefined,
): string | undefined {
  if (passwordText) {
    return passwordText;
  }
  if (passwordConfigured && loadedPassword) {
    return loadedPassword;
  }
  return undefined;
}

/**
 * Drawer for 1C Alife exchange settings (Qt OneCExchangeSettingsWidget parity).
 */
export function OneCExchangeSettingsDrawer({ open, onClose }: OneCExchangeSettingsDrawerProps) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<OneCExchangeFormValues>();
  const loadedRef = useRef<OneCExchangeSettings | null>(null);
  const [passwordConfigured, setPasswordConfigured] = useState(false);
  const [servers, setServers] = useState<OneCExchangeServer[]>([]);

  const settingsQuery = useOneCExchangeSettingsQuery({ enabled: open });

  useEffect(() => {
    if (!open || !settingsQuery.isSuccess) {
      return;
    }
    const data = settingsQuery.data;
    loadedRef.current = data;
    const configured = Boolean(data.password);
    setPasswordConfigured(configured);
    form.setFieldsValue({
      enabled: data.enabled ?? false,
      base_url: data.base_url ?? '',
      username: data.username ?? '',
      password: '',
      srv_id: data.srv_id ?? null,
    });
    if (data.base_url) {
      handleRefresh()
    } else {
      setServers([]);
    }
  }, [form, open, settingsQuery.data, settingsQuery.isSuccess]);

  const srvIdOptions = useMemo(() => {
    const options = servers.map((server) => ({
      value: server.code,
      label: formatServerLabel(server),
    }));
    const currentSrvId = form.getFieldValue('srv_id') as number | null | undefined;
    if (
      currentSrvId != null &&
      !options.some((option) => option.value === currentSrvId)
    ) {
      options.push({ value: currentSrvId, label: String(currentSrvId) });
    }
    return options;
  }, [form, servers]);

  const buildPayload = useCallback(
    (
      values: OneCExchangeFormValues,
      loaded: OneCExchangeSettings,
      options?: { preserveFlags?: boolean },
    ): OneCExchangeSettingsPayload => {
      const passwordText = values.password.trim();
      const password = resolvePasswordForPut(
        passwordText,
        passwordConfigured,
        loaded.password,
      );
      const payload: OneCExchangeSettingsPayload = {
        enabled: options?.preserveFlags ? loaded.enabled : values.enabled,
        base_url: values.base_url.trim() || null,
        username: values.username.trim() || null,
        srv_id: options?.preserveFlags ? loaded.srv_id ?? null : values.srv_id,
      };
      if (password !== undefined) {
        payload.password = password;
      }
      return payload;
    },
    [passwordConfigured],
  );

  const validateSettings = useCallback(
    (values: OneCExchangeFormValues, loaded: OneCExchangeSettings): string | null => {
      const passwordText = values.password.trim();
      const hasPassword =
        Boolean(passwordText) || (passwordConfigured && Boolean(loaded.password));

      if (!values.base_url.trim()) {
        return 'Укажите базовый URL публикации 1С.';
      }
      if (!values.username.trim()) {
        return 'Укажите имя пользователя для Basic Auth.';
      }
      if (!hasPassword) {
        return 'Укажите пароль для Basic Auth.';
      }
      return null;
    },
    [passwordConfigured],
  );

  const validateEnabledSettings = useCallback(
    (values: OneCExchangeFormValues, loaded: OneCExchangeSettings): string | null => {
      if (!values.enabled) {
        return null;
      }
      const connectionError = validateSettings(values, loaded);
      if (connectionError) {
        return connectionError;
      }
      if (values.srv_id == null) {
        return 'Выберите сервер DMC (srv_id) или обновите список серверов.';
      }
      return null;
    },
    [validateSettings],
  );

  const saveMutation = useMutation({
    mutationFn: async (values: OneCExchangeFormValues) => {
      const loaded = loadedRef.current ?? settingsQuery.data;
      if (!loaded) {
        throw new Error('Настройки не загружены');
      }
      const validationError = validateEnabledSettings(values, loaded);
      if (validationError) {
        throw new Error(validationError);
      }
      const payload = buildPayload(values, loaded);
      return saveOneCExchangeSettings(payload, createIdempotencyKey());
    },
    onSuccess: () => {
      message.success('Настройки обмена с 1С сохранены');
      void queryClient.invalidateQueries({ queryKey: ONE_C_EXCHANGE_QUERY_KEY });
      onClose();
    },
    onError: (error: Error) => {
      message.error(error instanceof ApiError ? error.message : error.message);
    },
  });

  const refreshMutation = useMutation({
    mutationFn: async (values: OneCExchangeFormValues) => {
      const loaded = loadedRef.current ?? settingsQuery.data;
      if (!loaded) {
        throw new Error('Настройки не загружены');
      }
      const connectionError = validateSettings(values, loaded);
      if (connectionError) {
        throw new Error(connectionError);
      }
      if (values.enabled) {
        const enabledError = validateEnabledSettings(values, loaded);
        if (enabledError) {
          throw new Error(enabledError);
        }
      }
      const payload = buildPayload(values, loaded, { preserveFlags: true });
      await saveOneCExchangeSettings(payload, createIdempotencyKey());
      const response = await fetchOneCExchangeServers();
      return { response, selectedSrvId: values.srv_id ?? loaded.srv_id ?? null };
    },
    onSuccess: ({ response, selectedSrvId }) => {
      const serverList = response.servers ?? [];
      setServers(serverList);
      if (serverList.length === 0) {
        message.warning(
          '1С не вернула доступных серверов DMC. Проверьте настройки подключения и публикацию Alife.',
        );
        if (selectedSrvId != null) {
          form.setFieldValue('srv_id', selectedSrvId);
        }
        return;
      }
      if (
        selectedSrvId != null &&
        !serverList.some((server) => server.code === selectedSrvId)
      ) {
        message.warning(
          `Текущий srv_id (${selectedSrvId}) не найден в ответе 1С. Выберите сервер из списка или проверьте настройки.`,
        );
        form.setFieldValue('srv_id', selectedSrvId);
        return;
      }
      if (selectedSrvId != null) {
        form.setFieldValue('srv_id', selectedSrvId);
      }
      void queryClient.invalidateQueries({ queryKey: ONE_C_EXCHANGE_QUERY_KEY });
      message.success('Список серверов DMC обновлён');
    },
    onError: (error: Error) => {
      message.error(
        error instanceof ApiError
          ? error.message
          : `Не удалось получить список серверов DMC из 1С: ${error.message}`,
      );
    },
  });

  const handleSave = useCallback(async () => {
    const values = await form.validateFields();
    saveMutation.mutate(values);
  }, [form, saveMutation]);

  const handleRefresh = useCallback(async () => {
    const values = await form.validateFields(['base_url', 'username', 'password', 'enabled', 'srv_id']);
    refreshMutation.mutate(values);
  }, [form, refreshMutation]);

  const enabled = Form.useWatch('enabled', form);

  return (
    <Drawer
      title="Настройка обмена с 1С"
      open={open}
      onClose={onClose}
      width={768}
      destroyOnClose
      extra={
        <Space>
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
        <PageSpinner tip="Загрузка настроек обмена с 1С…" />
      ) : (
        <Form form={form} layout="horizontal" labelCol={{ span: 8 }} disabled={saveMutation.isPending}>
          <Form.Item label='Включить обмен с 1С' name="enabled" valuePropName="checked" style={{ marginBottom: 4 }}>
            <Checkbox />
          </Form.Item>
          <Form.Item
            name="base_url"
            label="Базовый URL публикации 1С"
            rules={
              enabled
                ? [{ required: true, message: 'Укажите базовый URL публикации 1С' }]
                : undefined
            }
            style={{ marginBottom: 4 }}
          >
            <Input placeholder="https://host/base" />
          </Form.Item>
          <Form.Item
            name="username"
            label="Имя пользователя"
            rules={
              enabled
                ? [{ required: true, message: 'Укажите имя пользователя для Basic Auth' }]
                : undefined
            }
            style={{ marginBottom: 4 }}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label="Пароль"
            rules={
              enabled && !passwordConfigured
                ? [{ required: true, message: 'Укажите пароль для Basic Auth' }]
                : undefined
            }
            style={{ marginBottom: 4 }}
          >
            <Input.Password placeholder={passwordConfigured ? PASSWORD_PLACEHOLDER : undefined} />
          </Form.Item>
          <Form.Item label="Сервер DMC (srv_id)" style={{ marginBottom: 4 }}>
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item
                name="srv_id"
                noStyle
                rules={
                  enabled
                    ? [{ required: true, message: 'Выберите сервер DMC (srv_id)' }]
                    : undefined
                }
              >
                <Select
                  allowClear
                  placeholder="Выберите сервер"
                  options={srvIdOptions}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Button
                loading={refreshMutation.isPending}
                onClick={() => void handleRefresh()}
              >
                Обновить
              </Button>
            </Space.Compact>
          </Form.Item>
        </Form>
      )}
    </Drawer>
  );
}
