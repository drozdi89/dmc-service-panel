import type { ProductFormValues } from '@/entities/product';
import {
  visibilityFormControl,
  type LicenceFormValues,
  type ProductLicence
} from '@/entities/product';
import { dateStringPickerValueProps } from '@/shared/lib/dateStringPicker';
import { FormHiddenInput } from '@/shared/ui/form/FormHiddenInput';
import { ButtonLoading } from '@/shared/ui/loading';
import { DeleteOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { DatePicker, Form, Input, Modal, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useState } from 'react';

/** Props for product licences tab content. */
export interface ProductLicencesTabProps {
  form: FormInstance<ProductFormValues>;
  gtin: string | null | undefined;
  isEdit: boolean;
  loading: boolean;
  visibility?: ReturnType<typeof visibilityFormControl>;
  itemsRemoved: Array<ProductLicence['lic_id']>;
  onItemsRemovedChange: (next: Array<ProductLicence['lic_id']>) => void;
}

const NEW_ROW_BACKGROUND = 'rgba(0, 255, 0, 0.1)';

/**
 * Licences table with nested create/delete dialogs for a product.
 * Unsaved rows have no `lic_id`; the edited row is tracked by index.
 */
export function ProductLicencesTab({
  form,
  gtin: _gtin,
  isEdit,
  loading,
  visibility: _visibility,
  itemsRemoved,
  onItemsRemovedChange,
}: ProductLicencesTabProps) {

  const items = Form.useWatch('licences', form) || [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [subForm] = Form.useForm<LicenceFormValues>();

  const submitItem = (values: LicenceFormValues) => {
    if (editingIndex !== null) {
      form.setFieldValue(
        'licences',
        items.map((item, index) => (index === editingIndex ? values : item)),
      );
    } else {
      form.setFieldValue('licences', [...items, values]);
    }
  };

  const removedItem = (record: ProductLicence, rowIndex: number) => {
    if (record.lic_id == null) {
      form.setFieldValue(
        'licences',
        items.filter((_, index) => index !== rowIndex),
      );
      return;
    }
    onItemsRemovedChange([...(itemsRemoved ?? []), record.lic_id]);
  };

  const recucleItem = (record: ProductLicence) => {
    if (!record.lic_id) {
      return;
    }
    onItemsRemovedChange(itemsRemoved.filter((lic_id) => lic_id !== record.lic_id));
  };
  
  const itemColumns: ColumnsType<ProductLicence> = [
    { title: 'Номер', dataIndex: 'lic_number' },
    { title: 'Дата', dataIndex: 'lic_date', render: (value) => dayjs(value).format('DD.MM.YYYY') },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_, record, rowIndex) => (
        <>
          <ButtonLoading
            tooltip='Редактировать лицензию'
            icon={<EditOutlined />}
            disabled={!isEdit}
            onClick={() => {
              setEditingIndex(rowIndex);
              setModalOpen(true);
              subForm.resetFields();
              subForm.setFieldsValue(record);
            }}
            type="primary"
            style={{ marginRight: 8 }}
          />
          {itemsRemoved.includes(record.lic_id) ?
            <ButtonLoading
              tooltip='Восстановить лицензию'
              color="cyan"
              loading={loading}
              icon={<ReloadOutlined />}
              disabled={!isEdit ||!record.lic_id}
              onClick={() => {
                recucleItem(record);
              }}
            /> :
            <ButtonLoading
              tooltip='Удалить лицензию'
              danger
              loading={loading}
              icon={<DeleteOutlined />}
              disabled={!isEdit}
              onClick={() => {
                removedItem(record, rowIndex);
              }}
            />
            
          }
        </>
      )
    },
  ];

  return (
    <>
      <Space orientation="vertical" style={{ width: '100%' }}>
        <ButtonLoading type="primary" disabled={!isEdit} onClick={() => {
          setEditingIndex(null);
          setModalOpen(true);
          subForm.resetFields();
        }}>
          Добавить лицензию
        </ButtonLoading>
        <Table<ProductLicence>
          rowKey={(row) => (row.lic_id != null ? String(row.lic_id) : `new-${items.indexOf(row)}`)}
          columns={itemColumns}
          onRow={(record) => ({
            style: {
              backgroundColor: record.lic_id == null ? NEW_ROW_BACKGROUND : '',
              textDecoration:
                record.lic_id != null && itemsRemoved.includes(record.lic_id)
                  ? 'line-through'
                  : undefined,
            },
          })}
          dataSource={items}
          loading={loading}
          pagination={false}
          locale={{ emptyText: 'Нет лицензий' }}
          size="small"
        />
      </Space>

      <Modal
        open={modalOpen}
        title="Новая лицензия"
        onCancel={() => setModalOpen(false)}
        footer={[
          <ButtonLoading key="cancel" onClick={() => setModalOpen(false)}>
            Отмена
          </ButtonLoading>,
          <ButtonLoading
            key="save"
            type="primary"
            loading={loading}
            onClick={async () => {
              const values = await subForm.validateFields();
              submitItem(values);
              setModalOpen(false);
              subForm.resetFields();
            }}
          >
            Добавить
          </ButtonLoading>,
        ]}
      >
        <Form form={subForm} layout="horizontal" labelCol={{ span: 8 }}>
          <Form.Item name="lic_id" hidden>
            <FormHiddenInput />
          </Form.Item>
          <Form.Item
            name="lic_number"
            label="Номер"
            rules={[{ required: true, message: 'Укажите номер' }]}
            style={{ marginBottom: 4 }}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="lic_date"
            label="Дата"
            rules={[{ required: true, message: 'Укажите дату' }]}
            {...dateStringPickerValueProps}
            style={{ marginBottom: 4 }}
          >
            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
