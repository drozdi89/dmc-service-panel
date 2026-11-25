import {
  CRPT_TEMPLATES_QUERY_KEY,
  formatCrptTemplateIdx,
  useCrptTemplatesSaveFeedback,
} from '@/entities/integration';
import type { Product } from '@/entities/product';
import {
  useIntegrationProductsQuery,
  useSaveProductCrptTemplatesMutation,
} from '@/services/integration-service';
import {
  DRAWER_FILLED_CONTENT_STYLE,
  DRAWER_FILLED_STYLES,
  drawerFilledTableStyles,
  useTableBodyScrollY,
} from '@/shared/ui/drawerFilledTable';
import { PageSpinner } from '@/shared/ui/loading';
import { Button, Drawer, Flex, Pagination, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useMemo, useState } from 'react';

/** Editable product template row. */
type CrptTemplateRow = Pick<Product, 'gtin' | 'name' | 'crpt_template_idx'>;

/** Props for CRPT KM templates drawer. */
export interface CrptTemplatesDrawerProps {
  open: boolean;
  onClose: () => void;
}

const PAGE_SIZE = 20;

/**
 * Drawer for per-product CRPT KM template index configuration.
 */
export function CrptTemplatesDrawer({ open, onClose }: CrptTemplatesDrawerProps) {
  const [rows, setRows] = useState<CrptTemplateRow[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [initialRows, setInitialRows] = useState<CrptTemplateRow[]>([]);
  const [page, setPage] = useState(1);

  const productsQuery = useIntegrationProductsQuery(CRPT_TEMPLATES_QUERY_KEY, open);

  useEffect(() => {
    if (!open || !productsQuery.isSuccess) {
      return;
    }
    const mapped = productsQuery.data.map(({ gtin, name, crpt_template_idx }) => ({
      gtin,
      name,
      crpt_template_idx: crpt_template_idx ?? 0,
    }));
    setRows(mapped);
    setInitialRows(mapped);
    setSelectedKeys([]);
    setPage(1);
  }, [open, productsQuery.data, productsQuery.isSuccess]);

  const saveFeedback = useCrptTemplatesSaveFeedback({ onDone: onClose });
  const saveMutation = useSaveProductCrptTemplatesMutation(saveFeedback);

  const handleSave = useCallback(() => {
    const changed = rows.filter((row) => {
      const initial = initialRows.find((item) => item.gtin === row.gtin);
      return initial?.crpt_template_idx !== row.crpt_template_idx;
    });
    saveMutation.mutate(
      changed.map(({ gtin, crpt_template_idx }) => ({
        gtin,
        crpt_template_idx: crpt_template_idx ?? 0,
      })),
    );
  }, [initialRows, rows, saveMutation]);

  const applyTemplateIdx = useCallback(
    (idx: number) => {
      setRows((prev) =>
        prev.map((row) =>
          selectedKeys.includes(row.gtin) ? { ...row, crpt_template_idx: idx } : row,
        ),
      );
    },
    [selectedKeys],
  );

  const columns = useMemo<ColumnsType<CrptTemplateRow>>(
    () => [
      { title: 'Продукт', dataIndex: 'name', key: 'name', ellipsis: true },
      { title: 'GTIN', dataIndex: 'gtin', key: 'gtin', width: 140 },
      {
        title: 'Формат шаблона',
        dataIndex: 'crpt_template_idx',
        key: 'crpt_template_idx',
        width: 160,
        render: (value: number) => formatCrptTemplateIdx(value),
      },
    ],
    [],
  );

  const contentReady = open && !productsQuery.isLoading && productsQuery.isSuccess;
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
      title="Групповая корректировка шаблона КМ"
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
      {productsQuery.isLoading ? (
        <PageSpinner tip="Загрузка продукции…" />
      ) : (
        <div style={DRAWER_FILLED_CONTENT_STYLE}>
          <Flex gap="1rem" wrap style={{ flexShrink: 0 }}>
            <Button
              disabled={selectedKeys.length === 0}
              onClick={() => applyTemplateIdx(0)}
            >
              Длинный шаблон
            </Button>
            <Button
              disabled={selectedKeys.length === 0}
              onClick={() => applyTemplateIdx(1)}
            >
              Короткий шаблон
            </Button>
          </Flex>
          <div ref={tableHostRef} className={drawerFilledTableStyles.tableHost}>
            <Table<CrptTemplateRow>
              size="small"
              rowKey="gtin"
              rowSelection={{
                selectedRowKeys: selectedKeys,
                onChange: (keys) => setSelectedKeys(keys.map(String)),
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
