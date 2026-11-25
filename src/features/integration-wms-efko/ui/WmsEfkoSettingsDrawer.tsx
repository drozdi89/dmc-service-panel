import {
  DEFAULT_WMS_MSSQL_PORT,
  useAllLinesQuery,
  useWmsEfkoSettingsActions,
  useWmsEfkoSettingsQuery,
  WMS_EFKO_LINE_FILTER_OPTIONS,
  type LineListItem,
  type WmsEfkoSettings,
  type WmsEfkoSettingsPayload,
} from '@/entities/integration';
import { PageSpinner } from '@/shared/ui/loading';
import {
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
const LINE_LIST_MAX_HEIGHT = 280;

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

interface WmsEfkoFieldsProps {
  lineOptions: LineOption[];
  isTesting: boolean;
  onTestConnection: () => void;
}

function WmsEfkoFields({ lineOptions, isTesting, onTestConnection }: WmsEfkoFieldsProps) {
  const form = Form.useFormInstance<WmsEfkoSettingsPayload>();
  const lineFilterMode = Form.useWatch('line_filter_mode', form);
  const linesListEnabled = lineFilterMode === 'include' || lineFilterMode === 'exclude';
  const enabled = Form.useWatch('enabled', form);

  return (
    <>
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
        <Button loading={isTesting} onClick={onTestConnection} >
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
        <Select options={WMS_EFKO_LINE_FILTER_OPTIONS} />
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
    </>
  );
}

/** Props for WMS (Efko) exchange settings drawer. */
export interface WmsEfkoSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Drawer for WMS (Efko) exchange settings (Qt WmsEfkoSettingsWidget parity).
 */
export function WmsEfkoSettingsDrawer({ open, onClose }: WmsEfkoSettingsDrawerProps) {
  const [form] = Form.useForm<WmsEfkoSettingsPayload>();
  const loadedRef = useRef<WmsEfkoSettings | null>(null);

  const settingsQuery = useWmsEfkoSettingsQuery({ enabled: open });
  const linesQuery = useAllLinesQuery({ enabled: open });
  const { save, testConnection, isSaving, isTesting } = useWmsEfkoSettingsActions({
    onDone: onClose,
  });

  useEffect(() => {
    if (!open || !settingsQuery.isSuccess) {
      return;
    }
    const data = settingsQuery.data;
    loadedRef.current = data;
    form.setFieldsValue({
      ...data,
      mssql_port: data.mssql_port ?? DEFAULT_WMS_MSSQL_PORT,
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

  const handleSave = useCallback(async () => {
    save(await form.validateFields());
  }, [form, save]);

  const handleTestConnection = useCallback(async () => {
    const values = await form.validateFields([
      'mssql_host',
      'mssql_port',
      'mssql_database',
      'mssql_username',
      'mssql_password',
    ]);
    testConnection(values, loadedRef.current ?? settingsQuery.data);
  }, [form, settingsQuery.data, testConnection]);

  const isLoading = settingsQuery.isLoading || linesQuery.isLoading;

  return (
    <Drawer
      title="Интеграция с WMS (ЭФКО)"
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
      {isLoading ? <PageSpinner tip="Загрузка настроек WMS…" /> : null}
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ span: 8 }}
        disabled={isSaving || isLoading}
        style={isLoading ? { display: 'none' } : undefined}
      >
        <WmsEfkoFields
          lineOptions={lineOptions}
          isTesting={isTesting}
          onTestConnection={() => void handleTestConnection()}
        />
      </Form>
    </Drawer>
  );
}
