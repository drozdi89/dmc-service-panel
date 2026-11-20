import {
  fetchPrintTemplates,
  usePrintTemplateActions,
  printTemplateQueries,
  usePrintTemplateFormUiStore,
  type PrintTemplate,
} from '@/entities/print-template';
import { Template } from '@/shared/model/template';
import { ServerDataTable } from '@/shared/ui/ServerDataTable';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Space, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo } from 'react';

const TEMPLATE_PREVIEW_LENGTH = 80;

/** Truncates template body for table preview. */
function previewTemplate(text: string | null | undefined): string {
  if (!text) {
    return '—';
  }
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= TEMPLATE_PREVIEW_LENGTH) {
    return normalized;
  }
  return `${normalized.slice(0, TEMPLATE_PREVIEW_LENGTH)}…`;
}

/**
 * Print templates admin page with server-side list and CRUD via
 * {@link TemplateFormModalHost} / {@link usePrintTemplateFormUiStore}.
 */
export default function TemplatesPage() {
  const openCreate = usePrintTemplateFormUiStore((s) => s.openCreate);
  const openEdit = usePrintTemplateFormUiStore((s) => s.openEdit);

  const { deleteMutation, handleDelete } = usePrintTemplateActions();

  const columns = useMemo<ColumnsType<PrintTemplate>>(
    () => [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        width: 80,
        sorter: true,
      },
      {
        title: 'Название',
        dataIndex: 'name',
        key: 'name',
        sorter: true,
        ellipsis: true,
      },
      {
        title: 'Тело шаблона',
        dataIndex: 'template',
        key: 'template',
        sorter: true,
        ellipsis: true,
        render: (value: string | null | undefined) => previewTemplate(value),
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
              onClick={() => openEdit(record.id)}
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
    [deleteMutation.isPending, handleDelete, openEdit],
  );

  return (
    <>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Template.Title>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Шаблоны этикеток
          </Typography.Title>
        </Template.Title>
        
        <ServerDataTable<PrintTemplate>
          queryKey={printTemplateQueries.keys.all()}
          fetchFn={fetchPrintTemplates}
          columns={columns}
          rowKey="id"
          searchColumnKey="name"
          searchPlaceholder="Поиск по названию или телу шаблона…"
          scroll={{ x: 720 }}
          onCreate={openCreate}
        />
      </Space>
    </>
  );
}
