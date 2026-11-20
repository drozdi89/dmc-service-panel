import {
  useCodeGeneratorTemplateActions,
  codeGeneratorTemplateQueries,
  fetchCodeGeneratorTemplates,
  useCodeGeneratorTemplateFormUiStore,
  type CodeGeneratorTemplate,
} from '@/entities/code-generator-template';
import { Template } from '@/shared/model/template';
import { ServerDataTable } from '@/shared/ui/ServerDataTable';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { App, Button, Space, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useMemo } from 'react';

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
 * Code generator templates admin page with server-side list and CRUD via
 * {@link CodeGeneratorTemplateFormModalHost} /
 * {@link useCodeGeneratorTemplateFormUiStore}.
 *
 * System templates keep edit/delete disabled (readonly).
 */
export default function CodeGeneratorTemplatesPage() {
  const { message } = App.useApp();
  const openCreate = useCodeGeneratorTemplateFormUiStore((s) => s.openCreate);
  const openEdit = useCodeGeneratorTemplateFormUiStore((s) => s.openEdit);

  const { deleteMutation, handleDelete } = useCodeGeneratorTemplateActions();

  const onEdit = useCallback(
    (record: CodeGeneratorTemplate) => {
      if (record.is_system) {
        message.warning('Системный шаблон нельзя изменить');
        return;
      }
      openEdit(record.id);
    },
    [message, openEdit],
  );

  const onDelete = useCallback(
    (record: CodeGeneratorTemplate) => {
      if (record.is_system) {
        message.warning('Системный шаблон нельзя удалить');
        return;
      }
      handleDelete(record);
    },
    [handleDelete, message],
  );

  const columns = useMemo<ColumnsType<CodeGeneratorTemplate>>(
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
        title: 'Описание',
        dataIndex: 'description',
        key: 'description',
        sorter: true,
        ellipsis: true,
        render: (value: string | null | undefined) => value?.trim() || '—',
      },
      {
        title: 'Тело шаблона',
        dataIndex: 'template',
        key: 'template',
        ellipsis: true,
        render: (value: string | null | undefined) => previewTemplate(value),
      },
      {
        title: 'Действия',
        key: 'actions',
        width: 90,
        fixed: 'end',
        render: (_value, record) => {
          const isSystem = Boolean(record.is_system);
          return (
            <Space size="small">
              <Tooltip
                title={isSystem ? 'Системный шаблон нельзя изменить' : undefined}
              >
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  aria-label={`Изменить ${record.name}`}
                  disabled={isSystem}
                  onClick={() => onEdit(record)}
                />
              </Tooltip>
              <Tooltip
                title={isSystem ? 'Системный шаблон нельзя удалить' : undefined}
              >
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  aria-label={`Удалить ${record.name}`}
                  disabled={isSystem}
                  loading={deleteMutation.isPending}
                  onClick={() => onDelete(record)}
                />
              </Tooltip>
            </Space>
          );
        },
      },
    ],
    [deleteMutation.isPending, onDelete, onEdit],
  );

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Template.Title>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Генераторы кодов
        </Typography.Title>
      </Template.Title>

      <ServerDataTable<CodeGeneratorTemplate>
        queryKey={codeGeneratorTemplateQueries.keys.all()}
        fetchFn={fetchCodeGeneratorTemplates}
        columns={columns}
        rowKey="id"
        searchColumnKey="name"
        searchPlaceholder="Поиск по названию или описанию…"
        scroll={{ x: 800 }}
        onCreate={openCreate}
      />
    </Space>
  );
}
