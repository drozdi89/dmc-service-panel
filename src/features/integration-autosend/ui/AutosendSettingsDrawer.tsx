import {
  AUTOSEND_PRODUCTS_QUERY_KEY,
  AUTOSEND_QUERY_KEY,
  saveAutosendSettings,
  useAutosendSettingsQuery,
  type AutosendProductSettings,
  type AutosendSettingsPayload,
  type TaskerSchedule,
} from '@/entities/integration';
import { fetchIntegrationProducts } from '@/services/integration-service';
import { ApiError } from '@/shared/api';
import { createIdempotencyKey } from '@/shared/api/headers';
import {
  DRAWER_FILLED_CONTENT_STYLE,
  DRAWER_FILLED_STYLES,
  drawerFilledTableStyles,
  useTableBodyScrollY,
} from '@/shared/ui/drawerFilledTable';
import { PageSpinner } from '@/shared/ui/loading';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  App,
  Button,
  Checkbox,
  Drawer,
  Flex,
  Pagination,
  Space,
  Table,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AutosendFlagsModal, type AutosendFlagsFormValues } from './AutosendFlagsModal';
import { AutosendScheduleModal } from './AutosendScheduleModal';

/** Product row with display name for autosend table. */
interface AutosendTableRow extends AutosendProductSettings {
  key: string;
  name: string;
}

/** Props for autosend settings drawer. */
export interface AutosendSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Drawer for autosend document settings (Qt AutosendSettings parity).
 */
