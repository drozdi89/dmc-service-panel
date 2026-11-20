import {
  useAllLinesQuery,
  useSaveWmsEfkoSettingsMutation,
  useTestWmsEfkoConnectionMutation,
  useWmsEfkoSettingsQuery,
  type LineListItem,
  type WmsEfkoLineFilterMode,
  type WmsEfkoSettings,
  type WmsEfkoSettingsPayload,
} from '@/entities/integration';
import { ApiError } from '@/shared/api';
import { PageSpinner } from '@/shared/ui/loading';
import {
  App,
  Button,
  Checkbox,
  Divider,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Typography,
} from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const PASSWORD_PLACEHOLDER = 'Оставьте пустым, чтобы не менять';
const DEFAULT_MSSQL_PORT = 1433;
const LINE_LIST_MAX_HEIGHT = 280;

const LINE_FILTER_OPTIONS: Array<{ value: WmsEfkoLineFilterMode; label: string }> = [
  { value: 'all', label: 'Все линии' },
  { value: 'include', label: 'Только выбранные линии' },
  { value: 'exclude', label: 'Исключить выбранные линии' },
];

/** Option for line checkbox list. */
interface LineOption {
  value: number;
  label: string;
}

/** Props for searchable scrollable line_ids field (Form.Item child). */
interface LineIdsFieldProps {
  value?: number[];
  onChange?: (ids: number[]) => void;
  options: LineOption[];
  disabled?: boolean;
}

/**
 * Checkbox list of lines with name search and vertical scroll.
 *
 * @param value - Selected line ids (Form.Item).
 * @param onChange - Selection change handler (Form.Item).
 * @param options - Sorted line options.
 * @param disabled - When filter mode is «all».
 */
function LineIdsField({
  value = [],
  onChange,
  options,
  disabled = false,
}: LineIdsFieldProps) {
  const [search, setSearch] = useState('');

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return options;
    }
    return options.filter((option) => option.label.toLowerCase().includes(query));
  }, [options, search]);

  return (
    <div style={{ width: '100%' }}>
      <Input.Search
        allowClear
        placeholder="Поиск по названию"
        value={search}
        disabled={disabled}
        onChange={(event) => setSearch(event.target.value)}
        style={{ marginBottom: 8 }}
      />
      <div
        style={{
          maxHeight: LINE_LIST_MAX_HEIGHT,
          overflowY: 'auto',
          border: '1px solid var(--ant-color-border)',
          borderRadius: 6,
          padding: '8px 12px',
          opacity: disabled ? 0.55 : 1,
        }}
      >
        <Checkbox.Group
          options={filteredOptions}
          value={value}
          disabled={disabled}
          onChange={(checked) => onChange?.(checked.map(Number))}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        />
        {filteredOptions.length === 0 ? (
          <Typography.Text type="secondary">Ничего не найдено</Typography.Text>
        ) : null}
      </div>
    </div>
  );
}
/** Props for WMS (Efko) exchange settings drawer. */
export interface WmsEfkoSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Build PUT payload from form values; omit empty password to preserve stored value.
 *
 * @param values - Current form values.
 */
function buildWmsPayload(values: WmsEfkoSettingsPayload): WmsEfkoSettingsPayload {
  const { mssql_password: password, ...rest } = values;
  const payload: WmsEfkoSettingsPayload = {
    ...rest,
    mssql_host: trimText(values.mssql_host) || null,
    mssql_database: trimText(values.mssql_database) || null,
    mssql_username: trimText(values.mssql_username) || null,
    api_host: trimText(values.api_host) || null,
    api_port: values.api_port && values.api_port > 0 ? values.api_port : null,
    line_ids: values.line_ids ?? [],
  };
  const passwordText = trimText(password);
  if (passwordText) {
    payload.mssql_password = passwordText;
  }
  return payload;
}

/**
 * Trims a nullable text field.
 *
 * @param value - Field value from the API object.
 */
function trimText(value: string | null | undefined): string {
  return (value ?? '').trim();
}

