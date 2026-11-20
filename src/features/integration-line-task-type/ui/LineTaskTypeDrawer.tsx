import {
  formatLineTaskType,
  useLineTaskTypesQuery,
  useSaveLineTaskTypesMutation,
  type LineTaskTypeRow,
} from '@/entities/integration';
import {
  DRAWER_FILLED_CONTENT_STYLE,
  DRAWER_FILLED_STYLES,
  drawerFilledTableStyles,
  useTableBodyScrollY,
} from '@/shared/ui/drawerFilledTable';
import { PageSpinner } from '@/shared/ui/loading';
import { App, Button, Drawer, Flex, Pagination, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useMemo, useState } from 'react';

/** Props for line task type configuration drawer. */
export interface LineTaskTypeDrawerProps {
  open: boolean;
  onClose: () => void;
}

const PAGE_SIZE = 20;

/**
 * Drawer for per-line KM task type configuration (Qt LineTaskTypeSettingsUi parity).
 */
export function LineTaskTypeDrawer({ open, onClose }: LineTaskTypeDrawerProps) {
  const { message } = App.useApp();
  const [rows, setRows] = useState<LineTaskTypeRow[]>([]);
  const [initialRows, setInitialRows] = useState<LineTaskTypeRow[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
  const [page, setPage] = useState(1);

  const linesQuery = useLineTaskTypesQuery({ enabled: open });

  useEffect(() => {
    if (!open || !linesQuery.isSuccess) {
      return;
    }
    setRows(linesQuery.data);
    setInitialRows(linesQuery.data);
    setSelectedKeys([]);
    setPage(1);
  }, [linesQuery.data, linesQuery.isSuccess, open]);

  const saveMutation = useSaveLineTaskTypesMutation({
    onSuccess: (count) => {
      message.success(`Типы заданий сохранены (${count} линий)`);
      onClose();
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const handleSave = useCallback(() => {
    const changed = rows.filter((row) => {
      const initial = initialRows.find((item) => item.lineid === row.lineid);
      return initial?.reserve_disabled !== row.reserve_disabled;
    });
    saveMutation.mutate(changed);
  }, [initialRows, rows, saveMutation]);

  const applyTaskType = useCallback(
    (reserveDisabled: boolean) => {
      setRows((prev) =>
        prev.map((row) =>
          selectedKeys.includes(row.lineid)
            ? { ...row, reserve_disabled: reserveDisabled }
            : row,
        ),
      );
    },
    [selectedKeys],
  );

  const columns = useMemo<ColumnsType<LineTaskTypeRow>>(
    () => [
      { title: 'Линия', dataIndex: 'linename', key: 'linename', ellipsis: true },
      {
        title: 'Тип КМ',
        dataIndex: 'reserve_disabled',
        key: 'reserve_disabled',
        width: 180,
        render: (value: boolean) => formatLineTaskType(value),
      },
    ],
    [],
  );

  const contentReady = open && !linesQuery.isLoading && linesQuery.isSuccess;
  const [tableHost, setTableHost] = useState<HTMLDivElement | null>(null);
  const tableHostRef = useCallback((node: HTMLDivElement | null) => {
    setTableHost(node);
  }, []);
  const tableScrollY = useTableBodyScrollY(tableHost, contentReady);

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
    <Drawer
      title="Групповая настройка типа задания по линиям"
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
            onClick={handleSave}
          >
            Сохранить
          </Button>
        </Space>
      }
    >
      {linesQuery.isLoading ? (
        <PageSpinner tip="Загрузка линий…" />
      ) : (
        <div style={DRAWER_FILLED_CONTENT_STYLE}>
          <Flex gap="1rem" wrap style={{ flexShrink: 0 }}>
            <Button
              disabled={selectedKeys.length === 0}
              onClick={() => applyTaskType(false)}
            >
              Собственные КМ
            </Button>
            <Button
              disabled={selectedKeys.length === 0}
              onClick={() => applyTaskType(true)}
            >
              Напечатанные КМ
            </Button>
          </Flex>
          <div ref={tableHostRef} className={drawerFilledTableStyles.tableHost}>
            <Table<LineTaskTypeRow>
              size="small"
              rowKey="lineid"
              rowSelection={{
                selectedRowKeys: selectedKeys,
                onChange: (keys) => setSelectedKeys(keys.map(Number)),
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
  );
}