export function AutosendSettingsDrawer({ open, onClose }: AutosendSettingsDrawerProps) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [includePrinted, setIncludePrinted] = useState(false);
  const [schedule, setSchedule] = useState<TaskerSchedule>({
    enabled: false,
    code_delay: 0,
    schedule: [],
    repeat_interval: '00:00:00',
    send_mode: 'unit_codes',
  });
  const [rows, setRows] = useState<AutosendTableRow[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [flagsModalOpen, setFlagsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const settingsQuery = useAutosendSettingsQuery({ enabled: open });

  const productsQuery = useQuery({
    queryKey: AUTOSEND_PRODUCTS_QUERY_KEY,
    queryFn: fetchIntegrationProducts,
    enabled: open,
  });

  useEffect(() => {
    if (!open || !settingsQuery.isSuccess || !productsQuery.isSuccess) {
      return;
    }
    const data = settingsQuery.data;
    const nameByGtin = new Map(productsQuery.data.map((p) => [p.gtin, p.name]));
    const flagsByGtin = new Map((data.products ?? []).map((p) => [p.gtin, p]));

    setIncludePrinted(data.include_printed_codes ?? false);
    setSchedule({
      enabled: data.schedule?.enabled ?? false,
      code_delay: data.schedule?.code_delay ?? 0,
      schedule: data.schedule?.schedule ?? [],
      repeat_interval: data.schedule?.repeat_interval ?? '00:00:00',
      send_mode: data.schedule?.send_mode ?? 'unit_codes',
    });

    const mergedRows = (data.products ?? []).map((product) => ({
      ...product,
      key: product.gtin,
      name: nameByGtin.get(product.gtin) ?? product.gtin,
    }));

    for (const product of productsQuery.data) {
      if (!flagsByGtin.has(product.gtin)) {
        mergedRows.push({
          gtin: product.gtin,
          name: product.name,
          key: product.gtin,
          auto_apply: false,
          auto_introduce: false,
          skip_serialization: false,
          auto_send_aggregate: false,
        });
      }
    }

    setRows(mergedRows);
    setSelectedKeys([]);
    setScheduleModalOpen(false);
    setFlagsModalOpen(false);
    setPage(1);
  }, [open, productsQuery.data, productsQuery.isSuccess, settingsQuery.data, settingsQuery.isSuccess]);

  const saveMutation = useMutation({
    mutationFn: (payload: AutosendSettingsPayload) =>
      saveAutosendSettings(payload, createIdempotencyKey()),
    onSuccess: () => {
      message.success('Настройки автоотправки сохранены');
      void queryClient.invalidateQueries({ queryKey: AUTOSEND_QUERY_KEY });
      onClose();
    },
    onError: (error: Error) => {
      message.error(error instanceof ApiError ? error.message : error.message);
    },
  });

  const scheduleEnabled = Boolean(schedule.enabled);

  const applyFlags = useCallback(
    (
      flags: Partial<
        Pick<
          AutosendProductSettings,
          'auto_apply' | 'auto_introduce' | 'skip_serialization' | 'auto_send_aggregate'
        >
      >,
    ) => {
      if (!scheduleEnabled) {
        return;
      }
      setRows((prev) =>
        prev.map((row) =>
          selectedKeys.includes(row.key) ? { ...row, ...flags } : row,
        ),
      );
    },
    [scheduleEnabled, selectedKeys],
  );

  const handleSave = useCallback(() => {
    saveMutation.mutate({
      products: rows.map(
        ({ gtin, auto_apply, auto_introduce, skip_serialization, auto_send_aggregate }) => ({
          gtin,
          auto_apply,
          auto_introduce,
          skip_serialization,
          auto_send_aggregate,
        }),
      ),
      schedule,
      include_printed_codes: includePrinted,
    });
  }, [includePrinted, rows, saveMutation, schedule]);

  const setRowFlag = useCallback(
    (
      key: string,
      field: 'auto_apply' | 'auto_introduce' | 'auto_send_aggregate' | 'skip_serialization',
      checked: boolean,
    ) => {
      if (!scheduleEnabled) {
        return;
      }
      setRows((prev) =>
        prev.map((row) => (row.key === key ? { ...row, [field]: checked } : row)),
      );
    },
    [scheduleEnabled],
  );

  const columns = useMemo<ColumnsType<AutosendTableRow>>(
    () => [
      { title: 'Продукт', dataIndex: 'name', key: 'name', ellipsis: true },
      { title: 'GTIN', dataIndex: 'gtin', key: 'gtin', width: 140 },
      {
        title: 'Нанесение',
        dataIndex: 'auto_apply',
        key: 'auto_apply',
        width: 120,
        align: 'center',
        render: (value: boolean, record) => (
          <Checkbox
            checked={value}
            disabled={!scheduleEnabled}
            onChange={(event) => setRowFlag(record.key, 'auto_apply', event.target.checked)}
          />
        ),
      },
      {
        title: 'Ввод в оборот',
        dataIndex: 'auto_introduce',
        key: 'auto_introduce',
        width: 120,
        align: 'center',
        render: (value: boolean, record) => (
          <Checkbox
            checked={value}
            disabled={!scheduleEnabled}
            onChange={(event) =>
              setRowFlag(record.key, 'auto_introduce', event.target.checked)
            }
          />
        ),
      },
      {
        title: 'Агрегация',
        dataIndex: 'auto_send_aggregate',
        key: 'auto_send_aggregate',
        width: 120,
        align: 'center',
        render: (value: boolean, record) => (
          <Checkbox
            checked={value}
            disabled={!scheduleEnabled}
            onChange={(event) =>
              setRowFlag(record.key, 'auto_send_aggregate', event.target.checked)
            }
          />
        ),
      },
      {
        title: 'Пропуск сериализации',
        dataIndex: 'skip_serialization',
        key: 'skip_serialization',
        width: 120,
        align: 'center',
        render: (value: boolean, record) => (
          <Checkbox
            checked={value}
            disabled={!scheduleEnabled}
            onChange={(event) =>
              setRowFlag(record.key, 'skip_serialization', event.target.checked)
            }
          />
        ),
      },
    ],
    [scheduleEnabled, setRowFlag],
  );

  const flagsModalInitial = useMemo<AutosendFlagsFormValues>(() => {
    const selected = rows.filter((row) => selectedKeys.includes(row.key));
    return {
      auto_apply: selected.some((row) => row.auto_apply),
      auto_introduce: selected.some((row) => row.auto_introduce),
      auto_send_aggregate: selected.some((row) => row.auto_send_aggregate),
      skip_serialization: selected.some((row) => row.skip_serialization),
    };
  }, [rows, selectedKeys]);

  const loading = settingsQuery.isLoading || productsQuery.isLoading;
  const loadError = settingsQuery.isError || productsQuery.isError;
  const dataReady = settingsQuery.isSuccess && productsQuery.isSuccess;
  const saveDisabled = loading || loadError || !dataReady;
  const bulkDisabled = !scheduleEnabled || selectedKeys.length === 0;
  const contentReady = open && !loading && !loadError && dataReady;

  const [tableHost, setTableHost] = useState<HTMLDivElement | null>(null);
  const tableHostRef = useCallback((node: HTMLDivElement | null) => {
    setTableHost(node);
  }, []);
  const tableScrollY = useTableBodyScrollY(tableHost, contentReady, scheduleEnabled);

  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [page, pageSize, rows]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(rows.length / pageSize) || 1);
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [page, pageSize, rows.length]);

  return (
    <>
      <Drawer
        title="Настройка автоотправки документов"
        open={open}
        onClose={onClose}
        destroyOnHidden
        size={1024}
        styles={DRAWER_FILLED_STYLES}
        extra={
          <Space>
            <Button onClick={onClose}>Отмена</Button>
            <Button
              type="primary"
              loading={saveMutation.isPending}
              disabled={saveDisabled}
              onClick={handleSave}
            >
              Сохранить
            </Button>
          </Space>
        }
      >
        {loading ? (
          <PageSpinner tip="Загрузка настроек автоотправки…" />
        ) : loadError ? (
          <Alert
            type="error"
            showIcon
            message="Не удалось загрузить настройки автоотправки"
            description="Сохранение недоступно. Закройте окно и попробуйте снова."
          />
        ) : (
          <div style={DRAWER_FILLED_CONTENT_STYLE}>
            {!scheduleEnabled ? (
              <Alert
                type="warning"
                showIcon
                message="Расписание выполнения не настроено!"
                style={{ flexShrink: 0 }}
              />
            ) : null}
            <Flex gap="1rem" wrap justify="space-between" style={{ flexShrink: 0 }}>
              <Button onClick={() => setScheduleModalOpen(true)}>Расписание…</Button>
              <Space>
                <Button
                  disabled={bulkDisabled}
                  onClick={() =>
                    applyFlags({
                      auto_apply: true,
                      auto_introduce: true,
                      skip_serialization: true,
                      auto_send_aggregate: true,
                    })
                  }
                >
                  Включить всё
                </Button>
                <Button
                  disabled={bulkDisabled}
                  onClick={() =>
                    applyFlags({
                      auto_apply: false,
                      auto_introduce: false,
                      skip_serialization: false,
                      auto_send_aggregate: false,
                    })
                  }
                >
                  Отключить всё
                </Button>
                <Button disabled={bulkDisabled} onClick={() => setFlagsModalOpen(true)}>
                  Задать…
                </Button>
              </Space>
            </Flex>
            <Checkbox
              disabled={!scheduleEnabled}
              checked={includePrinted}
              onChange={(event) => setIncludePrinted(event.target.checked)}
              style={{ flexShrink: 0 }}
            >
              Передавать напечатанные коды при отправке задания
            </Checkbox>
            <div ref={tableHostRef} className={drawerFilledTableStyles.tableHost}>
              <Table<AutosendTableRow>
                size="small"
                rowSelection={{
                  selectedRowKeys: selectedKeys,
                  onChange: (keys) => setSelectedKeys(keys.map(String)),
                  getCheckboxProps: () => ({ disabled: !scheduleEnabled }),
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
                pageSize={pageSize}
                total={rows.length}
                showSizeChanger={false}
                onChange={setPage}
              />
            </div>
          </div>
        )}
      </Drawer>

      <AutosendScheduleModal
        open={scheduleModalOpen}
        value={schedule}
        onCancel={() => setScheduleModalOpen(false)}
        onOk={(next) => {
          setSchedule(next);
          setScheduleModalOpen(false);
        }}
      />
      <AutosendFlagsModal
        open={flagsModalOpen}
        initialValues={flagsModalInitial}
        onCancel={() => setFlagsModalOpen(false)}
        onOk={(flags) => {
          applyFlags(flags);
          setFlagsModalOpen(false);
        }}
      />
    </>
  );
}
