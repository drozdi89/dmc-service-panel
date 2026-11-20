import {
  fetchLinesList,
  useLineActions,
  lineQueries,
  useLineFormUiStore,
  type LineListItem,
} from '@/entities/line';
import { Template } from '@/shared/model/template';
import { ServerDataTable } from '@/shared/ui/ServerDataTable';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Space, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo } from 'react';

/**
 * Production lines list with server-side search, sort and delete.
 * Create/edit opens via {@link useLineFormUiStore} → {@link import('@/widgets/line').LineFormModalHost}.
 */
export default function LinesListPage() {
  const { deleteMutation, handleDelete } = useLineActions();
  const openCreate = useLineFormUiStore((s) => s.openCreate);
  const openEdit = useLineFormUiStore((s) => s.openEdit);

  const columns = useMemo<ColumnsType<LineListItem>>(
    () => [
      {
        title: 'Название',
        dataIndex: 'linename',
        key: 'linename',
        sorter: true,
        ellipsis: true,
      },
      {
        title: 'Тип',
        key: 'type',
        render: (_value, record) => {
          if (record.is_scale) {
            return 'Весовая станция';
          }
          if (record.is_manual) {
            return 'Ручная (ТСД)';
          }
          return 'Автоматизированная';
        },
      },
      {
        title: 'Код 1С',
        dataIndex: 'one_s_line_code',
        key: 'one_s_line_code',
        render: (value: string | null | undefined) => value || '—',
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
              aria-label={`Изменить ${record.linename}`}
              onClick={() => openEdit(record.lineid)}
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              aria-label={`Удалить ${record.linename}`}
              loading={deleteMutation.isPending}
              onClick={() => handleDelete(record)}
            />
          </Space>
        ),
      },
    ],
    [deleteMutation.isPending, handleDelete, openEdit],
  );

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <Template.Title>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Линии производства
        </Typography.Title>
      </Template.Title>

      <ServerDataTable<LineListItem>
        queryKey={lineQueries.keys.all()}
        fetchFn={fetchLinesList}
        columns={columns}
        rowKey="lineid"
        searchColumnKey="linename"
        searchPlaceholder="Поиск по названию…"
        onCreate={openCreate}
      />
    </Space>
  );
}
