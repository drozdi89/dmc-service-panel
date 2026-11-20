import { SelectCrptOrganizations } from '@/entities/integration';
import { SelectPrintTemplate } from '@/entities/print-template';
import type { ProductFormValues } from '@/entities/product';
import {
  visibilityFormControl,
  type ProductArticle
} from '@/entities/product';
import { ButtonLoading } from '@/shared/ui/loading';
import { DeleteOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Divider, Form, Input, InputNumber, Modal, Space, Switch, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';

export interface ProductArticlesTabProps {
  form: FormInstance<ProductFormValues>;
  gtin: string | null | undefined;
  isEdit: boolean;
  visibility?: ReturnType<typeof visibilityFormControl>;
  loading: boolean;
  itemsRemoved: Array<ProductArticle['id']>;
  onItemsRemovedChange: (next: Array<ProductArticle['id']>) => void;
}

let ii = 0;
const keyPrefix = 'pa_';

const defaultOverrides = {
  "name": {
    label: 'Наименование',
    component: Input,
  },
  "short_name": {
    label: 'Короткое наименование',
    component: Input,
  },
  "assortment_number": {
    label: 'Ассортиментный номер',
    component: Input,
  },
  "additional_text": {
    label: 'Дополнительный текст для печати',
    component: Input,
  },
  "barcode": {
    label: 'Штрихкод',
    component: Input,
  },
  "owner_inn": {
    label: 'ИНН владельца',
    component: Input,
  },
	"producer_inn": {
    label: 'ИНН производителя',
    component: Input,
  },

  "mrp": {
    label: 'MRP / Цена',
    component:InputNumber
  },
	"lifetime": {
    label: 'Срок годности',
    component: InputNumber,
  },
  "autoorder_amount": {
    label: 'Автозаказ, шт',
    component: InputNumber,
  },
  "beer_volume_ml": {
    label: 'Объем / вес, мл',
    component: InputNumber,
  },
	"package_weight": {
    label: 'Вес упаковки',
    component: InputNumber,
  },
  
	


	"template_id": {
    label: 'Шаблон c КМ',
    component: SelectPrintTemplate,
  },
  "plain_template_id": {
    label: 'Шаблон без КМ',
    component: SelectPrintTemplate,
  },
  "factory_number_id": {
    label: 'ID номера завода',
    component: SelectCrptOrganizations,
  },

  "vet_control": {
    label: 'Ветеринарный контроль',
    component: Switch,
  },
  "is_imported": {
    label: 'Импортный',
    component: Switch,
  },
	"auto_send_apply": {
    label: 'Автоматическая отправка применения',
    component: Switch,
  },
	"use_data_export": {
    label: 'Использовать экспорт данных',
    component: Switch,
  },
	"auto_send_aggregate": {
    label: 'Автоматическая отправка агрегата',
    component: Switch,
  },
	"auto_send_introduce": {
    label: 'Автоматическая отправка введение',
    component: Switch,
  },
	"contract_commissioning": {
    label: 'Комиссионное доведение до контракта',
    component: Switch,
  },
	"auto_skip_serialization": {
    label: 'Автоматическая пропускная серийность',
    component: Switch,
  },
};

/**
 * Certificates table with nested create/delete dialogs for a product.
 */
export function ProductArticlesTab({
  form,
  gtin,
  isEdit,
  loading,
  visibility,
  itemsRemoved,
  onItemsRemovedChange,
}: ProductArticlesTabProps) {
  const { showedWellNumber } = useMemo(() => visibility ?? visibilityFormControl(form.getFieldsValue()), [visibility, form.getFieldsValue()]);

  const items = Form.useWatch('articles', form) || [];

  const [modalOpen, setModalOpen] = useState(false);
  const [subForm] = Form.useForm<ProductArticle>();

  const submitItem = (values: ProductArticle) => {
    const next: ProductArticle = {
      ...values,
    };
    if (next.id) {
      form.setFieldValue(
        'articles',
        items.map((item) =>
          item.id === next.id ? next : item,
        ),
      );
    } else {
      form.setFieldValue('articles', [
        ...(items ?? []),
        { ...next, id: `${keyPrefix}c${ii++}` },
      ]);
    }
  };

  const removedItem = (record: ProductArticle) => {
    if (!record.id) {
      return;
    }
    onItemsRemovedChange([...(itemsRemoved ?? []), record.id]);
  };

  const recucleItem = (record: ProductArticle) => {
    if (!record.id) {
      return;
    }
    onItemsRemovedChange(itemsRemoved.filter((id) => id !== record.id));
  };

  const certColumns: ColumnsType<ProductArticle> = [
    { title: 'Название', dataIndex: 'name' },
    { title: 'Код', dataIndex: 'code' },
    { title: 'Статус', dataIndex: 'active', render: (value) => value ? 'Архив' : 'Активно' },
    { title: 'Создано', dataIndex: 'created_at', render: (value) => dayjs(value).format('DD.MM.YYYY HH:mm:ss') },
    { title: 'Обновлено', dataIndex: 'updated_at', render: (value) => dayjs(value).format('DD.MM.YYYY HH:mm:ss') },
    {
      title: 'Действия',
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
              subForm.setFieldValue('disabled', Object.fromEntries(
                Object.entries(record.overrides || {}).map(([key, value]) => [key, true]),
              ));
            }}
            type="primary"
            style={{ marginRight: 8 }}
          />
          {itemsRemoved.includes(record.id) ?
            <ButtonLoading
              tooltip='Восстановить сертификат'
              color="cyan"
              loading={loading}
              icon={<ReloadOutlined />}
              disabled={!isEdit ||!record.id}
              onClick={() => {
                recucleItem(record);
              }}
            /> :
            <ButtonLoading
              tooltip='Удалить сертификат'
              danger
              loading={loading}
              icon={<DeleteOutlined />}
              disabled={!isEdit ||!record.id}
              onClick={() => {
                removedItem(record);
              }}
            />
          }
        </>
      ),
    },
  ];
  
  const disabled = Form.useWatch('disabled', subForm) || {};

  return (
    <>
      <Form.Item name="articles" hidden></Form.Item>
      <Space orientation="vertical" style={{ width: '100%' }}>
        <ButtonLoading type="primary" disabled={!isEdit} onClick={() => {
          setModalOpen(true)
          subForm.resetFields();
        }}>
          Добавить артикул
        </ButtonLoading>
        <Table<ProductArticle>
          rowKey={(row) => String(row.id)}
          onRow={(record) => {
            if (record.id && itemsRemoved.includes(record.id)) {
              return {
                style: {
                  backgroundColor: String(record.id).startsWith(keyPrefix) ? 'rgba(0, 255, 0, 0.1)' : '',
                  textDecoration: 'line-through',
                }
              }
            }
            return {
              style: {
                backgroundColor: String(record.id).startsWith(keyPrefix) ? 'rgba(0, 255, 0, 0.1)' : '',
              }
            }
          }}
          columns={certColumns}
          dataSource={items}
          loading={loading}
          pagination={false}
          locale={{ emptyText: 'Нет сертификатов' }}
          size="small"
        />
      </Space>

      <Modal
        open={modalOpen}
        title={subForm.getFieldValue('id') ? "Редактировать сертификат" : "Новый сертификат"}
        onCancel={() => setModalOpen(false)}
        width={1024}
        style={{ top: '1rem' }}
        styles={{ body: { maxHeight: 'calc(100vh - 10rem)', overflowY: 'auto' } }}
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
        <Form form={subForm} initialValues={{
          disabled: {},
          overrides: {}
        }} layout="horizontal" labelCol={{ span: 8 }}>
          <Form.Item name="id" hidden></Form.Item>
          <Form.Item
            name="name"
            label="Название"
            rules={[{ required: true, message: 'Укажите название' }]}
            style={{ marginBottom: 4 }}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="code"
            label="Код"
            rules={[{ required: true, message: 'Укажите код' }]}
            style={{ marginBottom: 4 }}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="active"
            label="Статус"
            style={{ marginBottom: 4 }}
          >
            <Switch />
          </Form.Item>
          <Divider style={{ margin: '0 0 4px' }} />

          {Object.entries(defaultOverrides).map(([key, { label, component: Component, ...props }]) => (
              <Form.Item
                name={['overrides', key]}
                label={
                (<>
                  <Form.Item
                    name={['disabled', key]}
                    style={{ marginBottom: 0 }}
                  >
                    <Switch />
                    
                  </Form.Item>
                  {label}
                </>)
              }
                labelAlign='left'
                style={{ marginBottom: 4, width: '100%' }}
              >
                <Component {...props} style={{ width: Component === InputNumber ? '100%' : undefined }} disabled={!disabled?.[key as keyof typeof disabled]}/>
              </Form.Item>
          ))}        

        </Form>
      </Modal>
    </>
  );
}
