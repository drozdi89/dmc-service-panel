import {
  useAutoorderOptionsQuery,
  useSaveAutoorderOptionsMutation,
  type AutoorderOptions,
  type AutoorderProductRow,
} from '@/entities/integration';
import {
  DRAWER_FILLED_CONTENT_STYLE,
  DRAWER_FILLED_STYLES,
  drawerFilledTableStyles,
  useTableBodyScrollY,
} from '@/shared/ui/drawerFilledTable';
import { PageSpinner } from '@/shared/ui/loading';
import {
  Alert,
  App,
  Button,
  Checkbox,
  Divider,
  Drawer,
  Flex,
  Form,
  InputNumber,
  Modal,
  Pagination,
  Space,
  Table,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AUTOORDER_AMOUNT_MAX, AutoorderAmountCell } from './AutoorderAmountCell';

const PAGE_SIZE = 20;

/** Props for autoorder settings drawer. */
export interface AutoorderSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Drawer for autoorder code parameters (Qt AutoorderSettings parity).
 */
export function AutoorderSettingsDrawer({ open, onClose }: AutoorderSettingsDrawerProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<AutoorderOptions>();
  const [rows, setRows] = useState<AutoorderProductRow[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [customAmountOpen, setCustomAmountOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState<number>(1);

  const optionsQuery = useAutoorderOptionsQuery({ enabled: open });

  useEffect(() => {
    if (!open || !optionsQuery.isSuccess || !optionsQuery.data) {
      return;
    }
    const { products, ...settings } = optionsQuery.data;
    form.setFieldsValue(settings);
    setRows(Object.values(products ?? {}));
    setSelectedKeys([]);
    setPage(1);
    setCustomAmountOpen(false);
    setCustomAmount(1);
  }, [form, open, optionsQuery.data, optionsQuery.isSuccess]);

  const saveMutation = useSaveAutoorderOptionsMutation({
    onSuccess: () => {
      message.success('Параметры автозаказа сохранены');
      onClose();
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const applyAmountToSelected = useCallback(
    (amount: number) => {
      setRows((prev) =>
        prev.map((row) =>
          selectedKeys.includes(row.gtin) ? { ...row, amount } : row,
        ),
      );
    },
    [selectedKeys],
  );

  const handleSave = useCallback(async () => {
    const values = await form.validateFields();
    const products = rows.reduce<Record<string, AutoorderProductRow>>((acc, row) => {
      acc[row.gtin] = row;
      return acc;
    }, {});
    saveMutation.mutate({ ...values, products });
  }, [form, rows, saveMutation]);

  const enabled = (Form.useWatch('mode', form) ?? 0) !== 0;

  useEffect(() => {
    if (!enabled) {
      setSelectedKeys([]);
    }
  }, [enabled]);

  const setRowAmount = useCallback((gtin: string, amount: number) => {
    setRows((prev) =>
      prev.map((row) => (row.gtin === gtin ? { ...row, amount } : row)),
    );
  }, []);

  const columns = useMemo<ColumnsType<AutoorderProductRow>>(
    () => [
      { title: 'Продукт', dataIndex: 'name', key: 'name', ellipsis: true },
      { title: 'GTIN', dataIndex: 'gtin', key: 'gtin', width: 140 },
      {
        title: 'Количество',
        dataIndex: 'amount',
        key: 'amount',
        width: 280,
        render: (value: number, record) => (
          <AutoorderAmountCell
            amount={value}
            disabled={!enabled}
            onChange={(amount) => setRowAmount(record.gtin, amount)}
          />
        ),
      },
    ],
    [enabled, setRowAmount],
  );

  const loadError = optionsQuery.isError;
  const dataReady = optionsQuery.isSuccess;
  const saveDisabled = optionsQuery.isLoading || loadError || !dataReady;
  const contentReady = open && !optionsQuery.isLoading && dataReady;

  const [tableHost, setTableHost] = useState<HTMLDivElement | null>(null);
  const tableHostRef = useCallback((node: HTMLDivElement | null) => {
    setTableHost(node);
  }, []);
  const tableScrollY = useTableBodyScrollY(tableHost, contentReady, enabled);

  const pageData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [page, rows]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(rows.length / PAGE_SIZE) || 1);
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [page, rows.length]);

  return (
    <>
    <Drawer
      title="Настройка параметров автозаказа"
      open={open}
      onClose={onClose}
      size={768}
      destroyOnHidden
      styles={DRAWER_FILLED_STYLES}
      extra={
        <Space>
          <Button onClick={onClose}>Отмена</Button>
          <Button
            type="primary"
            loading={saveMutation.isPending}
            disabled={saveDisabled}
            onClick={() => void handleSave()}
          >
            Сохранить
          </Button>
        </Space>
      }
    >
      {optionsQuery.isLoading ? (
        <PageSpinner tip="Загрузка параметров автозаказа…" />
      ) : loadError ? (
        <Alert
          type="error"
          showIcon
          message="Не удалось загрузить параметры автозаказа"
          description="Сохранение недоступно. Закройте окно и попробуйте снова."
        />
      ) : (
        <div style={DRAWER_FILLED_CONTENT_STYLE}>
          <Form
            form={form}
            layout="horizontal"
            disabled={saveMutation.isPending}
            labelCol={{ span: 8 }}
            style={{ flexShrink: 0 }}
          >
            <Form.Item
              name="percent"
              label="Резервировать дополнительно"
              style={{ marginBottom: 0 }}
            >
              <InputNumber min={0} max={100} suffix="%" />
              <Typography.Text style={{ marginLeft: 4 }}>
                кодов от размера задания
              </Typography.Text>
            </Form.Item>
            <Divider titlePlacement="left" style={{ margin: 0 }}>
              <Form.Item
                name="mode"
                valuePropName="checked"
                getValueProps={(mode?: number) => ({ checked: (mode ?? 0) !== 0 })}
                normalize={(checked: boolean) => (checked ? 1 : 0)}
                noStyle
              >
                <Checkbox>Включить автозаказ</Checkbox>
              </Form.Item>
            </Divider>
            <Form.Item name="days" label="Дней до истечения срока" style={{ marginBottom: 4 }}>
              <InputNumber min={1} disabled={!enabled} />
            </Form.Item>
            <Form.Item name="amount" label="КМ в день (по умолчанию)" style={{ marginBottom: 0 }}>
              <InputNumber min={0} disabled={!enabled} />
            </Form.Item>
            <Form.Item name="new_products_enabled" label="Автозаказ для новой продукции" style={{ marginBottom: 0 }} valuePropName="checked">
              <Checkbox  />
            </Form.Item>
          </Form>

          <Flex gap="1rem" wrap style={{ flexShrink: 0 }}>
            <Button
              disabled={!enabled || selectedKeys.length === 0}
              onClick={() => applyAmountToSelected(0)}
            >
              По умолчанию
            </Button>
            <Button
              disabled={!enabled || selectedKeys.length === 0}
              onClick={() => applyAmountToSelected(-1)}
            >
              Отключить
            </Button>
            <Button
              disabled={!enabled || selectedKeys.length === 0}
              onClick={() => {
                setCustomAmount(1);
                setCustomAmountOpen(true);
              }}
            >
              Задать значение…
            </Button>
          </Flex>

          <div ref={tableHostRef} className={drawerFilledTableStyles.tableHost}>
            <Table<AutoorderProductRow>
              size="small"
              rowKey="gtin"
              rowSelection={{
                selectedRowKeys: selectedKeys,
                onChange: (keys) => setSelectedKeys(keys.map(String)),
                getCheckboxProps: () => ({ disabled: !enabled }),
              }}
              columns={columns}
              dataSource={pageData}
              pagination={false}
              scroll={tableScrollY != null ? { y: tableScrollY } : undefined}
              style={{ userSelect: 'none' }}
            />
          </div>
          <div className={drawerFilledTableStyles.paginationBar}>
            <Pagination
              current={page}
              pageSize={PAGE_SIZE}
              total={rows.length}
              showSizeChanger={false}
              onChange={setPage}
            />
          </div>
        </div>
      )}
    </Drawer>

      <Modal
        title="Задать количество"
        open={customAmountOpen}
        onCancel={() => setCustomAmountOpen(false)}
        onOk={() => {
          const amount = Math.min(
            Math.max(customAmount || 1, 1),
            AUTOORDER_AMOUNT_MAX,
          );
          applyAmountToSelected(amount);
          setCustomAmountOpen(false);
        }}
        okText="Применить"
        destroyOnHidden
      >
        <Form layout="vertical">
          <Form.Item label="Количество КМ в день" required style={{ marginBottom: 0 }}>
            <InputNumber
              min={1}
              max={AUTOORDER_AMOUNT_MAX}
              value={customAmount}
              onChange={(value) => setCustomAmount(value ?? 1)}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
