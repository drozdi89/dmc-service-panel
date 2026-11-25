import {
  PRODUCT_QUERY_ENTRY,
  fetchProductsList,
  useProductFormUiStore,
  useProductGroupsQuery,
  useSetProductArchivedActions,
  type Product,
  type ProductsListParams,
} from '@/entities/product';
import { Template } from '@/shared/model';
import type { ListQueryParams } from '@/shared/types/listQuery';
import { DebouncedTableFilterDropdown } from '@/shared/ui/DebouncedTableFilterDropdown';
import { ServerDataTable } from '@/shared/ui/ServerDataTable';
import { ButtonLoading } from '@/shared/ui/loading';
import { EditOutlined, InboxOutlined, RollbackOutlined } from '@ant-design/icons';
import { Button, Space, Switch, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { FilterDropdownProps, FilterValue } from 'antd/es/table/interface';
import { useCallback, useMemo, useState } from 'react';

/** Marker value for «show archived» column filter. */
const ARCHIVED_FILTER_KEY = 'archived';

/**
 * Status column filter: single Switch (archived yes/no), not two checkboxes.
 */
function ArchivedSwitchFilterDropdown({
  selectedKeys,
  setSelectedKeys,
  confirm,
  clearFilters,
}: FilterDropdownProps) {
  const checked = selectedKeys.some((key) => String(key) === ARCHIVED_FILTER_KEY);

  return (
    <div style={{ padding: 8 }}>
      <Space>
        <Typography.Text>Архивные</Typography.Text>
        <Switch
          checked={checked}
          onChange={(next) => {
            if (next) {
              setSelectedKeys([ARCHIVED_FILTER_KEY]);
              confirm({ closeDropdown: false });
              return;
            }
            clearFilters?.({ confirm: true, closeDropdown: false });
          }}
        />
      </Space>
    </div>
  );
}

/**
 * Admin page for products list and archive/restore.
 * Create/edit opens via {@link useProductFormUiStore} → {@link import('@/widgets/product').ProductFormModalHost}.
 */
export default function ProductsPage() {
  const [showArchived, setShowArchived] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[] | null>(null);
  const openCreate = useProductFormUiStore((s) => s.openCreate);
  const openEdit = useProductFormUiStore((s) => s.openEdit);

  const { data: productGroups = [] } = useProductGroupsQuery();

  const { confirmToggleArchived, isPending: isArchivePending } =
    useSetProductArchivedActions();

  const extraParams = useMemo(
    () => ({
      archived: showArchived,
      product_groups: selectedGroups?.length ? selectedGroups : undefined,
    }),
    [showArchived, selectedGroups],
  );

  const fetchFn = useCallback(
    (params: ListQueryParams) => fetchProductsList(params as ProductsListParams),
    [],
  );

  const handleFiltersChange = useCallback(
    (filters: Record<string, FilterValue | null>) => {
      if (Object.prototype.hasOwnProperty.call(filters, 'pg')) {
        const values = filters.pg;
        if (!values?.length) {
          setSelectedGroups(null);
        } else {
          const allowed = new Set(productGroups.map((group) => group.name));
          setSelectedGroups(
            values.filter((value): value is string =>
              typeof value === 'string' && allowed.has(value),
            ),
          );
        }
      }

      if (Object.prototype.hasOwnProperty.call(filters, 'archived')) {
        const values = filters.archived;
        setShowArchived(
          Boolean(
            values?.some((value) => String(value) === ARCHIVED_FILTER_KEY),
          ),
        );
      }
    },
    [productGroups],
  );

  const columns = useMemo<ColumnsType<Product>>(
    () => [
      {
        title: 'GTIN',
        dataIndex: 'gtin',
        key: 'gtin',
        sorter: true,
      },
      {
        title: 'Наименование',
        dataIndex: 'name',
        key: 'name',
        sorter: true,
        ellipsis: true,
      },
      {
        title: 'Код ТНВЭД',
        dataIndex: 'tnved',
        key: 'tnved',
      },
      {
        title: 'Товарная группа',
        dataIndex: 'pg',
        key: 'pg',
        sorter: true,
        filters: productGroups.map((group) => ({
          text: group.description || group.name,
          value: group.name,
        })),
        filteredValue: selectedGroups,
        filterMultiple: true,
        filterDropdown: (props) => <DebouncedTableFilterDropdown {...props} />,
        render: (value: string | null | undefined) => {
          if (!value) {
            return '—';
          }
          const group = productGroups.find((item) => item.name === value);
          return group?.description ?? value;
        },
      },
      {
        title: 'Статус',
        dataIndex: 'archived',
        key: 'archived',
        filteredValue: showArchived ? [ARCHIVED_FILTER_KEY] : null,
        filterDropdown: (props) => <ArchivedSwitchFilterDropdown {...props} />,
        render: (archived: boolean | null | undefined) =>
          archived ? <Tag color="default">Архив</Tag> : <Tag color="green">Активен</Tag>,
      },
      {
        title: 'Действия',
        key: 'actions',
        width: 90,
        fixed: 'end',
        render: (_, record) => {
          const archiveLabel = record.archived ? 'Восстановить' : 'Архивировать';
          const archiveAriaLabel = record.archived
            ? `Восстановить ${record.name}`
            : `Архивировать ${record.name}`;

          return (
            <Space size="small">
              <Tooltip title="Изменить">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  aria-label={`Изменить ${record.name}`}
                  onClick={() => openEdit(record.gtin)}
                />
              </Tooltip>
              <Tooltip title={archiveLabel}>
                <ButtonLoading
                  type="text"
                  icon={record.archived ? <RollbackOutlined /> : <InboxOutlined />}
                  aria-label={archiveAriaLabel}
                  loading={isArchivePending}
                  onClick={() => confirmToggleArchived(record)}
                />
              </Tooltip>
            </Space>
          );
        },
      },
    ],
    [
      isArchivePending,
      confirmToggleArchived,
      openEdit,
      productGroups,
      selectedGroups,
      showArchived,
    ],
  );

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <Template.Title>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Продукция
        </Typography.Title>
      </Template.Title>

      <ServerDataTable<Product>
        queryKey={PRODUCT_QUERY_ENTRY}
        fetchFn={fetchFn}
        columns={columns}
        rowKey="gtin"
        searchColumnKey={['gtin', 'name']}
        searchPlaceholder="Поиск по GTIN или названию…"
        extraParams={extraParams}
        scroll={{ x: 960 }}
        onCreate={openCreate}
        onFiltersChange={handleFiltersChange}
      />
    </Space>
  );
}
