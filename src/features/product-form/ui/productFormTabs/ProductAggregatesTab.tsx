import {
  SelectCodeGeneratorTemplate
} from '@/entities/code-generator-template';
import { SelectPrintTemplate } from '@/entities/print-template';
import {
  visibilityFormControl,
  type AggregateFormValues,
  type ProductAggregate,
  type ProductFormValues
} from '@/entities/product';
import { NumberInput } from '@/shared/ui/input';
import { ButtonLoading } from '@/shared/ui/loading';
import { DeleteOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Form, Input, Modal, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';

const AGGREGATE_COLUMNS: ColumnsType<ProductAggregate> = [
  { title: 'Уровень', dataIndex: 'level', width: 90 },
  { title: 'Название', dataIndex: 'name' },
  { title: 'Краткое имя', dataIndex: 'short_name' },
  { title: 'Размер', dataIndex: 'size', width: 90 },
  { title: 'GTIN агрегата', dataIndex: 'aggr_gtin' },
];

/** Props for product aggregates tab content. */
export interface ProductAggregatesTabProps {
  form: FormInstance<ProductFormValues>;
  gtin: string | null | undefined;
  isEdit: boolean;
  loading: boolean;
  visibility?: ReturnType<typeof visibilityFormControl>;
}

let ii = 0;
const keyPrefix = 'pa';

/**
 * Aggregates (packaging levels) table with nested create/delete for a product.
 */
export function ProductAggregatesTab({
  form,
  isEdit,
  gtin,
  loading,
  visibility,
}: ProductAggregatesTabProps) {
  const items = Form.useWatch('aggregates', form) || [];
  const itemsRemoved = Form.useWatch('aggregates_removed', form) || [];

  const [subForm] = Form.useForm<AggregateFormValues>();
  const [modalOpen, setModalOpen] = useState(false);


  const minLevel = useMemo(() => {
    return items.reduce((min, item) => Math.min(min, item.level), 0);
  }, [items]);
  const maxLevel = useMemo(() => {
    return items.reduce((max, item) => Math.max(max, item.level), 0) + (items?.length ? 1: 0);
  }, [items]);
  
  // const invalidateAggregates = () => {
  //   if (!gtin) {
  //     return;
  //   }
  //   void queryClient.invalidateQueries({
  //     queryKey: productRelatedQueryKeys.aggregates(gtin),
  //   });
  // };
  // const aggregateCreateMutation = useMutation({
  //   mutationFn: ({
  //     parentGtin,
  //     values,
  //   }: {
  //     parentGtin: string;
  //     values: AggregateFormValues;
  //   }) => createProductAggregate(parentGtin, values),
  //   onSuccess: () => {
  //     message.success('Агрегат добавлен');
  //     setModalOpen(false);
  //     subForm.resetFields();
  //     invalidateAggregates();
  //   },
  //   onError: (error: Error) => message.error(error.message),
  // });

  const submitItem = (values: AggregateFormValues) => {
    if (values?.id) {
      form.setFieldValue('aggregates', items.map((item) => item.id === values.id ? values : item));
    } else {
      form.setFieldValue('aggregates', [...(items ?? []), {...values, id: `${keyPrefix}${ii++}`}]);
    }
  };

  const removedItem = (record: ProductAggregate) => {
    if (!record.id) {
      return;
    }
    form.setFieldValue('aggregates_removed', [...(itemsRemoved ?? []), record.id]);
  };

  const recucleItem = (record: ProductAggregate) => {
    if (!record.id) {
      return;
    }
    form.setFieldValue('aggregates_removed', itemsRemoved.filter((id) => id !== record.id));
  };
  
  const itemColumns: ColumnsType<ProductAggregate> = [
    ...AGGREGATE_COLUMNS,
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <>
          <ButtonLoading
            tooltip='Редактировать агрегат'
            icon={<EditOutlined />}
            disabled={!isEdit}
            onClick={() => {
              setModalOpen(true)
              subForm.setFieldsValue(record);
            }}
            type="primary"
            style={{ marginRight: 8 }}
          />
          {itemsRemoved.includes(record.id) ?
            <ButtonLoading
              tooltip='Восстановить агрегат'
              color="cyan"
              loading={loading}
              icon={<ReloadOutlined />}
              disabled={!isEdit ||!record.id}
              onClick={() => {
                recucleItem(record);
              }}
            /> :
            <ButtonLoading
              tooltip='Удалить агрегат'
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

  return (
    <>
      <Form.Item name="aggregates" hidden></Form.Item>
      <Form.Item name="aggregates_removed" hidden></Form.Item>
      <Space orientation="vertical" style={{ width: '100%' }}>
        <ButtonLoading
          type="primary"
          disabled={!isEdit}
          onClick={() => {
            setModalOpen(true)
            subForm.resetFields();
          }}
        >
          Добавить агрегат
        </ButtonLoading>
        <Table<ProductAggregate>
          rowKey={(row) => String(row.id ?? `${row.level}-${row.name}`)}
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
          columns={itemColumns}
          dataSource={items}
          loading={loading}
          pagination={false}
          locale={{ emptyText: 'Нет агрегатов' }}
          size="small"
        />
      </Space>
      <Modal
        open={modalOpen}
        title={subForm.getFieldValue('id') ? "Редактировать агрегат" : "Новый агрегат"}
        onCancel={() => setModalOpen(false)}
        keyboard={isEdit}
        width={800}
        footer={[
          <ButtonLoading
            key="cancel"
            onClick={() => {
              setModalOpen(false)
            }}
            disabled={!isEdit}
          >
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
            disabled={!isEdit}
          >
            Сохранить
          </ButtonLoading>,
        ]}
      >
        <Form
          form={subForm}
          layout="horizontal"
          initialValues={{ rows: 1, width_mm: 0 }}
          labelCol={{ span: 8 }}
        >
          <Form.Item name="id" hidden></Form.Item>
          <Form.Item name="print_only" hidden></Form.Item>
          <Form.Item
            name="level"
            label="Уровень"
            rules={[{ required: true, message: 'Укажите уровень' }]}
            style={{ marginBottom: 4 }}
            required
          >
            <NumberInput required min={minLevel} max={maxLevel} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="name"
            label="Наименование"
            rules={[{ required: true, message: 'Укажите наименование агрегата!' }]}
            style={{ marginBottom: 4 }}
            required
          >
            <Input required />
          </Form.Item>
          <Form.Item
            name="short_name"
            label="Краткое наименование"
            rules={[
              { required: true, message: 'Укажите краткое наименование агрегата!' },
            ]}
            style={{ marginBottom: 4 }}
            required
          >
            <Input required />
          </Form.Item>
          <Form.Item name="aggr_gtin" label="GTIN/Штрихкод" style={{ marginBottom: 4 }}>
            <Input />
          </Form.Item>
          <Form.Item
            name="size"
            label="Размерность"
            rules={[{ required: true, message: 'Укажите размерность агрегата!' }]}
            style={{ marginBottom: 4 }}
            required
          >
            <NumberInput required min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="rows"
            label="Количество слоев"
            rules={[{ required: true, message: 'Укажите количество слоев' }]}
            style={{ marginBottom: 4 }}
          >
            <NumberInput min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="width_mm"
            label="Длина упаковки"
            rules={[{ required: true, message: 'Укажите длину упаковки' }]}
            style={{ marginBottom: 4 }}
          >
            <NumberInput min={0} suffix=" мм" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="template_id" label="Шаблон кода агрегата"  style={{ marginBottom: 4 }}>
            <SelectPrintTemplate defaultValue={''} selectedOption={{value: '', label: 'Системный шаблон'}} />
          </Form.Item>
          <Form.Item name="plain_template_id" label="Шаблон БЕЗ кода агрегата"  style={{ marginBottom: 4 }} rules={[
              ({ getFieldValue }) => ({ 
                validator: async (_, value) => {
                  const print_only = getFieldValue('print_only');
                  if (print_only && !value) {
                    return Promise.reject(new Error('Укажите шаблон БЕЗ кода агрегата'));
                  }
                }
              })
            ]}>
            <SelectPrintTemplate defaultValue={''} selectedOption={{value: '', label: 'Системный шаблон'}} onChange={(value) => {
              subForm.setFieldValue('print_only', Boolean(value));
            }}/>
          </Form.Item>
          <Form.Item name="code_generator_template_id" label="Генератор кода агрегата"  style={{ marginBottom: 4 }}>
            <SelectCodeGeneratorTemplate defaultValue={''} selectedOption={{value: '', label: 'Системный генератор'}} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
