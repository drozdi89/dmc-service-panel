import type { ProductFormValues } from '@/entities/product';
import {
  visibilityFormControl,
  type LicenceFormValues,
  type ProductLicence
} from '@/entities/product';
import {
  dateStringPickerValueProps,
  formatDatePickerValue,
} from '@/shared/lib/dateStringPicker';
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
}

let ii = 0;
const keyPrefix = 'pl';

/**
 * Licences table with nested create/delete dialogs for a product.
 */
export function ProductLicencesTab({
  form,
  gtin,
  isEdit,
  loading,
  visibility,
}: ProductLicencesTabProps) {

  const items = Form.useWatch('licences', form) || [];
  const itemsRemoved = Form.useWatch('licences_removed', form) || [];

  const [modalOpen, setModalOpen] = useState(false);
  const [subForm] = Form.useForm<LicenceFormValues>();

  // const invalidateLicences = () => {
  //   if (!gtin) {
  //     return;
  //   }
  //   void queryClient.invalidateQueries({
  //     queryKey: productRelatedQueryKeys.licences(gtin),
  //   });
  // };

  // const licCreateMutation = useIdempotentMutation<ProductLicence>({
  //   onSuccess: () => {
  //     message.success('Лицензия добавлена');
  //     setModalOpen(false);
  //     subForm.resetFields();
  //     invalidateLicences();
  //   },
  //   onError: (error) => message.error(error.message),
  // });

  // const licDeleteMutation = useIdempotentMutation<void>({
  //   onSuccess: () => {
  //     message.success('Лицензия удалена');
  //     invalidateLicences();
  //   },
  //   onError: (error) => message.error(error.message),
  // });

  const submitItem = (values: LicenceFormValues) => {
    const next: LicenceFormValues = {
      ...values,
      lic_date: formatDatePickerValue(values.lic_date) ?? '',
    };
    if (next.lic_id) {
      form.setFieldValue(
        'licences',
        items.map((item) =>
          item.lic_id === next.lic_id ? next : item,
        ),
      );
    } else {
      form.setFieldValue('licences', [
        ...(items ?? []),
        { ...next, lic_id: `${keyPrefix}${ii++}` },
      ]);
    }
  };

  const removedItem = (record: ProductLicence) => {
    if (!record.lic_id) {
      return;
    }
    form.setFieldValue('licences_removed', [...(itemsRemoved ?? []), record.lic_id]);
  };

  const recucleItem = (record: ProductLicence) => {
    if (!record.lic_id) {
      return;
    }
    form.setFieldValue('licences_removed', itemsRemoved.filter((lic_id) => lic_id !== record.lic_id));
  };
  
  const itemColumns: ColumnsType<ProductLicence> = [
    { title: 'Номер', dataIndex: 'lic_number' },
    { title: 'Дата', dataIndex: 'lic_date', render: (value) => dayjs(value).format('DD.MM.YYYY') },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <>
          <ButtonLoading
            tooltip='Редактировать лицензию'
            icon={<EditOutlined />}
            disabled={!isEdit}
            onClick={() => {
              setModalOpen(true)
              subForm.setFieldsValue(record as LicenceFormValues);
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
              disabled={!isEdit ||!record.lic_id}
              onClick={() => {
                removedItem(record);
              }}
            />
            
          }
        </>
      )
    },
  ];

  return (
    <>
      <Form.Item name="licences" hidden></Form.Item>
      <Form.Item name="licences_removed" hidden></Form.Item>
      <Space direction="vertical" style={{ width: '100%' }}>
        <ButtonLoading type="primary" disabled={!isEdit} onClick={() => {
          setModalOpen(true)
          subForm.resetFields();
        }}>
          Добавить лицензию
        </ButtonLoading>
        <Table<ProductLicence>
          rowKey={(row) => String(row.lic_id ?? row.lic_number)}
          columns={itemColumns}
          onRow={(record) => {
            if (record.lic_id && itemsRemoved.includes(record.lic_id)) {
              return {
                style: {
                  backgroundColor: String(record.lic_id).startsWith(keyPrefix) ? 'rgba(0, 255, 0, 0.1)' : '',
                  textDecoration: 'line-through',
                }
              }
            }
            return {
              style: {
                backgroundColor: String(record.lic_id).startsWith(keyPrefix) ? 'rgba(0, 255, 0, 0.1)' : '',
              }
            }
          }}
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
          <Form.Item name="lic_id" hidden></Form.Item>
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
