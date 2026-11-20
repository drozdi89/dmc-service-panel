import { useDevicesLookupQuery } from '@/entities/device';
import {
  buildLinkedResourceNameMap,
  fetchPrintStations,
  formatLinkedResourceId,
  printStationMutations,
  printStationQueries,
  usePrintStationFormUiStore,
  type PrintStation,
} from '@/entities/print-station';
import { printTemplateQueries } from '@/entities/print-template';
import { Template } from '@/shared/model';
import type { ListQueryParams } from '@/shared/types/listQuery';
import { ServerDataTable } from '@/shared/ui/ServerDataTable';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Space, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useMemo } from 'react';

/** Lookup page: API max size is 200 (`MAX_LIST_SIZE`). */
const LINKED_LOOKUP_PARAMS = { number: 0, size: 200 } as const;

/**
 * Admin page for print stations with server-side list and CRUD via
 * {@link PrintStationFormModalHost} / {@link usePrintStationFormUiStore}.
 *
 * Camera / printer / template columns show resource names (from lookup),
 * not raw ids — parity with desktop stations list.
 */
export default function PrintStationsPage() {
  const openCreate = usePrintStationFormUiStore((s) => s.openCreate);
  const openEdit = usePrintStationFormUiStore((s) => s.openEdit);

  const { deleteMutation, handleDelete } = printStationMutations();

  const printersLookup = useDevicesLookupQuery({
    ...LINKED_LOOKUP_PARAMS,
    types: ['printer'],
  });
  const camerasLookup = useDevicesLookupQuery({
    ...LINKED_LOOKUP_PARAMS,
    types: ['camera'],
  });
  const templatesLookup = printTemplateQueries.useLookupQuery(
    LINKED_LOOKUP_PARAMS,
  );

  const printerNames = useMemo(
    () => buildLinkedResourceNameMap(printersLookup.data?.response),
    [printersLookup.data?.response],
  );
  const cameraNames = useMemo(
    () => buildLinkedResourceNameMap(camerasLookup.data?.response),
    [camerasLookup.data?.response],
  );
  const templateNames = useMemo(
    () => buildLinkedResourceNameMap(templatesLookup.data?.response),
    [templatesLookup.data?.response],
  );

  const fetchFn = useCallback(
    (params: ListQueryParams) => fetchPrintStations(params),
    [],
  );

  const columns = useMemo<ColumnsType<PrintStation>>(
    () => [
      {
        title: 'Наименование',
        dataIndex: 'name',
        key: 'name',
        sorter: true,
        ellipsis: true,
      },
      {
        title: 'Камера',
        dataIndex: 'camera',
        key: 'camera',
        ellipsis: true,
        render: (value: number | null) =>
          formatLinkedResourceId(value, cameraNames),
      },
      {
        title: 'Принтер',
        dataIndex: 'printer',
        key: 'printer',
        ellipsis: true,
        render: (value: number | null) =>
          formatLinkedResourceId(value, printerNames),
      },
      {
        title: 'Шаблон',
        dataIndex: 'template_id',
        key: 'template_id',
        ellipsis: true,
        render: (value: number | null) =>
          formatLinkedResourceId(value, templateNames),
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
              onClick={() => openEdit(record.station_id)}
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
    [
      cameraNames,
      deleteMutation.isPending,
      handleDelete,
      openEdit,
      printerNames,
      templateNames,
    ],
  );

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Template.Title>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Станции печати
        </Typography.Title>
      </Template.Title>

      <ServerDataTable<PrintStation>
        queryKey={printStationQueries.keys.all()}
        fetchFn={fetchFn}
        columns={columns}
        rowKey="station_id"
        searchColumnKey="name"
        searchPlaceholder="Поиск по наименованию…"
        scroll={{ x: 720 }}
        onCreate={openCreate}
      />
    </Space>
  );
}
