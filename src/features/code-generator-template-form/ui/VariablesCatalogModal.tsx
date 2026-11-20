import {
  fetchCodeGeneratorTemplateVariables,
  type CodeGeneratorTemplateVariable,
  type CodeGeneratorVariableGroup,
} from '@/entities/code-generator-template';
import { LoadingOverlay } from '@/shared/ui/loading';
import { useQuery } from '@tanstack/react-query';
import { Alert, Modal, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo } from 'react';

/** Stable query key for the variables catalog. */
export const CODE_GENERATOR_TEMPLATE_VARIABLES_QUERY_KEY = [
  'code-generator-templates',
  'variables',
] as const;

const GROUP_ORDER: CodeGeneratorVariableGroup[] = [
  'task',
  'product',
  'dates',
  'weight',
  'special',
];

const GROUP_LABELS: Record<CodeGeneratorVariableGroup, string> = {
  task: 'task',
  product: 'product',
  dates: 'dates',
  weight: 'weight',
  special: 'special',
};

/** Props for variables catalog modal. */
export interface VariablesCatalogModalProps {
  open: boolean;
  onCancel: () => void;
  /** Called with placeholder name (without braces); parent inserts `{name}`. */
  onInsert: (variableName: string) => void;
}

/**
 * Catalog of allowed template placeholders (`GET …/variables`).
 *
 * Double-click a row to insert `{name}` into the template (Desktop behaviour).
 */
export function VariablesCatalogModal({
  open,
  onCancel,
  onInsert,
}: VariablesCatalogModalProps) {
  const {
    data = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: CODE_GENERATOR_TEMPLATE_VARIABLES_QUERY_KEY,
    queryFn: ({ signal }) => fetchCodeGeneratorTemplateVariables(signal),
    enabled: open,
    staleTime: 5 * 60_000,
  });

  const sorted = useMemo(() => {
    const order = new Map(GROUP_ORDER.map((group, index) => [group, index]));
    return [...data].sort((a, b) => {
      const groupDiff =
        (order.get(a.group) ?? GROUP_ORDER.length) -
        (order.get(b.group) ?? GROUP_ORDER.length);
      if (groupDiff !== 0) {
        return groupDiff;
      }
      return a.name.localeCompare(b.name);
    });
  }, [data]);

  const columns: ColumnsType<CodeGeneratorTemplateVariable> = [
    {
      title: 'Имя',
      dataIndex: 'name',
      key: 'name',
      width: 140,
      render: (name: string) => <Typography.Text code>{name}</Typography.Text>,
    },
    {
      title: 'Группа',
      dataIndex: 'group',
      key: 'group',
      width: 100,
      render: (group: CodeGeneratorVariableGroup) =>
        GROUP_LABELS[group] ?? group,
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Пример',
      dataIndex: 'example',
      key: 'example',
      width: 120,
      ellipsis: true,
    },
  ];

  return (
    <Modal
      open={open}
      title="Справочник переменных"
      width={720}
      onCancel={onCancel}
      footer={null}
      style={{ top: '1rem' }}
      styles={{
        body: {
          maxHeight: 'calc(100vh - 7rem)',
          overflowY: 'auto',
        },
      }}
    >
      {/**
       * TODO: close modal
       */}
      <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
        Двойной щелчок по строке вставляет имя в шаблон кода.
      </Typography.Paragraph>
      <LoadingOverlay loading={isLoading}>
        {isError ? (
          <Alert
            type="error"
            showIcon
            message="Не удалось загрузить справочник переменных"
            description={error instanceof Error ? error.message : undefined}
          />
        ) : (
          <Table<CodeGeneratorTemplateVariable>
            size="small"
            rowKey="name"
            columns={columns}
            dataSource={sorted}
            pagination={false}
            sticky={{ offsetHeader: 0 }}
            onRow={(record) => ({
              onDoubleClick: () => {
                onInsert(record.name);
              },
              style: { cursor: 'pointer' },
            })}
          />
        )}
      </LoadingOverlay>
    </Modal>
  );
}