/**
 * Validate WMS settings when integration is enabled.
 *
 * @param values - Current form values.
 */
function validateEnabledSettings(values: WmsEfkoSettingsPayload): string | null {
  if (!values.enabled) {
    return null;
  }
  const connectionError = validateMssqlConnectionFields(values);
  if (connectionError) {
    return connectionError;
  }
  const mode = values.line_filter_mode;
  if ((mode === 'include' || mode === 'exclude') && (values.line_ids ?? []).length === 0) {
    const label = LINE_FILTER_OPTIONS.find((option) => option.value === mode)?.label ?? mode;
    return `Выберите хотя бы одну линию для режима фильтра «${label}».`;
  }
  return null;
}

/**
 * Validate MS SQL fields required for connection test.
 *
 * @param values - Current form values.
 */
function validateMssqlConnectionFields(
  values: Pick<WmsEfkoSettingsPayload, 'mssql_host' | 'mssql_database'>,
): string | null {
  if (!trimText(values.mssql_host)) {
    return 'Укажите хост MS SQL WMS.';
  }
  if (!trimText(values.mssql_database)) {
    return 'Укажите имя базы данных MS SQL WMS.';
  }
  return null;
}

/**
 * Drawer for WMS (Efko) exchange settings (Qt WmsEfkoSettingsWidget parity).
 */
