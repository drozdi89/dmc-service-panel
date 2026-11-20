import {
  ALL_DEVICE_TYPES,
  DEVICE_TYPE_LABELS,
  useDeviceActions,
  deviceQueries,
  deviceRowKey,
  fetchDevicesList,
  formatDeviceAddress,
  useDeviceFormUiStore,
  type DeviceListItem,
  type DeviceType,
} from '@/entities/device';
import { Template } from '@/shared/model/template';
import { DebouncedTableFilterDropdown } from '@/shared/ui/DebouncedTableFilterDropdown';
import { ServerDataTable } from '@/shared/ui/ServerDataTable';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Space, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { FilterValue } from 'antd/es/table/interface';
import { useCallback, useMemo, useState } from 'react';

/**
 * Admin page for unified device list with column filters on «Вид»
 * and per-type CRUD via {@link DeviceFormModalHost} / {@link useDeviceFormUiStore}.
 */
export default function DevicesPage() {
  const [selectedTypes, setSelectedTypes] = useState<DeviceType[] | null>(null);
  const openCreate = useDeviceFormUiStore((s) => s.openCreate);
  const openEdit = useDeviceFormUiStore((s) => s.openEdit);

  const { deleteMutation, handleDelete } = useDeviceActions();

  const listExtraParams = useMemo(
    () => ({
      types: selectedTypes?.length ? selectedTypes : undefined,
    }),
    [selectedTypes],
  );

  const handleFiltersChange = useCallback(
    (filters: Record<string, FilterValue | null>) => {
      const values = filters.device_type;
      if (!values?.length) {
        setSelectedTypes(null);
        return;
      }
      setSelectedTypes(
        values.filter((v): v is DeviceType =>
          ALL_DEVICE_TYPES.includes(v as DeviceType),
        ),
      );
    },
    [],
  );

  const columns = useMemo<ColumnsType<DeviceListItem>>(
    () => [
      {
        title: 'Название',
        dataIndex: 'name',
        key: 'name',
        sorter: true,
      },
      {
        title: 'Вид',
        dataIndex: 'device_type',
        key: 'device_type',
        filters: ALL_DEVICE_TYPES.map((type) => ({
          text: DEVICE_TYPE_LABELS[type],
          value: type,
        })),
        filteredValue: selectedTypes,
        filterMultiple: true,
        filterDropdown: (props) => <DebouncedTableFilterDropdown {...props} />,
        render: (value: DeviceType) => DEVICE_TYPE_LABELS[value],
      },
      {
        title: 'Адрес',
        key: 'address',
        render: (_value, record) => formatDeviceAddress(record),
      },
      {
        title: 'Действия',
        key: 'actions',
        width: 90,
        fixed: 'end',
        render: (_value, record) => (
          <Space size="small">
            <Button
              type="text"
              icon={<EditOutlined />}
              aria-label={`Изменить ${record.name}`}
              onClick={() =>
                openEdit(record.id, {
                  deviceType: record.device_type,
                  lockDeviceType: true,
                })
              }
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              aria-label={`Удалить ${record.name}`}
              loading={deleteMutation.isPending}
              onClick={() => handleDelete(record)}
            />
          </Space>
        ),
      },
    ],
    [deleteMutation.isPending, handleDelete, openEdit, selectedTypes],
  );

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <Template.Title>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Устройства
        </Typography.Title>
      </Template.Title>

      <ServerDataTable<DeviceListItem>
        queryKey={deviceQueries.keys.all()}
        fetchFn={fetchDevicesList}
        columns={columns}
        rowKey={deviceRowKey}
        searchColumnKey="name"
        searchPlaceholder="Поиск по названию или адресу…"
        extraParams={listExtraParams}
        scroll={{ x: 760 }}
        onCreate={openCreate}
        onFiltersChange={handleFiltersChange}
      />
    </Space>
  );
}
