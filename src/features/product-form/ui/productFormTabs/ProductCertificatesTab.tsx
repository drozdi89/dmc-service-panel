import type { ProductFormValues } from '@/entities/product';
import {
  CERT_TYPE_OPTIONS,
  visibilityFormControl,
  type CertificateFormValues,
  type ProductCertificate
} from '@/entities/product';
import { dateStringPickerValueProps } from '@/shared/lib/dateStringPicker';
import { FormHiddenInput } from '@/shared/ui/form/FormHiddenInput';
import { ButtonLoading } from '@/shared/ui/loading';
import { DeleteOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Checkbox, DatePicker, Form, Input, Modal, Select, Space, Switch, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';

/** Props for product certificates tab content. */
export interface ProductCertificatesTabProps {
  form: FormInstance<ProductFormValues>;
  gtin: string | null | undefined;
  isEdit: boolean;
  visibility?: ReturnType<typeof visibilityFormControl>;
  loading: boolean;
  itemsRemoved: Array<ProductCertificate['cert_id']>;
  onItemsRemovedChange: (next: Array<ProductCertificate['cert_id']>) => void;
}

const NEW_ROW_BACKGROUND = 'rgba(0, 255, 0, 0.1)';

/** Switch ↔ API `priority` flag (0 | 1). */
const priorityFlagProps = {
  valuePropName: 'checked',
  getValueProps: (value: number | null | undefined) => ({ checked: value === 1 }),
  normalize: (checked: boolean): number => (checked ? 1 : 0),
} as const;

/**
 * Certificates table with nested create/delete dialogs for a product.
 * Unsaved rows have no `cert_id`; the edited row is tracked by index.
 */
export function ProductCertificatesTab({
  form,
  gtin: _gtin,
  isEdit,
  loading,
  visibility,
  itemsRemoved,
  onItemsRemovedChange,
}: ProductCertificatesTabProps) {
  const { showedWellNumber } = useMemo(() => visibility ?? visibilityFormControl(form.getFieldsValue()), [visibility, form.getFieldsValue()]);

  const items = Form.useWatch('certificates', form) || [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const subModalIsEdit = editingIndex !== null;
  const [subForm] = Form.useForm<CertificateFormValues>();

  const replaceItemAt = (rowIndex: number, values: CertificateFormValues) => {
    form.setFieldValue(
      'certificates',
      items.map((item, index) => (index === rowIndex ? values : item)),
    );
  };

  const submitItem = (values: CertificateFormValues) => {
    if (editingIndex !== null) {
      replaceItemAt(editingIndex, values);
    } else {
      form.setFieldValue('certificates', [...items, values]);
    }
  };

  const removedItem = (record: ProductCertificate, rowIndex: number) => {
    if (record.cert_id == null) {
      form.setFieldValue(
        'certificates',
        items.filter((_, index) => index !== rowIndex),
      );
      return;
    }
    onItemsRemovedChange([...(itemsRemoved ?? []), record.cert_id]);
  };

  const recucleItem = (record: ProductCertificate) => {
    if (!record.cert_id) {
      return;
    }
    onItemsRemovedChange(itemsRemoved.filter((cert_id) => cert_id !== record.cert_id));
  };

  const itemColumns: ColumnsType<ProductCertificate> = [
    {
      title: 'РД Активна для отправки',
      dataIndex: 'priority',
      render: (value: ProductCertificate['priority'], record, rowIndex) => (
        <Checkbox
          checked={value === 1}
          onChange={(e) => {
            replaceItemAt(rowIndex, {
              ...record,
              priority: e.target.checked ? 1 : 0,
            });
          }}
        />
      ),
    },
    {
      title: 'Тип',
      dataIndex: 'cert_type',
      render: (value: ProductCertificate['cert_type']) =>
        CERT_TYPE_OPTIONS.find((item) => item.value === value)?.label ?? value,
    },
    { title: 'Номер', dataIndex: 'cert_number' },
    { title: 'Дата', dataIndex: 'cert_date', render: (value) => dayjs(value).format('DD.MM.YYYY') },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_, record, rowIndex) => (
        <>
          <ButtonLoading
            tooltip='Редактировать сертификат'
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
          {itemsRemoved.includes(record.cert_id) ?
            <ButtonLoading
              tooltip='Восстановить сертификат'
              color="cyan"
              loading={loading}
              icon={<ReloadOutlined />}
              disabled={!isEdit ||!record.cert_id}
              onClick={() => {
                recucleItem(record);
              }}
            /> :
            <ButtonLoading
              tooltip='Удалить сертификат'
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
      ),
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
          Добавить сертификат
        </ButtonLoading>
        <Table<ProductCertificate>
          rowKey={(row) => (row.cert_id != null ? String(row.cert_id) : `new-${items.indexOf(row)}`)}
          onRow={(record) => ({
            style: {
              backgroundColor: record.cert_id == null ? NEW_ROW_BACKGROUND : '',
              textDecoration:
                record.cert_id != null && itemsRemoved.includes(record.cert_id)
                  ? 'line-through'
                  : undefined,
            },
          })}
          columns={itemColumns}
          dataSource={items}
          loading={loading}
          pagination={false}
          locale={{ emptyText: 'Нет сертификатов' }}
          size="small"
        />
      </Space>

      <Modal
        open={modalOpen}
        title={subModalIsEdit ? 'Редактировать сертификат' : 'Новый сертификат'}
        onCancel={() => setModalOpen(false)}
        footer={[
          <ButtonLoading key="cancel" onClick={() => {
            setModalOpen(false)
          }}>
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
            Сохранить
          </ButtonLoading>,
        ]}
      >
        <Form form={subForm} initialValues={{ priority: 0, cert_id: undefined, cert_number: undefined, cert_date: undefined, well_number: undefined, cert_type: undefined }} layout="horizontal" labelCol={{ span: 8 }}>
          <Form.Item name="cert_id" hidden>
            <FormHiddenInput />
          </Form.Item>
          <Form.Item
            name="cert_type"
            label="Тип"
            rules={[{ required: true, message: 'Выберите тип' }]}
            style={{ marginBottom: 4 }}
          >
            <Select options={[...CERT_TYPE_OPTIONS]} />
          </Form.Item>
          <Form.Item
            name="cert_number"
            label="Номер"
            rules={[{ required: true, message: 'Укажите номер' }]}
            style={{ marginBottom: 4 }}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="cert_date"
            label="Дата"
            rules={[{ required: true, message: 'Укажите дату' }]}
            {...dateStringPickerValueProps}
            style={{ marginBottom: 4 }}
          >
            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>
          {showedWellNumber && (<Form.Item name="well_number" label="Номер скважины" style={{ marginBottom: 4 }}>
            <Input />
          </Form.Item>)}
          <Form.Item name="priority" label="РД Активна для отправки" {...priorityFlagProps} style={{ marginBottom: 4 }}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
