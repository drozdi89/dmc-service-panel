import {
  useOneCExchangeSettingsActions,
  useOneCExchangeSettingsQuery,
  type OneCExchangeServer,
  type OneCExchangeSettings,
} from '@/entities/integration';
import { PageSpinner } from '@/shared/ui/loading';
import { Button, Checkbox, Drawer, Form, Input, Select, Space } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const PASSWORD_PLACEHOLDER = 'Оставьте пустым, чтобы не менять';

const REFRESH_FIELDS = ['base_url', 'username', 'password', 'enabled', 'srv_id'] as const;

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

interface OneCExchangeFieldsProps {
  passwordConfigured: boolean;
  srvIdOptions: Array<{ value: OneCExchangeServer['code'] | number; label: string }>;
  isRefreshing: boolean;
  onRefresh: () => void;
}

function OneCExchangeFields({
  passwordConfigured,
  srvIdOptions,
  isRefreshing,
  onRefresh,
}: OneCExchangeFieldsProps) {
  const form = Form.useFormInstance<OneCExchangeSettings>();
  const enabled = Form.useWatch('enabled', form);

  return (
    <>
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
          <Button loading={isRefreshing} onClick={onRefresh}>
            Обновить
          </Button>
        </Space.Compact>
      </Form.Item>
    </>
  );
}

/**
 * Drawer for 1C Alife exchange settings (Qt OneCExchangeSettingsWidget parity).
 */
export function OneCExchangeSettingsDrawer({ open, onClose }: OneCExchangeSettingsDrawerProps) {
  const [form] = Form.useForm<OneCExchangeSettings>();
  const loadedRef = useRef<OneCExchangeSettings | null>(null);
  const [passwordConfigured, setPasswordConfigured] = useState(false);
  const [servers, setServers] = useState<OneCExchangeServer[]>([]);

  const settingsQuery = useOneCExchangeSettingsQuery({ enabled: open });
  const { save, refreshServers, isSaving, isRefreshing } = useOneCExchangeSettingsActions({
    onDone: onClose,
  });

  const applyServers = useCallback(
    (serverList: OneCExchangeServer[], selectedSrvId: number | null) => {
      setServers(serverList);
      if (selectedSrvId != null) {
        form.setFieldValue('srv_id', selectedSrvId);
      }
    },
    [form],
  );

  useEffect(() => {
    if (!open || !settingsQuery.isSuccess) {
      return;
    }
    const data = settingsQuery.data;
    loadedRef.current = data;
    const configured = Boolean(data.password);
    setPasswordConfigured(configured);
    form.setFieldsValue({
      ...data,
      enabled: data.enabled ?? false,
      base_url: data.base_url ?? '',
      username: data.username ?? '',
      password: '',
      srv_id: data.srv_id ?? null,
    });
    if (!data.base_url) {
      setServers([]);
      return;
    }
    form
      .validateFields([...REFRESH_FIELDS])
      .then((values) =>
        refreshServers(values, { loaded: data, passwordConfigured: configured }, applyServers),
      )
      .catch(() => undefined);
  }, [applyServers, form, open, refreshServers, settingsQuery.data, settingsQuery.isSuccess]);

  const watchedSrvId = Form.useWatch('srv_id', form) as number | null | undefined;

  const srvIdOptions = useMemo(() => {
    const options = servers.map((server) => ({
      value: server.code,
      label: formatServerLabel(server),
    }));
    if (
      watchedSrvId != null &&
      !options.some((option) => option.value === watchedSrvId)
    ) {
      options.push({ value: watchedSrvId, label: String(watchedSrvId) });
    }
    return options;
  }, [servers, watchedSrvId]);

  const handleSave = useCallback(async () => {
    const values = await form.validateFields();
    save(values, { loaded: loadedRef.current ?? settingsQuery.data, passwordConfigured });
  }, [form, passwordConfigured, save, settingsQuery.data]);

  const handleRefresh = useCallback(async () => {
    const values = await form.validateFields([...REFRESH_FIELDS]);
    refreshServers(
      values,
      { loaded: loadedRef.current ?? settingsQuery.data, passwordConfigured },
      applyServers,
    );
  }, [applyServers, form, passwordConfigured, refreshServers, settingsQuery.data]);

  return (
    <Drawer
      title="Настройка обмена с 1С"
      open={open}
      onClose={onClose}
      size={768}
      forceRender
      extra={
        <Space>
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
        <PageSpinner tip="Загрузка настроек обмена с 1С…" />
      ) : null}
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ span: 8 }}
        disabled={isSaving || settingsQuery.isLoading}
        style={settingsQuery.isLoading ? { display: 'none' } : undefined}
      >
        <OneCExchangeFields
          passwordConfigured={passwordConfigured}
          srvIdOptions={srvIdOptions}
          isRefreshing={isRefreshing}
          onRefresh={() => void handleRefresh()}
        />
      </Form>
    </Drawer>
  );
}
