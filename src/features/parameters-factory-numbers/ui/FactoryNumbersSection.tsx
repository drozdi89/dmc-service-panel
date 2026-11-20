import {
  FACTORY_NUMBERS_QUERY_KEY,
  factoryNumbersMutations,
  fetchFactoryNumbers,
  type FactoryNumberRow,
} from '@/entities/parameters';
import type { ListQueryParams } from '@/shared/types/listQuery';
import { ServerDataTable } from '@/shared/ui/ServerDataTable';
import { ButtonLoading } from '@/shared/ui/loading';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Checkbox, Form, Input, Modal, Popconfirm, Space, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useMemo, useState } from 'react';

/**
 * Factory numbers CRUD table with server-side search, sort, and pagination.
 */
export function FactoryNumbersSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<FactoryNumberRow | null>(null);
  const [form] = Form.useForm<FactoryNumberRow>();

  const fetchFn = useCallback(
    (params: ListQueryParams) => fetchFactoryNumbers(params),
    [],
  );

  const showSaveError = (error: Error) => message.error(error.message || 'Ошибка сохранения');

  const createMutation = factoryNumbersMutations.useCreateMutation({
    onSuccess: () => {
      message.success('Заводской номер добавлен');
      setModalOpen(false);
    },
    onError: showSaveError,
  });

  const updateMutation = factoryNumbersMutations.useUpdateMutation({
    onSuccess: () => {
      message.success('Заводской номер обновлён');
      setModalOpen(false);
    },
    onError: showSaveError,
  });

  const deleteMutation = factoryNumbersMutations.useDeleteMutation({
    onSuccess: () => {
      message.success('Заводской номер удалён');
    },
    onError: (error) => {
      message.error(error.message || 'Ошибка удаления');
    },
  });
  const deletingId = deleteMutation.isPending ? deleteMutation.variables : null;
  const saving = createMutation.isPending || updateMutation.isPending;

  const openCreate = useCallback(() => {
    setEditingRow(null);
    form.setFieldsValue({ factory_number: '', is_default: false });
    setModalOpen(true);
  }, [form]);

  const openEdit = useCallback(
    (row: FactoryNumberRow) => {
      setEditingRow(row);
      form.setFieldsValue(row);
      setModalOpen(true);
    },
    [form],
  );

  const handleDelete = useCallback(
    (row: FactoryNumberRow) => {
      deleteMutation.mutate(row.id);
    },
    [deleteMutation],
  );

  const handleModalOk = useCallback(async () => {
    const values = await form.validateFields();
    if (editingRow) {
      updateMutation.mutate({ ...values, id: editingRow.id });
    } else {
      createMutation.mutate(values);
    }
  }, [createMutation, editingRow, form, updateMutation]);

  const columns = useMemo<ColumnsType<FactoryNumberRow>>(
    () => [
      {
        title: 'Заводской номер',
        dataIndex: 'factory_number',
        sorter: true,
      },
      {
        title: 'По умолчанию',
        dataIndex: 'is_default',
        width: 140,
        render: (value: boolean) => (value ? 'Да' : 'Нет'),
      },
      {
        title: 'Действия',
        key: 'actions',
        width: 120,
        render: (_value, record) => (
          <Space size="small">
            <Button
              type="text"
              icon={<EditOutlined />}
              aria-label={`Изменить ${record.factory_number}`}
              onClick={() => openEdit(record)}
            />
            <Popconfirm
              title={`Удалить заводской номер «${record.factory_number}»?`}
              okText="Удалить"
              cancelText="Отмена"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(record)}
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                aria-label={`Удалить ${record.factory_number}`}
                loading={deletingId === record.id}
              />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [deletingId, handleDelete, openEdit],
  );

  return (
    <>
      <ServerDataTable<FactoryNumberRow>
        queryKey={FACTORY_NUMBERS_QUERY_KEY}
        fetchFn={fetchFn}
        columns={columns}
        rowKey="id"
        searchPlaceholder="Поиск по номеру…"
        toolbarExtra={
          <ButtonLoading type="primary" onClick={openCreate}>
            Добавить
          </ButtonLoading>
        }
      />

      <Modal
        title={editingRow ? 'Изменить заводской номер' : 'Добавить заводской номер'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => void handleModalOk()}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="factory_number"
            label="Заводской номер"
            rules={[{ required: true, message: 'Укажите заводской номер' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="is_default" valuePropName="checked">
            <Checkbox>Использовать по умолчанию</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