export function WmsEfkoSettingsDrawer({ open, onClose }: WmsEfkoSettingsDrawerProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<WmsEfkoSettingsPayload>();
  const loadedRef = useRef<WmsEfkoSettings | null>(null);

  const settingsQuery = useWmsEfkoSettingsQuery({ enabled: open });
  const linesQuery = useAllLinesQuery({ enabled: open });

  useEffect(() => {
    if (!open || !settingsQuery.isSuccess) {
      return;
    }
    const data = settingsQuery.data;
    loadedRef.current = data;
    form.setFieldsValue({
      ...data,
      mssql_port: data.mssql_port ?? DEFAULT_MSSQL_PORT,
      mssql_password: '',
      line_filter_mode: data.line_filter_mode ?? 'all',
      line_ids: data.line_ids ?? [],
    });
  }, [form, open, settingsQuery.data, settingsQuery.isSuccess]);

  const lineOptions = useMemo(
    () =>
      [...(linesQuery.data ?? [])]
        .sort((a, b) => a.lineid - b.lineid)
        .map((line: LineListItem) => ({
          value: line.lineid,
          label: `[${line.lineid}] ${line.linename ?? ''}`,
        })),
    [linesQuery.data],
  );

  const lineFilterMode = Form.useWatch('line_filter_mode', form);
  const linesListEnabled = lineFilterMode === 'include' || lineFilterMode === 'exclude';
  const enabled = Form.useWatch('enabled', form);

  const saveMutation = useSaveWmsEfkoSettingsMutation({
    onSuccess: () => {
      message.success('Настройки интеграции с WMS сохранены');
      onClose();
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const testMutation = useTestWmsEfkoConnectionMutation({
    onSuccess: (result) => {
      if (result.ok) {
        message.success('Подключение к MS SQL WMS успешно');
        return;
      }
      message.error(
        'Проверка подключения к MS SQL WMS не удалась. Проверьте параметры подключения.',
      );
    },
    onError: (error: Error) => {
      message.error(
        error instanceof ApiError
          ? error.message
          : `Не удалось проверить подключение к MS SQL WMS: ${error.message}`,
      );
    },
  });

  const handleSave = useCallback(async () => {
    const values = await form.validateFields();
    const validationError = validateEnabledSettings(values);
    if (validationError) {
      message.error(validationError);
      return;
    }
    saveMutation.mutate(buildWmsPayload(values));
  }, [form, message, saveMutation]);

  const handleTestConnection = useCallback(async () => {
    const values = await form.validateFields([
      'mssql_host',
      'mssql_port',
      'mssql_database',
      'mssql_username',
      'mssql_password',
    ]);
    const validationError = validateMssqlConnectionFields(values);
    if (validationError) {
      message.error(`Не удалось проверить подключение к MS SQL WMS: ${validationError}`);
      return;
    }
    const loaded = loadedRef.current ?? settingsQuery.data;
    if (!loaded) {
      message.error('Настройки не загружены');
      return;
    }
    testMutation.mutate(
      buildWmsPayload({
        ...loaded,
        mssql_host: values.mssql_host,
        mssql_port: values.mssql_port,
        mssql_database: values.mssql_database,
        mssql_username: values.mssql_username,
        mssql_password: values.mssql_password,
      }),
    );
  }, [form, message, settingsQuery.data, testMutation]);

  const isLoading = settingsQuery.isLoading || linesQuery.isLoading;

  return (
    <Drawer
      title="Интеграция с WMS (ЭФКО)"
      open={open}
      onClose={onClose}
      size={768}
      destroyOnHidden
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
      {isLoading ? (
        <PageSpinner tip="Загрузка настроек WMS…" />
      ) : (
        <Form form={form} layout="horizontal" labelCol={{ span: 8 }} disabled={saveMutation.isPending}>
          <Form.Item name="enabled" valuePropName="checked" noStyle style={{ marginBottom: 4 }}>
            <Checkbox>
              Включить интеграцию с WMS (ЭФКО)
            </Checkbox>
          </Form.Item>

          <Divider titlePlacement='left' style={{ marginBottom: 4, marginTop: 0 }}>
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              MS SQL WMS
            </Typography.Title>
          </Divider>

          
          <Form.Item
            name="mssql_host"
            label="Хост"
            rules={
              enabled
                ? [{ required: true, message: 'Укажите хост MS SQL WMS' }]
                : undefined
            }
            style={{ marginBottom: 4 }}
          >
            <Input />
          </Form.Item>
          <Form.Item name="mssql_port" label="Порт" style={{ marginBottom: 4 }}>
            <InputNumber min={1} max={65535} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="mssql_database"
            label="База данных"
            rules={
              enabled
                ? [{ required: true, message: 'Укажите имя базы данных MS SQL WMS' }]
                : undefined
            }
            style={{ marginBottom: 4 }}
          >
            <Input />
          </Form.Item>
          <Form.Item name="mssql_username" label="Имя пользователя" style={{ marginBottom: 4 }}>
            <Input />
          </Form.Item>
          <Form.Item name="mssql_password" label="Пароль" style={{ marginBottom: 4 }}>
            <Input.Password placeholder={PASSWORD_PLACEHOLDER} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }} label=''>
            <Button loading={testMutation.isPending} onClick={() => void handleTestConnection()} >
              Проверить подключение
            </Button>
          </Form.Item>

          <Divider titlePlacement='left' style={{ marginBottom: 0, marginTop: 0 }}>
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              DMC REST API
            </Typography.Title>
          </Divider>

          <Form.Item name="api_host" label="Хост" style={{ marginBottom: 4 }}>
            <Input />
          </Form.Item>
          <Form.Item name="api_port" label="Порт" style={{ marginBottom: 0 }}>
            <InputNumber min={0} max={65535} style={{ width: '100%' }} />
          </Form.Item>

          <Divider titlePlacement='left' style={{ marginBottom: 0, marginTop: 0 }}>
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              Фильтр линий
            </Typography.Title>
          </Divider>

          <Form.Item name="line_filter_mode" label="Режим" style={{ marginBottom: 4 }}>
            <Select options={LINE_FILTER_OPTIONS} />
          </Form.Item>
          <Form.Item
            name="line_ids"
            label="Линии"
            rules={
              enabled && linesListEnabled
                ? [{ required: true, message: 'Выберите хотя бы одну линию' }]
                : undefined
            }
            style={{ marginBottom: 4 }}
            labelCol={{}}
          >
            <LineIdsField options={lineOptions} disabled={!linesListEnabled} />
          </Form.Item>
        </Form>
      )}
    </Drawer>
  );
}
