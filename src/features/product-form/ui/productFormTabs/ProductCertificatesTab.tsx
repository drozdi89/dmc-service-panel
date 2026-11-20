import type { ProductFormValues } from '@/entities/product';
import {
  CERT_TYPE_OPTIONS,
  visibilityFormControl,
  type ProductCertificate
} from '@/entities/product';
import {
  dateStringPickerValueProps,
  formatDatePickerValue,
} from '@/shared/lib/dateStringPicker';
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
}

let ii = 0;
const keyPrefix = 'pc';

/**
 * Certificates table with nested create/delete dialogs for a product.
 */
export function ProductCertificatesTab({
  form,
  gtin,
  isEdit,
  loading,
  visibility,
}: ProductCertificatesTabProps) {
  const { showedWellNumber } = useMemo(() => visibility ?? visibilityFormControl(form.getFieldsValue()), [visibility, form.getFieldsValue()]);

  const items = Form.useWatch('certificates', form) || [];
  const itemsRemoved = Form.useWatch('certificates_removed', form) || [];

  const [modalOpen, setModalOpen] = useState(false);
  const [subForm] = Form.useForm<ProductCertificate>();

  // const invalidateCertificates = () => {
  //   if (!gtin) {
  //     return;
  //   }
  //   void queryClient.invalidateQueries({
  //     queryKey: productRelatedQueryKeys.certificates(gtin),
  //   });
  // };

  // const certCreateMutation = useIdempotentMutation<ProductCertificate>({
  //   onSuccess: () => {
  //     message.success('Сертификат добавлен');
  //     setModalOpen(false);
  //     subForm.resetFields();
  //     invalidateCertificates();
  //   },
  //   onError: (error) => message.error(error.message),
  // });

  // const certDeleteMutation = useIdempotentMutation<void>({
  //   onSuccess: () => {
  //     message.success('Сертификат удалён');
  //     invalidateCertificates();
  //   },
  //   onError: (error) => message.error(error.message),
  // });

  // const certUpdateMutation = useIdempotentMutation<ProductCertificate>({
  //   onSuccess: () => {
  //     message.success('Сертификат обновлен');
  //     invalidateCertificates();
  //   },
  //   onError: (error) => message.error(error.message),
  // });


  const submitItem = (values: ProductCertificate) => {
    const next: ProductCertificate = {
      ...values,
      cert_date: formatDatePickerValue(values.cert_date) ?? '',
    };
    if (next.cert_id) {
      form.setFieldValue(
        'certificates',
        items.map((item) =>
          item.cert_id === next.cert_id ? next : item,
        ),
      );
    } else {
      form.setFieldValue('certificates', [
        ...(items ?? []),
        { ...next, cert_id: `${keyPrefix}c${ii++}` },
      ]);
    }
  };

  const removedItem = (record: ProductCertificate) => {
    if (!record.cert_id) {
      return;
    }
    form.setFieldValue('certificates_removed', [...(itemsRemoved ?? []), record.cert_id]);
  };

  const recucleItem = (record: ProductCertificate) => {
    if (!record.cert_id) {
      return;
    }
    form.setFieldValue('certificates_removed', itemsRemoved.filter((cert_id) => cert_id !== record.cert_id));
  };

  const itemColumns: ColumnsType<ProductCertificate> = [
    {
      title: 'РД Активна для отправки',
      dataIndex: 'priority',
      render: (value: boolean, record) => {
        return <Checkbox
          checked={value}
          onChange={async (e) => {
            submitItem({
              ...record,
              priority: e.target.checked ? 1 : 0,
            } as ProductCertificate);
          }}
        />
      },
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
      render: (_, record) => (
        <>
          <ButtonLoading
            tooltip='Редактировать сертификат'
            icon={<EditOutlined />}
            disabled={!isEdit}
            onClick={() => {
              setModalOpen(true)
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
              disabled={!isEdit ||!record.cert_id}
              onClick={() => {
                removedItem(record);
              }}
            />
            
          }
        </>
      ),
    },
  ];

  return (
    <>
      <Form.Item name="certificates" hidden></Form.Item>
      <Form.Item name="certificates_removed" hidden></Form.Item>
      <Space orientation="vertical" style={{ width: '100%' }}>
        <ButtonLoading type="primary" disabled={!isEdit} onClick={() => {
          setModalOpen(true)
          subForm.resetFields();
        }}>
          Добавить сертификат
        </ButtonLoading>
        <Table<ProductCertificate>
          rowKey={(row) => String(row.cert_id ?? row.cert_number)}
          onRow={(record) => {
            if (record.cert_id && itemsRemoved.includes(record.cert_id)) {
              return {
                style: {
                  backgroundColor: String(record.cert_id).startsWith(keyPrefix) ? 'rgba(0, 255, 0, 0.1)' : '',
                  textDecoration: 'line-through',
                }
              }
            }
            return {
              style: {
                backgroundColor: String(record.cert_id).startsWith(keyPrefix) ? 'rgba(0, 255, 0, 0.1)' : '',
              }
            }
          }}
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
        title={subForm.getFieldValue('cert_id') ? "Редактировать сертификат" : "Новый сертификат"}
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
          <Form.Item name="cert_id" hidden></Form.Item>
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
          <Form.Item name="priority" label="РД Активна для отправки" valuePropName="checked" style={{ marginBottom: 4 }}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
