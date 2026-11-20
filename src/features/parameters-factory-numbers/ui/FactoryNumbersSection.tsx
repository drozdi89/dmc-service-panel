import {
  FACTORY_NUMBERS_QUERY_KEY,
  createFactoryNumber,
  deleteFactoryNumbers,
  fetchFactoryNumbers,
  updateFactoryNumber,
  type FactoryNumberRow,
} from '@/entities/parameters';
import { createIdempotencyKey } from '@/shared/api/headers';
import type { ListQueryParams } from '@/shared/types/listQuery';
import { ServerDataTable } from '@/shared/ui/ServerDataTable';
import { ButtonLoading } from '@/shared/ui/loading';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Checkbox, Form, Input, Modal, Popconfirm, Space, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useMemo, useState } from 'react';

/** Form values for factory number create/edit modal. */
interface FactoryNumberFormValues {
  factory_number: string;
  is_default: boolean;
}

/**
 * Factory numbers CRUD table with server-side search, sort, and pagination.
 */
export function FactoryNumbersSection() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<FactoryNumberRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form] = Form.useForm<FactoryNumberFormValues>();

  const fetchFn = useCallback(
    (params: ListQueryParams) => fetchFactoryNumbers(params),
    [],
  );

  const invalidateList = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: FACTORY_NUMBERS_QUERY_KEY });
  }, [queryClient]);

  const openCreate = useCallback(() => {
    setEditingRow(null);
    form.setFieldsValue({ factory_number: '', is_default: false });
    setModalOpen(true);
  }, [form]);

  const openEdit = useCallback(
    (row: FactoryNumberRow) => {
      setEditingRow(row);
      form.setFieldsValue({
        factory_number: row.factory_number,
        is_default: row.is_default,
      });
      setModalOpen(true);
    },
    [form],
  );

  const handleDelete = useCallback(
    async (row: FactoryNumberRow) => {
      setDeletingId(row.id);
      try {
        await deleteFactoryNumbers([row.id], createIdempotencyKey());
        message.success('Заводской номер удалён');
        invalidateList();
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Ошибка удаления');
      } finally {
        setDeletingId(null);
      }
    },
    [invalidateList],
  );

  const handleModalOk = useCallback(async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const key = createIdempotencyKey();
      if (editingRow) {
        await updateFactoryNumber(editingRow.id, values, key);
        message.success('Заводской номер обновлён');
      } else {
        await createFactoryNumber(values, key);
        message.success('Заводской номер добавлен');
      }
      setModalOpen(false);
      invalidateList();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }, [editingRow, form, invalidateList]);

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
              onConfirm={() => void handleDelete(record)}
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
