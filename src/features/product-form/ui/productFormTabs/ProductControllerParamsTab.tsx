import {
  type ProductControllerParam,
  type ProductFormValues,
} from '@/entities/product';

import { SelectProductControllerAddressType, visibilityFormControl } from '@/entities/product';
import { ButtonLoading } from '@/shared/ui/loading';
import { DeleteOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import type { FormInstance, SelectProps } from 'antd';
import { Form, Input, InputNumber, Modal, Select, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useCallback, useState } from 'react';

/** Props for product certificates tab content. */
export interface ProductControllerParamsTabProps {
  form: FormInstance<ProductFormValues>;
  gtin: string | null | undefined;
  isEdit: boolean;
  loading: boolean;
  visibility?: ReturnType<typeof visibilityFormControl>;
}

let ii = 0;
const keyPrefix = 'pcp';

/**
 * Certificates table with nested create/delete dialogs for a product.
 */
export function ProductControllerParamsTab({
  form,
  gtin,
  isEdit,
  loading,
  visibility
}: ProductControllerParamsTabProps) {
  const aggregates = Form.useWatch('aggregates', form) || [];
  const aggregatesRemoved = Form.useWatch('aggregates_removed', form) || [];

  const controllerParams = Form.useWatch('controller_params', form) || [];
  const controllerParamsRemoved = Form.useWatch('controller_params_removed', form) || [];

  const [controllerParamModalOpen, setControllerParamModalOpen] = useState(false);
  const [controllerParamForm] = Form.useForm<ProductControllerParam>();
 
  const submitControllerParam = (values: ProductControllerParam) => {
    if (values.id) {
      form.setFieldValue(
        'controller_params',
        controllerParams.map((controllerParam) =>
          controllerParam.id === values.id ? values : controllerParam,
        ),
      );
    } else {
      form.setFieldValue('controller_params', [
        ...(controllerParams ?? []),
        { ...values, id: `${keyPrefix}${ii++}` },
      ]);
    }
  };

  const removedControllerParam = (record: ProductControllerParam) => {
    if (!record.id) {
      return;
    }
    form.setFieldValue('controller_params_removed', [...(controllerParamsRemoved ?? []), record.id]);
  };

  const recucleControllerParam = (record: ProductControllerParam) => {
    if (!record.id) {
      return;
    }
    form.setFieldValue('controller_params_removed', controllerParamsRemoved.filter((id) => id !== record.id));
  };
  
  const controllerParamColumns: ColumnsType<ProductControllerParam> = [
    { title: 'Фасовка', dataIndex: 'node_name' },
    { title: 'Тип', dataIndex: 'address_type' },
    { title: 'Адрес', dataIndex: 'address' },
    { title: 'Значение', dataIndex: 'value' },
    { title: 'Описание', dataIndex: 'description' },
    {
      title: 'Действия',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <>
          <ButtonLoading
            tooltip='Редактировать сертификат'
            icon={<EditOutlined />}
            disabled={!isEdit || (record.node_id && aggregatesRemoved.includes(record.node_id))}
            onClick={() => {
              setControllerParamModalOpen(true)
              controllerParamForm.setFieldsValue(record as ProductControllerParam);
            }}
            type="primary"
            style={{ marginRight: 8 }}
          />
          {controllerParamsRemoved.includes(record.id) ?
            <ButtonLoading
              tooltip='Восстановить сертификат'
              color="cyan"
              loading={loading}
              icon={<ReloadOutlined />}
              disabled={!isEdit ||!record.id || (record.node_id && aggregatesRemoved.includes(record.node_id))}
              onClick={() => {
                recucleControllerParam(record);
              }}
            /> :
            <ButtonLoading
              tooltip='Удалить сертификат'
              danger
              loading={loading}
              icon={<DeleteOutlined />}
              disabled={!isEdit ||!record.id || (record.node_id && aggregatesRemoved.includes(record.node_id))}
              onClick={() => {
                removedControllerParam(record);
              }}
            />
            
          }
        </>
      ),
    },
  ];

  const SelectAggregates = useCallback((props: SelectProps) => {
    return <Select 
      {...props}
      defaultValue={null}
      options={[{
        label: 'Сериализация',
        value: null,
      }].concat(
        aggregates.map((aggregate) => ({
          label: aggregate.name,
          value: aggregate.id,
        })).filter((aggregate) => parseInt(aggregate.value ?? '0') > 0)
      )}
    />
  }, [aggregates]);


  const controllerParamExists = (nodeId: number | null, address: number, addressType: string) => {
    const aggregateLevel = aggregates.find((aggregate) => aggregate.id === nodeId)?.level;
    const existingControllerParams = controllerParams.filter(
      (controllerParam) => controllerParam.address === address && controllerParam.address_type === addressType
    ).filter(
      (controllerParam) => aggregates.find((aggregate) => aggregate.id === controllerParam.node_id)?.level === aggregateLevel
    );
    return existingControllerParams.length > 0;
  }

  return (
    <>
      <Form.Item name="aggregates" hidden></Form.Item>
      <Form.Item name="aggregates_removed" hidden></Form.Item>
      
      <Form.Item name="controller_params" hidden></Form.Item>
      <Form.Item name="controller_params_removed" hidden></Form.Item>

      <Space orientation="vertical" style={{ width: '100%' }}>
        <ButtonLoading type="primary" disabled={!isEdit} onClick={() => {
          setControllerParamModalOpen(true)
          controllerParamForm.resetFields()
        }}>
          Добавить параметр
        </ButtonLoading>
        <Table<ProductControllerParam>
          rowKey={(row) => String(row.id ?? row.id)}
          onRow={(record) => {
            const style: React.CSSProperties = {
              backgroundColor: String(record.id).startsWith(keyPrefix) ? 'rgba(0, 255, 0, 0.1)' : '',
            }
            if (record.node_id && aggregatesRemoved.includes(record.node_id)) {
              style.textDecoration = 'line-through';
            }
            if (controllerParamsRemoved.includes(record.id)) {
              style.textDecoration = 'line-through';
            }
            return {
              style
            }
          }}
          columns={controllerParamColumns}
          dataSource={controllerParams}
          loading={loading}
          pagination={false}
          locale={{ emptyText: 'Нет сертификатов' }}
          size="small"
        />
      </Space>

      <Modal
        open={controllerParamModalOpen}
        title={controllerParamForm.getFieldValue('id') ? 'Редактировать параметр' : 'Добавить параметр'}
        onCancel={() => setControllerParamModalOpen(false)}
        footer={[
            <ButtonLoading key="cancel" onClick={() => setControllerParamModalOpen(false)}>
              Отмена
            </ButtonLoading>,
            <ButtonLoading
              key="save"
              type="primary"
              loading={loading}
              onClick={async () => {
                const values = await controllerParamForm.validateFields();
                submitControllerParam(values);
                setControllerParamModalOpen(false);
                controllerParamForm.resetFields();
              }}
            >
              {controllerParamForm.getFieldValue('id')? 'Сохранить': 
              'Добавить'}
            </ButtonLoading>,
        ]}
      >
        <Form form={controllerParamForm} labelCol={{ span: 8 }} initialValues={{
          node_name: 'Сериализация',
          node_id: null,
          address_type: 'register',
          address: 0,
          value: 0,
          description: '',
        }}>
          <Form.Item name="id" hidden />
          <Form.Item name="node_name" hidden />
          <Form.Item name="node_id" label="Фасовка" style={{ marginBottom: 4 }} rules={[
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (controllerParamExists(value, getFieldValue('address'), getFieldValue('address_type'))) {
                  return Promise.reject(new Error('Такой параметр уже существует'));
                }
                return Promise.resolve();
              },
            }),
          ]}>
            <SelectAggregates onChange={(value) => {
              if (value) {
                controllerParamForm.setFieldValue('node_name', aggregates.find((aggregate) => aggregate.id === value)?.name ?? '');
              } else {
                controllerParamForm.setFieldValue('node_name', 'Сериализация');
              }
            }} />
          </Form.Item>
          <Form.Item name="address_type" label="Тип" style={{ marginBottom: 4 }} rules={[
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (controllerParamExists(getFieldValue('node_id'), getFieldValue('address'), value)) {
                  return Promise.reject(new Error('Такой параметр уже существует'));
                }
                return Promise.resolve();
              },
            }),
          ]}>
            <SelectProductControllerAddressType />
          </Form.Item>
          <Form.Item name="address" label="Адрес" style={{ marginBottom: 4 }} rules={[
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (controllerParamExists(getFieldValue('node_id'), value, getFieldValue('address_type'))) {
                  return Promise.reject(new Error('Такой параметр уже существует'));
                }
                return Promise.resolve();
              },
            }),
          ]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="value" label="Значение" style={{ marginBottom: 4 }}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="Описание" style={{ marginBottom: 4 }}>
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
